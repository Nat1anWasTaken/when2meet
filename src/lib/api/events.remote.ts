import { command, query } from "$app/server";
import { getAuthenticatedSession } from "$lib/api/utils";
import { db } from "$lib/server/db";
import { event, participant } from "$lib/server/db/schema";
import { preservedEventNames } from "$lib/utils";
import { error } from "@sveltejs/kit";
import { and, eq, ilike } from "drizzle-orm";
import z from "zod";

const getEventsSchema = z.object({
    name: z.string()
});

const createEventSchema = z.object({
    name: z.string().refine((val) => !preservedEventNames.includes(val), {
        message: "Event name is reserved."
    }),
    timezone: z.string(),
    organizerName: z.string(),
    availableTime: z.object({
        startTime: z.string().transform((val) => new Date(val)),
        endTime: z.string().transform((val) => new Date(val))
    }),
    weeklyRecurrence: z.boolean()
});

const updateEventSchema = z.object({
    id: z.string(),
    name: z.string().refine((val) => !preservedEventNames.includes(val), {
        message: "Event name is reserved."
    }),
    timezone: z.string(),
    organizerName: z.string(),
    availableTime: z.object({
        startTime: z.string().transform((val) => new Date(val)),
        endTime: z.string().transform((val) => new Date(val))
    }),
    weeklyRecurrence: z.boolean()
});

const deleteEventSchema = z.object({
    id: z.string()
});

export const createEvent = command(createEventSchema, async (data) => {
    const session = await getAuthenticatedSession();

    const newEvent = await db
        .insert(event)
        .values({
            name: data.name,
            timezone: data.timezone,
            organizerName: data.organizerName,
            organizerId: session?.user?.id,
            availableTime: data.availableTime,
            weeklyRecurrence: data.weeklyRecurrence
        })
        .returning();

    return newEvent[0];
});

export const updateEvent = command(updateEventSchema, async (data) => {
    const session = await getAuthenticatedSession();

    if (!session) {
        return error(401, "Unauthorized");
    }

    const updatedEvent = await db
        .update(event)
        .set({
            name: data.name,
            timezone: data.timezone,
            organizerName: data.organizerName,
            availableTime: data.availableTime,
            weeklyRecurrence: data.weeklyRecurrence
        })
        .where(and(eq(event.id, data.id), eq(event.organizerId, session.user.id)))
        .returning();

    if (updatedEvent.length === 0) {
        return error(404, "Event not found or unauthorized");
    }

    return updatedEvent[0];
});

export const deleteEvent = command(deleteEventSchema, async (data) => {
    const session = await getAuthenticatedSession();

    if (!session) {
        return error(401, "Unauthorized");
    }

    const deletedEvent = await db
        .delete(event)
        .where(and(eq(event.id, data.id), eq(event.organizerId, session.user.id)))
        .returning();

    if (deletedEvent.length === 0) {
        return error(404, "Event not found or unauthorized");
    }

    return deletedEvent[0];
});

export const getOrganizedEvents = query(getEventsSchema, async (queries) => {
    const session = await getAuthenticatedSession();

    if (!session) {
        return error(401, "Unauthorized");
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
        return error(401, "Unauthorized");
    }

    const events = await db
        .select()
        .from(event)
        .innerJoin(participant, eq(participant.eventId, event.id))
        .where(
            and(ilike(event.name, `%${queries.name}%`), eq(participant.userId, session.user.id))
        );

    return events;
});
