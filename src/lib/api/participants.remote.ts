import { command } from "$app/server";
import { getAuthenticatedSession } from "$lib/api/utils";
import { db } from "$lib/server/db";
import { participant } from "$lib/server/db/schema";
import { error } from "@sveltejs/kit";
import { and, eq, ne, or } from "drizzle-orm";
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

const updateParticipantSchema = z.object({
    participantId: z.number(),
    username: z.string().min(1, "Name is required").optional(),
    timeSelection: z.array(timeSelectionSchema).optional()
});

export const createParticipant = command(createParticipantSchema, async (data) => {
    const session = await getAuthenticatedSession();

    // Check for existing participation
    const conditions = [eq(participant.username, data.username)];
    if (session?.user?.id) {
        conditions.push(eq(participant.userId, session.user.id));
    }

    const existingParticipant = await db
        .select()
        .from(participant)
        .where(and(eq(participant.eventId, data.eventId), or(...conditions)))
        .limit(1);

    if (existingParticipant.length > 0) {
        error(400, "User has already participated in this event");
    }

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

export const updateParticipant = command(updateParticipantSchema, async (data) => {
    const session = await getAuthenticatedSession();

    // First, get the existing participant to verify ownership
    const existingParticipant = await db
        .select()
        .from(participant)
        .where(eq(participant.id, data.participantId))
        .limit(1);

    if (existingParticipant.length === 0) {
        error(404, "Participant not found");
    }

    const currentParticipant = existingParticipant[0];

    // Check if user has permission to edit (either their own participation or they're authenticated with matching userId)
    const canEdit = !session?.user?.id || currentParticipant.userId === session.user.id;
    if (!canEdit) {
        error(403, "Not authorized to edit this participant");
    }

    // If updating username, check for conflicts with other participants in the same event
    if (data.username && data.username !== currentParticipant.username) {
        const usernameConflict = await db
            .select()
            .from(participant)
            .where(and(
                eq(participant.eventId, currentParticipant.eventId),
                eq(participant.username, data.username),
                ne(participant.id, data.participantId)
            ))
            .limit(1);

        if (usernameConflict.length > 0) {
            error(400, "Username already taken by another participant in this event");
        }
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof participant.$inferInsert> = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.timeSelection !== undefined) updateData.timeSelection = data.timeSelection;

    if (Object.keys(updateData).length === 0) {
        error(400, "No fields provided to update");
    }

    const updatedParticipant = await db
        .update(participant)
        .set(updateData)
        .where(eq(participant.id, data.participantId))
        .returning();

    return updatedParticipant[0];
});
