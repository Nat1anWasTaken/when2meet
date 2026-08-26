import { createHash } from "node:crypto";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/auth-schema";
import { event, mcpOperation, participant } from "$lib/server/db/schema";
import { preservedEventNames } from "$lib/utils";
import { and, eq, ilike, ne } from "drizzle-orm";
import {
    normalizeAvailabilitySlots,
    participantCovers,
    SchedulingError,
    type AvailabilitySlot
} from "./scheduling-core";

export { SchedulingError } from "./scheduling-core";
export type { AvailabilitySlot } from "./scheduling-core";

export type SerializableEvent = Omit<typeof event.$inferSelect, "availableTime"> & {
    availableTime: { startTime: string; endTime: string };
};

export type EventDetail = {
    event: SerializableEvent;
    participants: Array<{
        id: number;
        displayName: string;
        isCurrentUser: boolean;
        timeSelection: Array<{ startTime: string; endTime: string }>;
    }>;
    callerRole: {
        organizer: boolean;
        participant: boolean;
    };
};

function serializeEvent(value: typeof event.$inferSelect): SerializableEvent {
    return {
        ...value,
        availableTime: {
            startTime: value.availableTime.startTime.toISOString(),
            endTime: value.availableTime.endTime.toISOString()
        }
    };
}

function serializeSlots(slots: AvailabilitySlot[]) {
    return slots.map((slot) => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString()
    }));
}

function normalizedName(value: string, field: string) {
    const normalized = value.trim();
    if (!normalized) {
        throw new SchedulingError("invalid_input", `${field} is required.`);
    }
    return normalized;
}

function validTimezone(timezone: string) {
    try {
        new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
        return true;
    } catch {
        return false;
    }
}

function validateEventFields(input: {
    name: string;
    organizerName: string;
    timezone: string;
    availableTime: AvailabilitySlot;
}) {
    const name = normalizedName(input.name, "Event name");
    const organizerName = normalizedName(input.organizerName, "Organizer name");
    if (preservedEventNames.includes(name.toLowerCase())) {
        throw new SchedulingError("reserved_event_name", "That event name is reserved.");
    }
    if (!validTimezone(input.timezone)) {
        throw new SchedulingError("invalid_timezone", "Provide a valid IANA timezone.");
    }
    if (
        !Number.isFinite(input.availableTime.startTime.getTime()) ||
        !Number.isFinite(input.availableTime.endTime.getTime()) ||
        input.availableTime.startTime >= input.availableTime.endTime
    ) {
        throw new SchedulingError(
            "invalid_time_range",
            "The available start must be before the available end."
        );
    }

    return { name, organizerName };
}

async function getUser(userId: string) {
    const found = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!found[0]) {
        throw new SchedulingError("user_not_found", "The authorized user no longer exists.", 401);
    }
    return found[0];
}

export async function listMyEvents(
    userId: string,
    input: {
        query?: string;
        role: "all" | "organizer" | "participant";
        limit: number;
        offset: number;
    }
) {
    const query = input.query?.trim();
    const nameCondition = query ? ilike(event.name, `%${query}%`) : undefined;
    const results = new Map<
        string,
        { event: SerializableEvent; organizer: boolean; participant: boolean }
    >();

    if (input.role !== "participant") {
        const conditions = [eq(event.organizerId, userId)];
        if (nameCondition) conditions.push(nameCondition);
        const organized = await db
            .select()
            .from(event)
            .where(and(...conditions));
        for (const item of organized) {
            results.set(item.id, {
                event: serializeEvent(item),
                organizer: true,
                participant: false
            });
        }
    }

    if (input.role !== "organizer") {
        const conditions = [eq(participant.userId, userId)];
        if (nameCondition) conditions.push(nameCondition);
        const participated = await db
            .select({ event })
            .from(event)
            .innerJoin(participant, eq(participant.eventId, event.id))
            .where(and(...conditions));
        for (const { event: item } of participated) {
            const existing = results.get(item.id);
            results.set(item.id, {
                event: serializeEvent(item),
                organizer: existing?.organizer ?? false,
                participant: true
            });
        }
    }

    const all = [...results.values()].sort(
        (left, right) =>
            left.event.name.localeCompare(right.event.name) ||
            left.event.id.localeCompare(right.event.id)
    );

    return {
        items: all.slice(input.offset, input.offset + input.limit),
        total: all.length,
        offset: input.offset,
        limit: input.limit,
        hasMore: input.offset + input.limit < all.length
    };
}

