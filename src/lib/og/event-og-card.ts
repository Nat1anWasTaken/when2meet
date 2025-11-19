import type { Node } from "@takumi-rs/helpers";
import { container, image, text } from "@takumi-rs/helpers";
import { generateAvailabilityColorMap } from "$lib/utils";

export type EventOgParticipant = {
    name: string;
    image?: string | null;
};

export type EventOgAvailabilityBlock = {
    date: Date;
    level: number;
};

export type EventOgCardPayload = {
    name: string;
    organizerName: string;
    timezone: string;
    availableStart: Date;
    availableEnd: Date;
    participants: EventOgParticipant[];
    availabilityBlocks: EventOgAvailabilityBlock[];
};

const palette = {
    background: "#f5f4fb",
    card: "#ffffff",
    border: "#e6e1f4",
    muted: "#6f6c86",
    text: "#1f1b32",
    primary: "#5f4dee"
};

const brand = {
    name: "when2meet",
    extension: ".app"
};

const CANVAS = { width: 1024, height: 512, padding: 64 } as const;

export function createEventOgCard(payload: EventOgCardPayload): Node {
    const {
        name,
        organizerName,
        timezone,
        availableStart,
        availableEnd,
        participants,
        availabilityBlocks
    } = payload;

    const dateRange = formatDateRange(availableStart, availableEnd, timezone);
    const timezoneLabel = formatTimezoneLabel(timezone, availableStart);
    const participantSummary = summarizeParticipants(participants);

    return container({
        style: {
            width: CANVAS.width,
            height: CANVAS.height,
            backgroundColor: palette.background,
            display: "flex",
            flexDirection: "column",
            gap: 0,
            color: palette.text,
            fontFamily: "'Plus Jakarta Sans', 'Geist', 'Inter', sans-serif"
        },
        children: [
            container({
                style: {
                    flex: 1,
                    minHeight: 0,
                    padding: CANVAS.padding,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 32
                },
                children: [
                    buildHeader({ name, organizerName }),
                    buildFooter({
                        dateRange,
                        timezoneLabel,
                        participants,
                        participantSummary,
                        availableStart,
                        availableEnd,
                        timezone
                    })
                ]
            }),
            container({
                style: {
                    width: "100%",
                    padding: `0 ${CANVAS.padding}px 16px`,
                    boxSizing: "border-box",
                    display: "flex"
                },
                children: [
                    container({
                        style: {
                            width: "100%",
                            display: "flex"
                        },
                        children: [
                            buildAvailabilityLabels({ availableStart, availableEnd, timezone })
                        ]
                    })
                ]
            }),
            buildAvailabilityStripe({
                blocks: availabilityBlocks,
                availableStart,
                totalParticipants: participants.length
            })
        ]
    });
}

function buildHeader({
    name,
    organizerName
}: {
    name: string;
    organizerName: string;
}): Node {
    return container({
        style: {
            display: "flex",
            flexDirection: "column",
            gap: 24
        },
        children: [
            container({
                style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 24,
                    width: "100%"
                },
                children: [
                    container({
                        style: {
                            flex: 1,
                            minWidth: 0
                        },
                        children: [
                            text(name, {
                                fontSize: 68,
                                fontWeight: 700,
                                lineHeight: 1.05,
                                whiteSpace: "normal",
                                wordBreak: "break-word"
                            })
                        ]
                    }),
                    container({
                        style: {
                            display: "flex",
                            flexDirection: "row",
                            gap: 0,
                            alignItems: "baseline",
                            flexShrink: 0
                        },
                        children: [
                            text(brand.name, {
                                fontSize: 32,
                                fontWeight: 800,
                                letterSpacing: -0.8
                            }),
                            text(brand.extension, {
                                fontSize: 32,
                                fontWeight: 800,
                                color: palette.primary,
                                letterSpacing: -0.8
                            })
                        ]
                    })
                ]
            }),
            text(`by ${organizerName}`, {
                fontSize: 24,
                color: palette.muted,
                fontWeight: 500
            })
        ]
    });
}

function buildFooter({
    dateRange,
    timezoneLabel,
    participants,
    participantSummary,
    availableStart,
    availableEnd,
    timezone
}: {
    dateRange: string;
    timezoneLabel: string;
    participants: EventOgParticipant[];
    participantSummary: string;
    availableStart: Date;
    availableEnd: Date;
    timezone: string;
}): Node {
    return container({
        style: {
            display: "flex",
            flexDirection: "column",
            gap: 24,
            width: "100%"
        },
        children: [
            container({
                style: {
                    display: "flex",
                    flexDirection: "row",
                    gap: 20,
                    justifyContent: "space-between",
                    width: "100%"
                },
                children: [
                    buildInfoBlock("Available dates", dateRange),
                    buildInfoBlock("Timezone", timezoneLabel),
                    buildParticipantsBlock(participants, participantSummary)
                ]
            })
        ]
    });
}

function buildInfoBlock(label: string, value: string): Node {
    return container({
        style: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 8
        },
        children: [
            text(label, {
                fontSize: 14,
                letterSpacing: 1,
                color: palette.muted,
                textTransform: "uppercase"
            }),
            text(value, {
                fontSize: 28,
                fontWeight: 600
            })
        ]
    });
}

