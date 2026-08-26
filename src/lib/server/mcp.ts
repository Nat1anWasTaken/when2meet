import { auth, MCP_RESOURCE_SCOPES, MCP_RESOURCE_URL } from "$lib/auth";
import {
    createEventForUser,
    findBestTimes,
    getEventDetail,
    listMyEvents,
    SchedulingError,
    setMyAvailability,
    updateEventForUser
} from "$lib/server/scheduling";
import { requireMcpAuth } from "@better-auth/mcp";
import {
    createMcpHandler,
    McpServer,
    type AuthInfo,
    type CallToolResult
} from "@modelcontextprotocol/server";
import { z } from "zod";

const eventId = z.string().trim().min(1).describe("The exact event invite ID.");
const dateTime = z
    .string()
    .datetime({ offset: true })
    .describe("An RFC 3339 timestamp with an explicit UTC offset.");

function eventUrl(id: string, invited = false) {
    const url = new URL(`/${encodeURIComponent(id)}`, MCP_RESOURCE_URL);
    if (invited) url.searchParams.set("invited", "true");
    return url.toString();
}

function successful(summary: string, data: Record<string, unknown>): CallToolResult {
    return {
        content: [{ type: "text", text: summary }],
        structuredContent: { status: "success", summary, ...data }
    };
}

function failed(error: unknown): CallToolResult {
    if (error instanceof SchedulingError) {
        return {
            isError: true,
            content: [{ type: "text", text: error.message }],
            structuredContent: {
                status: "error",
                code: error.code,
                message: error.message
            }
        };
    }

    console.error("MCP tool failed", error);
    return {
        isError: true,
        content: [{ type: "text", text: "The scheduling operation failed unexpectedly." }],
        structuredContent: {
            status: "error",
            code: "internal_error",
            message: "The scheduling operation failed unexpectedly."
        }
    };
}

