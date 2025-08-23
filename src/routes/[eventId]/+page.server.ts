import { db } from "$lib/server/db";
import { event, participant } from "$lib/server/db/schema";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
    const { eventId } = params;

    const eventData = (await db.select().from(event).where(eq(event.id, eventId)).limit(1)).at(0);

    if (!eventData) {
        error(404, "Event not found");
    }

    const participants = await db.select().from(participant).where(eq(participant.eventId, eventId));

    return {
        ...eventData,
        participants
    };
};
