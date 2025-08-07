import { json, type RequestHandler } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import z from "zod";

// Custom Zod schemas for API validation
const TimeSelectionSchema = z.object({
    startTime: z.string().transform((val) => new Date(val)),
    endTime: z.string().transform((val) => new Date(val))
});

const UpdateEventSchema = z.object({
    timezone: z.string().min(1).optional(),
    availableTime: TimeSelectionSchema.optional(),
    weeklyRecurrence: z.boolean().optional()
});

// Helper function to get authenticated user
async function getAuthenticatedUser(request: Request) {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session?.user) {
        return null;
    }

    return session.user;
}

// GET /api/events/[id] - Get a single event
export const GET: RequestHandler = async ({ params }) => {
    try {
        const eventId = params.id;

        if (!eventId) {
            return json({ error: "Event ID is required" }, { status: 400 });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                userTimeSelection: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        });

        if (!event) {
            return json({ error: "Event not found" }, { status: 404 });
        }

        return json({ event });
    } catch (error) {
        console.error("Error fetching event:", error);
        return json({ error: "Internal server error" }, { status: 500 });
    }
};

// PUT /api/events/[id] - Update an event (requires authentication and ownership)
export const PUT: RequestHandler = async ({ params, request }) => {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return json({ error: "Authentication required" }, { status: 401 });
        }

        const eventId = params.id;

        if (!eventId) {
            return json({ error: "Event ID is required" }, { status: 400 });
        }

        // Check if event exists and user is the organizer
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            select: { organizerId: true }
        });

        if (!existingEvent) {
            return json({ error: "Event not found" }, { status: 404 });
        }

        if (existingEvent.organizerId !== user.id) {
            return json(
                { error: "Only the event organizer can update this event" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = UpdateEventSchema.parse(body);

        // Filter out undefined values
        const updateData = Object.fromEntries(
            Object.entries(validatedData).filter(([, value]) => value !== undefined)
        );

        if (Object.keys(updateData).length === 0) {
            return json({ error: "No valid fields to update" }, { status: 400 });
        }

        const event = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
            include: {
                organizer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        userTimeSelection: true
                    }
                }
            }
        });

        return json({ event });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return json({ error: "Invalid input data", details: error.issues }, { status: 400 });
        }

        console.error("Error updating event:", error);
        return json({ error: "Internal server error" }, { status: 500 });
    }
};

// DELETE /api/events/[id] - Delete an event (requires authentication and ownership)
export const DELETE: RequestHandler = async ({ params, request }) => {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return json({ error: "Authentication required" }, { status: 401 });
        }

        const eventId = params.id;

        if (!eventId) {
            return json({ error: "Event ID is required" }, { status: 400 });
        }

        // Check if event exists and user is the organizer
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            select: { organizerId: true }
        });

        if (!existingEvent) {
            return json({ error: "Event not found" }, { status: 404 });
        }

        if (existingEvent.organizerId !== user.id) {
            return json(
                { error: "Only the event organizer can delete this event" },
                { status: 403 }
            );
        }

        await prisma.event.delete({
            where: { id: eventId }
        });

        return json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        return json({ error: "Internal server error" }, { status: 500 });
    }
};
