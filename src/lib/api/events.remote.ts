import { query } from "$app/server";
import { getAuthenticatedSession } from "$lib/auth";
import { prisma } from "$lib/db";

export const getEvents = query(async () => {
    const sessionData = await getAuthenticatedSession();

    if (!sessionData) {
        return [];
    }

    const events = await prisma.event.findMany({
        where: { organizerId: sessionData.user.id }
    });

    return events;
});
