import { env } from "$env/dynamic/private";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = neon(env.DATABASE_URL);

export const db = drizzle(client, { schema: { ...schema, ...authSchema } });
