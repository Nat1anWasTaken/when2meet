import { json, type RequestHandler } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import z from "zod";

// Custom Zod schemas for API validation
const TimeSelectionSchema = z.object({
    startTime: z.string().transform((val) => new Date(val)),
    endTime: z.string().transform((val) => new Date(val))
});

const CreateEventSchema = z.object({
    timezone: z.string().min(1, "Timezone is required"),
    availableTime: TimeSelectionSchema,
    weeklyRecurrence: z.boolean()
});

const GetEventsQuerySchema = z.object({
    organizerId: z.string().optional(),
    limit: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0 && val <= 100, {
            message: "Limit must be between 1 and 100"
        })
        .optional(),
    offset: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 0, {
            message: "Offset must be non-negative"
        })
        .optional()
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

// GET /api/events - List events with optional filtering
export const GET: RequestHandler = async ({ url }) => {
    try {
        const queryParams = Object.fromEntries(url.searchParams);
        const validatedQuery = GetEventsQuerySchema.parse(queryParams);

        const where = validatedQuery.organizerId ? { organizerId: validatedQuery.organizerId } : {};
        const limit = validatedQuery.limit || 20;
        const offset = validatedQuery.offset || 0;

        const events = await prisma.event.findMany({
            where,
            take: limit,
            skip: offset,
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
            },
            orderBy: {
                id: "desc"
            }
        });

        const total = await prisma.event.count({ where });

        return json({
            events,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return json(
                { error: "Invalid query parameters", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error fetching events:", error);
        return json({ error: "Internal server error" }, { status: 500 });
    }
};

// POST /api/events - Create a new event (requires authentication)
export const POST: RequestHandler = async ({ request }) => {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = CreateEventSchema.parse(body);

        const event = await prisma.event.create({
            data: {
                timezone: validatedData.timezone,
                availableTime: validatedData.availableTime,
                weeklyRecurrence: validatedData.weeklyRecurrence,
                organizerId: user.id
            },
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

        return json({ event }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return json({ error: "Invalid input data", details: error.issues }, { status: 400 });
        }

        console.error("Error creating event:", error);
        return json({ error: "Internal server error" }, { status: 500 });
    }
};
