import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./server/db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg"
    }),
    emailAndPassword: {
        enabled: true
    }
});

/**
 * Gets the authenticated session from request headers
 * @param headers - Request headers from the current request
 * @returns
 */
export async function getAuthenticatedSession(
    headers: Headers
): Promise<ReturnType<typeof auth.api.getSession>> {
    const sessionData = await auth.api.getSession({
        headers
    });

    if (!sessionData) {
        return null;
    }

    return sessionData;
}
