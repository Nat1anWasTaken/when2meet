import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "$env/dynamic/private";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = neon(env.DATABASE_URL);

export const db = drizzle(client, { schema: { ...schema, ...authSchema } });