export async function getEventDetail(eventId: string, userId: string): Promise<EventDetail> {
    const records = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
    const found = records[0];
    if (!found) {
        throw new SchedulingError("event_not_found", "Event not found.", 404);
    }

    const participants = await db
        .select()
        .from(participant)
        .where(eq(participant.eventId, eventId));

    return {
        event: serializeEvent(found),
        participants: participants.map((item) => ({
            id: item.id,
            displayName: item.username,
            isCurrentUser: item.userId === userId,
            timeSelection: serializeSlots(item.timeSelection)
        })),
        callerRole: {
            organizer: found.organizerId === userId,
            participant: participants.some((item) => item.userId === userId)
        }
    };
}

function requestHash(value: unknown) {
    return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function createEventForUser(
    userId: string,
    input: {
        operationKey: string;
        name: string;
        organizerName?: string;
        timezone: string;
        availableTime: AvailabilitySlot;
    }
): Promise<{ event: SerializableEvent; replayed: boolean }> {
    const currentUser = await getUser(userId);
    const validated = validateEventFields({
        ...input,
        organizerName: input.organizerName ?? currentUser.name
    });
    const normalized = {
        operationKey: input.operationKey,
        name: validated.name,
        organizerName: validated.organizerName,
        timezone: input.timezone,
        availableTime: {
            startTime: input.availableTime.startTime.toISOString(),
            endTime: input.availableTime.endTime.toISOString()
        }
    };
    const hash = requestHash(normalized);

    return db.transaction(async (tx) => {
        const claimed = await tx
            .insert(mcpOperation)
            .values({
                userId,
                toolName: "create_event",
                operationKey: input.operationKey,
                requestHash: hash
            })
            .onConflictDoNothing()
            .returning({ id: mcpOperation.id });

        if (!claimed[0]) {
            const existing = await tx
                .select()
                .from(mcpOperation)
                .where(
                    and(
                        eq(mcpOperation.userId, userId),
                        eq(mcpOperation.toolName, "create_event"),
                        eq(mcpOperation.operationKey, input.operationKey)
                    )
                )
                .limit(1);
            if (!existing[0] || !existing[0].result) {
                throw new SchedulingError(
                    "operation_in_progress",
                    "The original create operation is still being completed.",
                    409
                );
            }
            if (existing[0].requestHash !== hash) {
                throw new SchedulingError(
                    "operation_key_conflict",
                    "This operation key was already used with different event data.",
                    409
                );
            }
            return {
                event: existing[0].result.event as SerializableEvent,
                replayed: true
            };
        }

        const created = await tx
            .insert(event)
            .values({
                name: validated.name,
                timezone: input.timezone,
                organizerName: validated.organizerName,
                organizerId: userId,
                availableTime: input.availableTime,
                weeklyRecurrence: false
            })
            .returning();
        const serialized = serializeEvent(created[0]);
        await tx
            .update(mcpOperation)
            .set({ result: { event: serialized } })
            .where(eq(mcpOperation.id, claimed[0].id));

        return { event: serialized, replayed: false };
    });
}

export async function updateEventForUser(
    userId: string,
    eventId: string,
    changes: Partial<{
        name: string;
        organizerName: string;
        timezone: string;
        availableTime: AvailabilitySlot;
    }>
) {
    const records = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
    const existing = records[0];
    if (!existing || existing.organizerId !== userId) {
        throw new SchedulingError(
            "event_not_found_or_forbidden",
            "The event does not exist or is not organized by the authorized user.",
            403
        );
    }
    const merged = {
        name: changes.name ?? existing.name,
        organizerName: changes.organizerName ?? existing.organizerName,
        timezone: changes.timezone ?? existing.timezone,
        availableTime: changes.availableTime ?? existing.availableTime
    };
    const validated = validateEventFields(merged);
    const updated = await db
        .update(event)
        .set({
            name: validated.name,
            organizerName: validated.organizerName,
            timezone: merged.timezone,
            availableTime: merged.availableTime
        })
        .where(and(eq(event.id, eventId), eq(event.organizerId, userId)))
        .returning();
    return serializeEvent(updated[0]);
}

export async function setMyAvailability(
    userId: string,
    input: { eventId: string; displayName?: string; slots: AvailabilitySlot[] }
) {
    const currentUser = await getUser(userId);
    const events = await db.select().from(event).where(eq(event.id, input.eventId)).limit(1);
    const currentEvent = events[0];
    if (!currentEvent) {
        throw new SchedulingError("event_not_found", "Event not found.", 404);
    }
    const existing = await db
        .select()
        .from(participant)
        .where(and(eq(participant.eventId, input.eventId), eq(participant.userId, userId)))
        .limit(1);
    const displayName = normalizedName(
        input.displayName ?? existing[0]?.username ?? currentUser.name,
        "Display name"
    );
    const conflicts = await db
        .select({ id: participant.id })
        .from(participant)
        .where(
            and(
                eq(participant.eventId, input.eventId),
                eq(participant.username, displayName),
                existing[0] ? ne(participant.id, existing[0].id) : undefined
            )
        )
        .limit(1);
    if (conflicts[0]) {
        throw new SchedulingError(
            "display_name_taken",
            "Another participant in this event already uses that display name."
        );
    }
    const slots = normalizeAvailabilitySlots(input.slots, currentEvent.availableTime);

    if (existing[0]) {
        const updated = await db
            .update(participant)
            .set({ username: displayName, timeSelection: slots })
            .where(and(eq(participant.id, existing[0].id), eq(participant.userId, userId)))
            .returning();
        return { participant: updated[0], joined: false };
    }

    const created = await db
        .insert(participant)
        .values({
            eventId: input.eventId,
            username: displayName,
            userId,
            timeSelection: slots
        })
        .returning();
    return { participant: created[0], joined: true };
}

export async function findBestTimes(
    eventId: string,
    userId: string,
    durationMinutes: number,
    limit: number
) {
    const detail = await getEventDetail(eventId, userId);
    const duration = durationMinutes * 60 * 1000;
    const hour = 60 * 60 * 1000;
    const rangeStart = new Date(detail.event.availableTime.startTime).getTime();
    const rangeEnd = new Date(detail.event.availableTime.endTime).getTime() + 1;
    const firstCandidate = Math.ceil(rangeStart / hour) * hour;
    const candidates: Array<{
        startTime: string;
        endTime: string;
        participantCount: number;
        participants: string[];
    }> = [];

    for (let start = firstCandidate; start + duration <= rangeEnd; start += hour) {
        const end = start + duration;
        const available = detail.participants.filter((item) =>
            participantCovers(
                item.timeSelection.map((slot) => ({
                    startTime: new Date(slot.startTime),
                    endTime: new Date(slot.endTime)
                })),
                start,
                end
            )
        );
        candidates.push({
            startTime: new Date(start).toISOString(),
            endTime: new Date(end).toISOString(),
            participantCount: available.length,
            participants: available.map((item) => item.displayName)
        });
    }

    candidates.sort(
        (left, right) =>
            right.participantCount - left.participantCount ||
            left.startTime.localeCompare(right.startTime)
    );
    return {
        event: detail.event,
        durationMinutes,
        totalParticipants: detail.participants.length,
        candidates: candidates.slice(0, limit)
    };
}
