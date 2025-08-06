import { auth } from "$lib/auth";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session) {
        redirect(307, "/login");
    }

    return session;
};
