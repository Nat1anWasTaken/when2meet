import { Buffer } from "node:buffer";
import { Renderer } from "@takumi-rs/core";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { createEventOgCard, type EventOgParticipant } from "$lib/og/event-og-card";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/auth-schema";
import { event, participant } from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

const renderer = new Renderer({ loadDefaultFonts: true });

export const GET: RequestHandler = async ({ params, fetch }) => {
    const { eventId } = params;

    const eventRecord = (await db.select().from(event).where(eq(event.id, eventId)).limit(1)).at(0);

    if (!eventRecord) {
        error(404, "Event not found");
    }

    const participants = await db
        .select({
            username: participant.username,
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

    const tree = createEventOgCard({
        name: eventRecord.name,
        organizerName: eventRecord.organizerName,
        timezone: eventRecord.timezone,
        availableStart,
        availableEnd,
        participants: ogParticipants
    });

    const png = await renderer.render(tree, {
        width: 1024,
        height: 512,
        format: "png",
        fetch
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
    } catch (error) {
        return null;
    }
}
