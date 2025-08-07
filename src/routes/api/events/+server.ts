import { json, type RequestHandler } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import { prisma } from "$lib/auth";
import z from "zod";

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

// GET /api/events - List all events for authenticated user
export const GET: RequestHandler = async ({ request }) => {
    const user = await getAuthenticatedUser(request);

    if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizedEvents = await prisma.event.findMany({
        where: {
            organizerId: user.id
        }
    });

    const attendedEvents = await prisma.participant.findMany({
        where: {
            userId: user.id
        }
    });

    return json({
        organizedEvents,
        attendedEvents
    });
};

// POST /api/events - Create a new event for authenticated user
export const POST: RequestHandler = async ({ request }) => {
    const user = await getAuthenticatedUser(request);

    if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.title || !data.date || !data.location) {
        return json({ error: "Missing required fields" }, { status: 400 });
    }

    const newEvent = await prisma.event.create({
        data: {
            timezone: data.timezone
        }
    });

    return json(newEvent, { status: 201 });
};
