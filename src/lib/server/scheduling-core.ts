export class SchedulingError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status = 400
    ) {
        super(message);
        this.name = "SchedulingError";
    }
}

export type AvailabilitySlot = {
    startTime: Date;
    endTime: Date;
};

export function normalizeAvailabilitySlots(slots: AvailabilitySlot[], range: AvailabilitySlot) {
    const oneHour = 60 * 60 * 1000;
    const rangeEndExclusive = range.endTime.getTime() + 1;
    const normalized = new Map<number, AvailabilitySlot>();

    for (const slot of slots) {
        const start = slot.startTime.getTime();
        const end = slot.endTime.getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
            throw new SchedulingError(
                "invalid_availability",
                "Every slot must have a valid range."
            );
        }
        if (
            slot.startTime.getUTCMinutes() !== 0 ||
            slot.startTime.getUTCSeconds() !== 0 ||
            slot.startTime.getUTCMilliseconds() !== 0 ||
            slot.endTime.getUTCMinutes() !== 0 ||
            slot.endTime.getUTCSeconds() !== 0 ||
            slot.endTime.getUTCMilliseconds() !== 0 ||
            (end - start) % oneHour !== 0
        ) {
            throw new SchedulingError(
                "invalid_availability_granularity",
                "Availability must use whole one-hour boundaries."
            );
        }
        if (start < range.startTime.getTime() || end > rangeEndExclusive) {
            throw new SchedulingError(
                "availability_outside_event",
                "Availability must stay inside the event's date range."
            );
        }
        for (let cursor = start; cursor < end; cursor += oneHour) {
            normalized.set(cursor, {
                startTime: new Date(cursor),
                endTime: new Date(cursor + oneHour)
            });
        }
    }

    return [...normalized.values()].sort(
        (left, right) => left.startTime.getTime() - right.startTime.getTime()
    );
}

export function participantCovers(
    selections: AvailabilitySlot[],
    candidateStart: number,
    candidateEnd: number
) {
    const sorted = selections
        .map((slot) => [slot.startTime.getTime(), slot.endTime.getTime()] as const)
        .sort(([left], [right]) => left - right);
    let coveredUntil = candidateStart;
    for (const [start, end] of sorted) {
        if (end <= coveredUntil) continue;
        if (start > coveredUntil) return false;
        coveredUntil = Math.max(coveredUntil, end);
        if (coveredUntil >= candidateEnd) return true;
    }
    return false;
}
