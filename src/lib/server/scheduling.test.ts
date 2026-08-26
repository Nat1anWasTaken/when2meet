import { describe, expect, it } from "vitest";
import { normalizeAvailabilitySlots, participantCovers, SchedulingError } from "./scheduling-core";

const at = (value: string) => new Date(value);

describe("MCP scheduling helpers", () => {
    it("expands ranges into sorted, de-duplicated one-hour slots", () => {
        const slots = normalizeAvailabilitySlots(
            [
                {
                    startTime: at("2026-08-26T10:00:00Z"),
                    endTime: at("2026-08-26T12:00:00Z")
                },
                {
                    startTime: at("2026-08-26T09:00:00Z"),
                    endTime: at("2026-08-26T11:00:00Z")
                }
            ],
            {
                startTime: at("2026-08-26T00:00:00Z"),
                endTime: at("2026-08-26T23:59:59.999Z")
            }
        );

        expect(slots.map((slot) => slot.startTime.toISOString())).toEqual([
            "2026-08-26T09:00:00.000Z",
            "2026-08-26T10:00:00.000Z",
            "2026-08-26T11:00:00.000Z"
        ]);
    });

    it("rejects availability outside the event range", () => {
        expect(() =>
            normalizeAvailabilitySlots(
                [
                    {
                        startTime: at("2026-08-27T00:00:00Z"),
                        endTime: at("2026-08-27T01:00:00Z")
                    }
                ],
                {
                    startTime: at("2026-08-26T00:00:00Z"),
                    endTime: at("2026-08-26T23:59:59.999Z")
                }
            )
        ).toThrowError(SchedulingError);
    });

    it("allows an empty replacement to clear the user's availability", () => {
        expect(
            normalizeAvailabilitySlots([], {
                startTime: at("2026-08-26T00:00:00Z"),
                endTime: at("2026-08-26T23:59:59.999Z")
            })
        ).toEqual([]);
    });

    it("requires continuous coverage for multi-hour candidates", () => {
        const candidateStart = at("2026-08-26T09:00:00Z").getTime();
        const candidateEnd = at("2026-08-26T12:00:00Z").getTime();

        expect(
            participantCovers(
                [
                    {
                        startTime: at("2026-08-26T09:00:00Z"),
                        endTime: at("2026-08-26T10:00:00Z")
                    },
                    {
                        startTime: at("2026-08-26T10:00:00Z"),
                        endTime: at("2026-08-26T12:00:00Z")
                    }
                ],
                candidateStart,
                candidateEnd
            )
        ).toBe(true);

        expect(
            participantCovers(
                [
                    {
                        startTime: at("2026-08-26T09:00:00Z"),
                        endTime: at("2026-08-26T10:00:00Z")
                    },
                    {
                        startTime: at("2026-08-26T11:00:00Z"),
                        endTime: at("2026-08-26T12:00:00Z")
                    }
                ],
                candidateStart,
                candidateEnd
            )
        ).toBe(false);
    });
});
