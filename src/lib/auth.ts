import {
    BETTER_AUTH_URL,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
} from "$env/static/private";
import { building } from "$app/environment";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { db } from "./server/db";

export const MCP_RESOURCE_URL = new URL("/mcp", BETTER_AUTH_URL).toString();

export const MCP_RESOURCE_SCOPES = ["events:read", "events:write", "availability:write"] as const;

export const auth = betterAuth({
    baseURL: BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
        provider: "pg"
    }),
    rateLimit: {
        storage: "database"
    },
    emailAndPassword: {
        enabled: false
    },
    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        },
        github: {
            clientId: GITHUB_CLIENT_ID,
            clientSecret: GITHUB_CLIENT_SECRET
        }
    },
    plugins: [
        jwt(),
        ...(building
            ? []
            : [
                  mcp({
                      loginPage: "/oauth/login",
                      consentPage: "/oauth/consent",
                      resource: MCP_RESOURCE_URL,
                      scopes: ["openid", "profile", "offline_access", ...MCP_RESOURCE_SCOPES],
                      accessTokenExpiresIn: 15 * 60,
                      refreshTokenExpiresIn: 30 * 24 * 60 * 60,
                      refreshTokenReuseInterval: 30,
                      allowDynamicClientRegistration: true,
                      allowUnauthenticatedClientRegistration: true,
                      rateLimit: {
                          register: { window: 60, max: 5 }
                      }
                  }),
                  cimd({
                      fetchClientMetadataResource,
                      metadataProfile: "mcp-2026-07-28"
                  })
              ])
    ]
});