function buildParticipantsBlock(participants: EventOgParticipant[], summary: string): Node {
    if (participants.length === 0) {
        return container({
            style: {
                flex: 1.3,
                alignItems: "center",
                justifyContent: "center"
            },
            children: [
                text("Waiting for RSVPs", {
                    fontSize: 18,
                    color: palette.muted,
                    fontWeight: 500
                })
            ]
        });
    }

    const avatarNodes = participants.slice(0, 5).map((participant, index) =>
        buildAvatarNode(participant, index)
    );

    return container({
        style: {
            flex: 1.3,
            display: "flex",
            flexDirection: "column",
            gap: 12
        },
        children: [
            text("Participants", {
                fontSize: 14,
                letterSpacing: 1,
                color: palette.muted,
                textTransform: "uppercase"
            }),
            container({
                style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    height: 72
                },
                children: avatarNodes
            }),
            text(summary, {
                fontSize: 18,
                fontWeight: 600,
                color: palette.text
            })
        ]
    });
}

function buildAvatarNode(participant: EventOgParticipant, index: number): Node {
    const baseStyle = {
        width: 70,
        height: 70,
        borderRadius: 999,
        marginLeft: index === 0 ? 0 : -20,
        boxShadow: "0 16px 32px rgba(32, 24, 79, 0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: palette.primary
    } as const;

    if (participant.image) {
        return container({
            style: baseStyle,
            children: [
                image({
                    src: participant.image,
                    width: 70,
                    height: 70,
                    style: {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%"
                    }
                })
            ]
        });
    }

    return container({
        style: baseStyle,
        children: [
            text(getInitials(participant.name), {
                fontSize: 24,
                fontWeight: 700,
                color: "#ffffff"
            })
        ]
    });
}

function formatDateRange(start: Date, end: Date, timeZone: string): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone
    });

    const sameDay = isSameDay(start, end, timeZone);
    if (sameDay) {
        return formatter.format(start);
    }

    return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function isSameDay(dateA: Date, dateB: Date, timeZone: string): boolean {
    const formatter = new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone
    });

    return formatter.format(dateA) === formatter.format(dateB);
}

function formatTimezoneLabel(timeZone: string, date: Date): string {
    const offset = extractOffset(timeZone, date);
    const readable = prettifyTimezone(timeZone);
    return `${readable} (${offset})`;
}

function extractOffset(timeZone: string, date: Date): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "shortOffset"
    });

    const match = formatter
        .formatToParts(date)
        .find((part) => part.type === "timeZoneName")?.value;

    if (!match) {
        return "UTC";
    }

    return match.replace("GMT", "UTC");
}

function prettifyTimezone(timeZone: string): string {
    if (!timeZone.includes("/")) {
        return timeZone.replace(/_/g, " ");
    }

    const [region, city] = timeZone.split("/");
    if (!city) {
        return region.replace(/_/g, " ");
    }

    return `${city.replace(/_/g, " ")}, ${region.replace(/_/g, " ")}`;
}

function summarizeParticipants(participants: EventOgParticipant[]): string {
    if (participants.length === 0) {
        return "Be the first to respond";
    }

    const visible = participants.slice(0, 3).map((participant) => participant.name);
    const remaining = participants.length - visible.length;

    if (remaining <= 0) {
        return visible.join(", ");
    }

    return `${visible.join(", ")} +${remaining} more`;
}

function buildAvailabilityLabels({
    availableStart,
    availableEnd,
    timezone
}: {
    availableStart: Date;
    availableEnd: Date;
    timezone: string;
}): Node {
    const startLabel = formatTimelineLabel(availableStart, timezone);
    const endLabel = formatTimelineLabel(availableEnd, timezone);

    return container({
        style: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            fontSize: 14,
            color: palette.muted,
            textTransform: "uppercase",
            letterSpacing: 1
        },
        children: [
            text(startLabel, {
                fontSize: 14,
                color: palette.muted,
                fontWeight: 600
            }),
            text(endLabel, {
                fontSize: 14,
                color: palette.muted,
                fontWeight: 600
            })
        ]
    });
}

function buildAvailabilityStripe({
    blocks,
    availableStart,
    totalParticipants
}: {
    blocks: EventOgAvailabilityBlock[];
    availableStart: Date;
    totalParticipants: number;
}): Node {
    const colorMap = generateAvailabilityColorMap(totalParticipants, 277, "light");
    colorMap.set(0, palette.primary);

    const segments = (blocks.length > 0 ? blocks : [{ date: availableStart, level: 0 }]).map(
        (block) =>
            container({
                style: {
                    flex: 1,
                    height: "100%",
                    backgroundColor: colorMap.get(block.level) ?? palette.primary
                }
            })
    );

    return container({
        style: {
            display: "flex",
            flexDirection: "row",
            width: "100%",
            height: 24,
            flexBasis: 24,
            overflow: "hidden",
            flexShrink: 0
        },
        children: segments
    });
}

function formatTimelineLabel(date: Date, timeZone: string): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone
    });

    return formatter.format(date);
}

function getInitials(name: string): string {
    const segments = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (segments.length === 0) {
        return "?";
    }

    return segments.map((segment) => segment.charAt(0).toUpperCase()).join("");
}
