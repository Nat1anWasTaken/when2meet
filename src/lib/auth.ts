import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "$lib/db";
import { getRequestEvent } from "$app/server";

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "mongodb" }),
    emailAndPassword: {
        enabled: true
    }
});

/**
 * Gets the authenticated session,
 * @returns
 */
export async function getAuthenticatedSession(): Promise<ReturnType<typeof auth.api.getSession>> {
    const sessionData = await auth.api.getSession({
        headers: await getRequestEvent().request.headers
    });

    if (!sessionData) {
        return null;
    }

    return sessionData;
}
