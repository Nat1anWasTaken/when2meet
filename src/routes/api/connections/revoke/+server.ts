import { auth } from "$lib/auth";
import { db } from "$lib/server/db";
import { oauthAccessToken, oauthConsent, oauthRefreshToken } from "$lib/server/db/auth-schema";
import { and, eq } from "drizzle-orm";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) error(401, "Sign in required.");

    const body: unknown = await request.json().catch(() => null);
    const id =
        body && typeof body === "object" && "id" in body && typeof body.id === "string"
            ? body.id
            : "";
    if (!id) error(400, "A consent ID is required.");

    const records = await db
        .select({ id: oauthConsent.id, clientId: oauthConsent.clientId })
        .from(oauthConsent)
        .where(and(eq(oauthConsent.id, id), eq(oauthConsent.userId, session.user.id)))
        .limit(1);
    const consent = records[0];
    if (!consent) error(404, "Connected app not found.");

    await db.transaction(async (tx) => {
        await tx
            .delete(oauthAccessToken)
            .where(
                and(
                    eq(oauthAccessToken.clientId, consent.clientId),
                    eq(oauthAccessToken.userId, session.user.id)
                )
            );
        await tx
            .delete(oauthRefreshToken)
            .where(
                and(
                    eq(oauthRefreshToken.clientId, consent.clientId),
                    eq(oauthRefreshToken.userId, session.user.id)
                )
            );
        await tx
            .delete(oauthConsent)
            .where(and(eq(oauthConsent.id, id), eq(oauthConsent.userId, session.user.id)));
    });

    return json({ revoked: true });
};
