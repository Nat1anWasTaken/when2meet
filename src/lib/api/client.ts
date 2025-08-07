// Base API client for handling requests and responses
export interface ApiError {
    error: string;
    details?: unknown;
}

export class ApiClient {
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error: ApiError = await response.json();
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        return response.json();
    }

    private buildSearchParams(params?: Record<string, unknown>): URLSearchParams {
        const searchParams = new URLSearchParams();
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.set(key, value.toString());
                }
            });
        }

        return searchParams;
    }

    async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
        const searchParams = this.buildSearchParams(params);
        const fullUrl = searchParams.toString() 
            ? `${url}?${searchParams.toString()}`
            : url;

        const response = await fetch(fullUrl);
        return this.handleResponse<T>(response);
    }

    async post<T>(url: string, data?: unknown): Promise<T> {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: data ? JSON.stringify(data) : undefined
        });
        return this.handleResponse<T>(response);
    }

    async put<T>(url: string, data?: unknown): Promise<T> {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: data ? JSON.stringify(data) : undefined
        });
        return this.handleResponse<T>(response);
    }

    async delete<T>(url: string): Promise<T> {
        const response = await fetch(url, {
            method: 'DELETE'
        });
        return this.handleResponse<T>(response);
    }
}