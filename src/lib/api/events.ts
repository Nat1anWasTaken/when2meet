// API wrapper for events endpoints
import type { Event, User, Participant, TimeSelection } from "@prisma/client";
import {
    TimeSelectionCreateInputObjectSchema,
    TimeSelectionUpdateInputObjectSchema
} from "$prisma/zod/schemas/index.js";
import { ApiClient } from "./client.js";

const apiClient = new ApiClient();


// API-specific types
export interface CreateEventData {
    timezone: string;
    availableTime: TimeSelection;
    weeklyRecurrence: boolean;
}

export interface UpdateEventData {
    timezone?: string;
    availableTime?: TimeSelection;
    weeklyRecurrence?: boolean;
}


export interface EventsQueryParams {
    organizerId?: string;
    limit?: number;
    offset?: number;
}

export type EventWithRelations = Event & {
    organizer: Pick<User, "id" | "name" | "email">;
    _count?: {
        userTimeSelection: number;
    };
    userTimeSelection?: Array<
        Participant & {
            user: Pick<User, "id" | "name">;
        }
    >;
};

export interface EventsResponse {
    events: EventWithRelations[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

const baseUrl = "/api/events";

/**
 * Get all events with optional filtering
 */
export async function getEvents(params?: EventsQueryParams): Promise<EventsResponse> {
    return apiClient.get<EventsResponse>(baseUrl, params as Record<string, unknown>);
}

/**
 * Get a single event by ID
 */
export async function getEvent(id: string): Promise<{ event: EventWithRelations }> {
    return apiClient.get<{ event: EventWithRelations }>(`${baseUrl}/${id}`);
}

/**
 * Create a new event (requires authentication)
 */
export async function createEvent(data: CreateEventData): Promise<{ event: EventWithRelations }> {
    // Validate data with Zod schema
    TimeSelectionCreateInputObjectSchema.parse(data.availableTime);

    const payload = {
        timezone: data.timezone,
        availableTime: {
            startTime: data.availableTime.startTime.toISOString(),
            endTime: data.availableTime.endTime.toISOString()
        },
        weeklyRecurrence: data.weeklyRecurrence
    };

    return apiClient.post<{ event: EventWithRelations }>(baseUrl, payload);
}

/**
 * Update an event (requires authentication and ownership)
 */
export async function updateEvent(id: string, data: UpdateEventData): Promise<{ event: EventWithRelations }> {
    // Validate availableTime if provided
    if (data.availableTime) {
        TimeSelectionUpdateInputObjectSchema.parse(data.availableTime);
    }

    const payload = {
        timezone: data.timezone,
        weeklyRecurrence: data.weeklyRecurrence,
        ...(data.availableTime && {
            availableTime: {
                startTime: data.availableTime.startTime.toISOString(),
                endTime: data.availableTime.endTime.toISOString()
            }
        })
    };

    return apiClient.put<{ event: EventWithRelations }>(`${baseUrl}/${id}`, payload);
}

/**
 * Delete an event (requires authentication and ownership)
 */
export async function deleteEvent(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${baseUrl}/${id}`);
}