function createWhen2MeetServer(userId: string) {
    const server = new McpServer(
        { name: "When2Meet", version: "1.0.0" },
        {
            instructions:
                "Manage the authorized user's When2Meet events. An exact invite ID may be used to inspect or join a public event. Read an event before changing it. create_event requires a fresh UUID operation_key and is safe to retry with the same inputs. set_my_availability completely replaces only the authorized user's availability; omitted slots are removed. Event deletion is intentionally unavailable."
        }
    );

    server.registerTool(
        "list_my_events",
        {
            title: "List my events",
            description: "List events the authorized user organizes or participates in.",
            inputSchema: z.object({
                query: z.string().trim().min(1).optional().describe("Optional event-name search."),
                role: z.enum(["all", "organizer", "participant"]).default("all"),
                limit: z.number().int().min(1).max(100).default(50),
                offset: z.number().int().min(0).default(0)
            }),
            annotations: { readOnlyHint: true, openWorldHint: false }
        },
        async (input) => {
            try {
                const result = await listMyEvents(userId, input);
                return successful(`Found ${result.total} event${result.total === 1 ? "" : "s"}.`, {
                    ...result,
                    items: result.items.map((item) => ({
                        ...item,
                        eventUrl: eventUrl(item.event.id),
                        inviteUrl: eventUrl(item.event.id, true)
                    }))
                });
            } catch (error) {
                return failed(error);
            }
        }
    );

    server.registerTool(
        "get_event",
        {
            title: "Get event",
            description:
                "Get an event, its participants, and their availability using an exact invite ID.",
            inputSchema: z.object({ event_id: eventId }),
            annotations: { readOnlyHint: true, openWorldHint: false }
        },
        async ({ event_id }) => {
            try {
                const detail = await getEventDetail(event_id, userId);
                return successful(
                    `${detail.event.name} has ${detail.participants.length} participant${detail.participants.length === 1 ? "" : "s"}.`,
                    {
                        ...detail,
                        eventUrl: eventUrl(event_id),
                        inviteUrl: eventUrl(event_id, true)
                    }
                );
            } catch (error) {
                return failed(error);
            }
        }
    );

    server.registerTool(
        "find_best_times",
        {
            title: "Find best times",
            description:
                "Rank possible meeting windows by how many participants are available for the full duration.",
            inputSchema: z.object({
                event_id: eventId,
                duration_minutes: z
                    .number()
                    .int()
                    .min(60)
                    .max(24 * 60)
                    .multipleOf(60)
                    .default(60),
                limit: z.number().int().min(1).max(25).default(10)
            }),
            annotations: { readOnlyHint: true, openWorldHint: false }
        },
        async ({ event_id, duration_minutes, limit }) => {
            try {
                const result = await findBestTimes(event_id, userId, duration_minutes, limit);
                return successful(
                    `Ranked ${result.candidates.length} meeting window${result.candidates.length === 1 ? "" : "s"} for ${result.event.name}.`,
                    { ...result, eventUrl: eventUrl(event_id), inviteUrl: eventUrl(event_id, true) }
                );
            } catch (error) {
                return failed(error);
            }
        }
    );

    server.registerTool(
        "create_event",
        {
            title: "Create event",
            description:
                "Create an event. Use a fresh UUID operation_key; retrying the identical request with it is idempotent.",
            inputSchema: z.object({
                operation_key: z.string().uuid(),
                name: z.string().trim().min(1).max(200),
                organizer_name: z.string().trim().min(1).max(200).optional(),
                timezone: z
                    .string()
                    .trim()
                    .min(1)
                    .describe("An IANA timezone such as Asia/Taipei."),
                available_start: dateTime,
                available_end: dateTime
            }),
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => {
            try {
                const result = await createEventForUser(userId, {
                    operationKey: input.operation_key,
                    name: input.name,
                    organizerName: input.organizer_name,
                    timezone: input.timezone,
                    availableTime: {
                        startTime: new Date(input.available_start),
                        endTime: new Date(input.available_end)
                    }
                });
                return successful(
                    result.replayed
                        ? `Returned the previously created ${result.event.name}.`
                        : `Created ${result.event.name}.`,
                    {
                        event: result.event,
                        replayed: result.replayed,
                        eventUrl: eventUrl(result.event.id),
                        inviteUrl: eventUrl(result.event.id, true)
                    }
                );
            } catch (error) {
                return failed(error);
            }
        }
    );

    server.registerTool(
        "update_event",
        {
            title: "Update event",
            description: "Update an event organized by the authorized user. Read it first.",
            inputSchema: z
                .object({
                    event_id: eventId,
                    name: z.string().trim().min(1).max(200).optional(),
                    organizer_name: z.string().trim().min(1).max(200).optional(),
                    timezone: z.string().trim().min(1).optional(),
                    available_time: z
                        .object({ start: dateTime, end: dateTime })
                        .optional()
                        .describe("A complete replacement for the event's available range.")
                })
                .refine(
                    ({ name, organizer_name, timezone, available_time }) =>
                        name !== undefined ||
                        organizer_name !== undefined ||
                        timezone !== undefined ||
                        available_time !== undefined,
                    { message: "Provide at least one field to update." }
                ),
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async ({ event_id, name, organizer_name, timezone, available_time }) => {
            try {
                const updated = await updateEventForUser(userId, event_id, {
                    name,
                    organizerName: organizer_name,
                    timezone,
                    availableTime: available_time
                        ? {
                              startTime: new Date(available_time.start),
                              endTime: new Date(available_time.end)
                          }
                        : undefined
                });
                return successful(`Updated ${updated.name}.`, {
                    event: updated,
                    eventUrl: eventUrl(event_id),
                    inviteUrl: eventUrl(event_id, true)
                });
            } catch (error) {
                return failed(error);
            }
        }
    );

    server.registerTool(
        "set_my_availability",
        {
            title: "Set my availability",
            description:
                "Join an event if needed and completely replace only the authorized user's availability. Omitted slots become unavailable; an empty array clears all availability.",
            inputSchema: z.object({
                event_id: eventId,
                display_name: z.string().trim().min(1).max(200).optional(),
                slots: z.array(z.object({ start_time: dateTime, end_time: dateTime })).max(500)
            }),
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async ({ event_id, display_name, slots }) => {
            try {
                const result = await setMyAvailability(userId, {
                    eventId: event_id,
                    displayName: display_name,
                    slots: slots.map((slot) => ({
                        startTime: new Date(slot.start_time),
                        endTime: new Date(slot.end_time)
                    }))
                });
                const serializedParticipant = {
                    id: result.participant.id,
                    eventId: result.participant.eventId,
                    displayName: result.participant.username,
                    timeSelection: result.participant.timeSelection.map((slot) => ({
                        startTime: slot.startTime.toISOString(),
                        endTime: slot.endTime.toISOString()
                    }))
                };
                return successful(
                    `${result.joined ? "Joined the event and set" : "Replaced"} availability for ${serializedParticipant.displayName}.`,
                    {
                        joined: result.joined,
                        participant: serializedParticipant,
                        eventUrl: eventUrl(event_id),
                        inviteUrl: eventUrl(event_id, true)
                    }
                );
            } catch (error) {
                return failed(error);
            }
        }
    );

    return server;
}

const mcpHandler = createMcpHandler(
    ({ authInfo }) => {
        const userId = authInfo?.extra?.userId;
        if (typeof userId !== "string" || !userId) {
            throw new Error("Authenticated MCP request is missing its user subject.");
        }
        return createWhen2MeetServer(userId);
    },
    {
        legacy: "reject",
        onerror: (error) => console.error("MCP request failed", error)
    }
);

function bearerToken(request: Request) {
    return request.headers.get("authorization")?.replace(/^(Bearer|DPoP)\s+/i, "") ?? "";
}

export const handleMcpRequest = requireMcpAuth(
    auth,
    async (request, claims) => {
        if (typeof claims.sub !== "string" || !claims.sub) {
            return new Response("Authorized token has no user subject.", { status: 401 });
        }
        const authInfo: AuthInfo = {
            token: bearerToken(request),
            clientId: typeof claims.client_id === "string" ? claims.client_id : "",
            scopes:
                typeof claims.scope === "string" ? claims.scope.split(/\s+/).filter(Boolean) : [],
            expiresAt: claims.exp,
            resource: new URL(MCP_RESOURCE_URL),
            extra: { userId: claims.sub }
        };
        return mcpHandler.fetch(request, { authInfo });
    },
    {
        resource: MCP_RESOURCE_URL,
        requiredScopes: MCP_RESOURCE_SCOPES,
        challengeScopes: MCP_RESOURCE_SCOPES
    }
);
