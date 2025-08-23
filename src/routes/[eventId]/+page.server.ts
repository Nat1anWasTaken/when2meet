import { db } from "$lib/server/db";
import { event, participant } from "$lib/server/db/schema";
import { user } from "$lib/server/db/auth-schema";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
    const { eventId } = params;

    const eventData = (await db.select().from(event).where(eq(event.id, eventId)).limit(1)).at(0);

    if (!eventData) {
        error(404, "Event not found");
    }

    const participants = await db
        .select({
            id: participant.id,
            eventId: participant.eventId,
            username: participant.username,
            userId: participant.userId,
            createdAt: participant.createdAt,
            updatedAt: participant.updatedAt,
            timeSelection: participant.timeSelection,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image
            }
        })
        .from(participant)
        .leftJoin(user, eq(participant.userId, user.id))
        .where(eq(participant.eventId, eventId));

    return {
        ...eventData,
        participants
    };
};
