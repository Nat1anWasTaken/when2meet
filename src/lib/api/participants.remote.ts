import { command } from "$app/server";
import { getAuthenticatedSession } from "$lib/api/utils";
import { db } from "$lib/server/db";
import { participant } from "$lib/server/db/schema";
import { error } from "@sveltejs/kit";
import z from "zod";

const timeSelectionSchema = z.object({
    startTime: z.string().transform((val) => new Date(val)),
    endTime: z.string().transform((val) => new Date(val))
});

const createParticipantSchema = z.object({
    eventId: z.string(),
    username: z.string().min(1, "Name is required"),
    timeSelection: z.array(timeSelectionSchema)
});

export const createParticipant = command(createParticipantSchema, async (data) => {
    const session = await getAuthenticatedSession();

    const newParticipant = await db
        .insert(participant)
        .values({
            eventId: data.eventId,
            username: data.username,
            userId: session?.user?.id || null,
            timeSelection: data.timeSelection
        })
        .returning();

    return newParticipant[0];
});
