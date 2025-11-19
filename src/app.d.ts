// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import "unplugin-icons/types/svelte";

declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

declare module "$env/static/private" {
    export const DATABASE_URL: string;
    export const GITHUB_CLIENT_ID: string;
    export const GITHUB_CLIENT_SECRET: string;
    export const GOOGLE_CLIENT_ID: string;
    export const GOOGLE_CLIENT_SECRET: string;
}

export {};
