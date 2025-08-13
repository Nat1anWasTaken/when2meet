import { query } from "$app/server";
import { getAuthenticatedSession } from "$lib/api/utils";
import { db } from "$lib/server/db";
import { event, participant } from "$lib/server/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import z from "zod";

const getEventsSchema = z.object({
    name: z.string()
});

export const getOwnEvents = query(getEventsSchema, async (queries) => {
    const session = await getAuthenticatedSession();

    if (!session) {
        throw new Error("Unauthorized");
    }

    const events = await db
        .select()
        .from(event)
        .where(and(ilike(event.name, `%${queries.name}%`), eq(event.organizerId, session.user.id)));

    return events;
});

export const getParticipatedEvents = query(getEventsSchema, async (queries) => {
    const session = await getAuthenticatedSession();

    if (!session) {
        throw new Error("Unauthorized");
    }

    const events = await db
        .select()
        .from(participant)
        .innerJoin(event, eq(participant.eventId, event.id))
        .where(
            and(ilike(event.name, `%${queries.name}%`), eq(participant.userId, session.user.id))
        );

    return events;
});
