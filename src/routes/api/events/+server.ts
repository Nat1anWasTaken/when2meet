import { json, type RequestHandler } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import { z } from "zod";
import { prisma } from "$lib/db";
import {
    TimeSelectionCreateInputObjectSchema
} from "$prisma/zod/schemas/index.js";


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
        
        // Basic validation
        if (!body.timezone || !body.availableTime || typeof body.weeklyRecurrence !== 'boolean') {
            return json({ error: "Missing required fields" }, { status: 400 });
        }
        
        // Transform string dates to Date objects
        const transformedData = {
            timezone: body.timezone,
            availableTime: {
                startTime: new Date(body.availableTime.startTime),
                endTime: new Date(body.availableTime.endTime)
            },
            weeklyRecurrence: body.weeklyRecurrence
        };
        
        // Validate with Prisma schema
        TimeSelectionCreateInputObjectSchema.parse(transformedData.availableTime);

        const event = await prisma.event.create({
            data: {
                timezone: transformedData.timezone,
                availableTime: transformedData.availableTime,
                weeklyRecurrence: transformedData.weeklyRecurrence,
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
