import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";

const originalHandle: Handle = async ({ event, resolve }) => {
    return svelteKitHandler({ event, resolve, auth, building });
};

const handleParaglide: Handle = ({ event, resolve }) =>
    paraglideMiddleware(event.request, ({ request, locale }) => {
        event.request = request;

        return resolve(event, {
            transformPageChunk: ({ html }) => html.replace("%paraglide.lang%", locale)
        });
    });

export const handle = sequence(originalHandle, handleParaglide);
