import { Buffer } from "node:buffer";
import init, { Renderer } from "@takumi-rs/wasm";
import wasmUrl from "@takumi-rs/wasm/takumi_wasm_bg.wasm?url";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import {
    createEventOgCard,
    EVENT_OG_FONT_FAMILY,
    EVENT_OG_FONT_WEIGHTS,
    type EventOgAvailabilityBlock,
    type EventOgParticipant
} from "$lib/og/event-og-card";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/auth-schema";
import { event, participant } from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

type ParticipantRecord = {
    username: string;
    timeSelection: { startTime: Date; endTime: Date }[];
    user: {
        name: string | null;
        image: string | null;
    } | null;
};

type EventOgFontWeight = (typeof EVENT_OG_FONT_WEIGHTS)[number];

const LOCAL_FONT_URL = "/fonts/NotoSansCJK-VF.otf";

let rendererPromise: Promise<Renderer> | null = null;
let fontBinaryPromise: Promise<Uint8Array> | null = null;

function getRenderer(fetchFn: typeof fetch, origin: string): Promise<Renderer> {
    if (!rendererPromise) {
        rendererPromise = initializeRenderer(fetchFn, origin).catch((error) => {
            rendererPromise = null;
            throw error;
        });
    }

    return rendererPromise;
}

async function initializeRenderer(fetchFn: typeof fetch, origin: string): Promise<Renderer> {
    const wasmResource = new URL(wasmUrl, origin).toString();
    await init(wasmResource);
    const renderer = new Renderer();
    await registerFonts(renderer, fetchFn, origin);
    return renderer;
}

async function registerFonts(renderer: Renderer, fetchFn: typeof fetch, origin: string): Promise<void> {
    const data = await loadFontBinary(fetchFn, origin);
    EVENT_OG_FONT_WEIGHTS.forEach((weight) => {
        renderer.loadFont({
            name: EVENT_OG_FONT_FAMILY,
            data,
            weight
        });
    });
}

async function loadFontBinary(fetchFn: typeof fetch, origin: string): Promise<Uint8Array> {
    if (!fontBinaryPromise) {
        fontBinaryPromise = (async () => {
            const fontUrl = new URL(LOCAL_FONT_URL, origin).toString();
            const response = await fetchFn(fontUrl);
            if (!response.ok) {
                throw new Error(`Failed to load OG font from ${fontUrl}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        })();
    }

    return fontBinaryPromise;
}

export const GET: RequestHandler = async ({ params, fetch, request }) => {
    const { eventId } = params;

    const eventRecord = (await db.select().from(event).where(eq(event.id, eventId)).limit(1)).at(0);

    if (!eventRecord) {
        error(404, "Event not found");
    }

    const participants: ParticipantRecord[] = await db
        .select({
            username: participant.username,
            timeSelection: participant.timeSelection,
            user: {
                name: user.name,
                image: user.image
            }
        })
        .from(participant)
        .leftJoin(user, eq(participant.userId, user.id))
        .where(eq(participant.eventId, eventId));

    const ogParticipants: EventOgParticipant[] = await Promise.all(
        participants.map(async (record, index) => ({
            name: record.user?.name ?? record.username,
            image:
                index < 5 && record.user?.image
                    ? await loadImageAsDataUrl(record.user.image, fetch)
                    : null
        }))
    );

    const availableStart = new Date(eventRecord.availableTime.startTime);
    const availableEnd = new Date(eventRecord.availableTime.endTime);
    const availabilityBlocks = buildAvailabilityBlocks(participants, availableStart, availableEnd);

    const tree = createEventOgCard({
        name: eventRecord.name,
        organizerName: eventRecord.organizerName,
        timezone: eventRecord.timezone,
        availableStart,
        availableEnd,
        participants: ogParticipants,
        availabilityBlocks
    });

    const renderer = await getRenderer(fetch, new URL(request.url).origin);

    const png = renderer.render(tree, {
        width: 1024,
        height: 512,
        format: "png"
    });

    const pngBytes = new Uint8Array(png);

    return new Response(pngBytes, {
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=600, s-maxage=86400",
            "Content-Disposition": `inline; filename="${eventId}-og.png"`
        }
    });
};

async function loadImageAsDataUrl(url: string, fetchFn: typeof fetch): Promise<string | null> {
    try {
        if (!url.startsWith("http")) {
            return null;
        }

        const response = await fetchFn(url);
        if (!response.ok) {
            return null;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get("content-type") ?? "image/png";
        const base64 = buffer.toString("base64");
        return `data:${contentType};base64,${base64}`;
    } catch {
        return null;
    }
}

function buildAvailabilityBlocks(
    participants: ParticipantRecord[],
    availableStart: Date,
    availableEnd: Date
): EventOgAvailabilityBlock[] {
    const dayList = enumerateDays(availableStart, availableEnd);

    return dayList.map((day) => {
        const windowStart = clampDateToRange(
            startOfDay(day).getTime(),
            availableStart.getTime(),
            availableEnd.getTime()
        );
        const windowEnd = clampDateToRange(
            endOfDay(day).getTime(),
            availableStart.getTime(),
            availableEnd.getTime()
        );

        if (windowEnd <= windowStart) {
            return {
                date: new Date(day),
                level: 0
            };
        }

        const events: { time: number; delta: number }[] = [];
        let hasAvailability = false;

        participants.forEach((participant) => {
            participant.timeSelection?.forEach((selection) => {
                const selectionStart = new Date(selection.startTime).getTime();
                const selectionEnd = new Date(selection.endTime).getTime();

                const overlapStart = Math.max(windowStart, selectionStart);
                const overlapEnd = Math.min(windowEnd, selectionEnd);
                if (overlapEnd <= overlapStart) {
                    return;
                }

                hasAvailability = true;
                events.push({ time: overlapStart, delta: 1 });
                events.push({ time: overlapEnd, delta: -1 });
            });
        });

        if (!hasAvailability) {
            return {
                date: new Date(day),
                level: 0
            };
        }

        events.sort((a, b) => {
            if (a.time === b.time) {
                return b.delta - a.delta;
            }
            return a.time - b.time;
        });

        let concurrent = 0;
        let peak = 0;
        for (const event of events) {
            concurrent += event.delta;
            peak = Math.max(peak, concurrent);
        }

        const totalParticipants = participants.length;
        const level = Math.max(0, Math.min(totalParticipants, peak));

        return {
            date: new Date(day),
            level
        };
    });
}

function enumerateDays(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = startOfDay(start);
    const finalDay = startOfDay(end);

    while (current.getTime() <= finalDay.getTime()) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

function startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

function endOfDay(date: Date): Date {
    const result = startOfDay(date);
    result.setDate(result.getDate() + 1);
    return result;
}

function clampDateToRange(value: number, min: number, max: number): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}
