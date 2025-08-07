// API wrapper for events endpoints
import type { Event, User, Participant } from '@prisma/client';
import {
	TimeSelectionCreateInputObjectSchema,
	TimeSelectionUpdateInputObjectSchema
} from '$prisma/zod/schemas/index.js';

// Re-export Prisma types for convenience
export type { Event, User, Participant };

// Simplified type for time selection
export interface TimeSelection {
	startTime: Date;
	endTime: Date;
}

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
	organizer: Pick<User, 'id' | 'name' | 'email'>;
	_count?: {
		userTimeSelection: number;
	};
	userTimeSelection?: Array<Participant & {
		user: Pick<User, 'id' | 'name'>;
	}>;
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

export interface ApiError {
	error: string;
	details?: unknown;
}

class EventsApi {
	private baseUrl = '/api/events';

	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const error: ApiError = await response.json();
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		return response.json();
	}

	/**
	 * Get all events with optional filtering
	 */
	async getEvents(params?: EventsQueryParams): Promise<EventsResponse> {
		const searchParams = new URLSearchParams();
		
		if (params?.organizerId) searchParams.set('organizerId', params.organizerId);
		if (params?.limit) searchParams.set('limit', params.limit.toString());
		if (params?.offset) searchParams.set('offset', params.offset.toString());

		const url = searchParams.toString() 
			? `${this.baseUrl}?${searchParams.toString()}`
			: this.baseUrl;

		const response = await fetch(url);
		return this.handleResponse<EventsResponse>(response);
	}

	/**
	 * Get a single event by ID
	 */
	async getEvent(id: string): Promise<{ event: EventWithRelations }> {
		const response = await fetch(`${this.baseUrl}/${id}`);
		return this.handleResponse<{ event: EventWithRelations }>(response);
	}

	/**
	 * Create a new event (requires authentication)
	 */
	async createEvent(data: CreateEventData): Promise<{ event: EventWithRelations }> {
		// Validate data with Zod schema
		TimeSelectionCreateInputObjectSchema.parse(data.availableTime);
		
		const response = await fetch(this.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				timezone: data.timezone,
				availableTime: {
					startTime: data.availableTime.startTime.toISOString(),
					endTime: data.availableTime.endTime.toISOString()
				},
				weeklyRecurrence: data.weeklyRecurrence
			})
		});
		return this.handleResponse<{ event: EventWithRelations }>(response);
	}

	/**
	 * Update an event (requires authentication and ownership)
	 */
	async updateEvent(id: string, data: UpdateEventData): Promise<{ event: EventWithRelations }> {
		// Validate availableTime if provided
		if (data.availableTime) {
			TimeSelectionUpdateInputObjectSchema.parse(data.availableTime);
		}
		
		interface UpdateEventPayload {
			timezone?: string;
			availableTime?: {
				startTime: string;
				endTime: string;
			};
			weeklyRecurrence?: boolean;
		}
		
		const payload: UpdateEventPayload = {};
		
		if (data.timezone !== undefined) {
			payload.timezone = data.timezone;
		}
		if (data.weeklyRecurrence !== undefined) {
			payload.weeklyRecurrence = data.weeklyRecurrence;
		}
		if (data.availableTime) {
			payload.availableTime = {
				startTime: data.availableTime.startTime.toISOString(),
				endTime: data.availableTime.endTime.toISOString()
			};
		}

		const response = await fetch(`${this.baseUrl}/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		return this.handleResponse<{ event: EventWithRelations }>(response);
	}

	/**
	 * Delete an event (requires authentication and ownership)
	 */
	async deleteEvent(id: string): Promise<{ message: string }> {
		const response = await fetch(`${this.baseUrl}/${id}`, {
			method: 'DELETE'
		});
		return this.handleResponse<{ message: string }>(response);
	}
}

export const eventsApi = new EventsApi();