import { getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";

/** Get the currently authenticated session, using getRequestEvent() **/
export async function getAuthenticatedSession() {
    const sessionData = await auth.api.getSession({
        headers: await getRequestEvent().request.headers
    });

    return sessionData;
}
