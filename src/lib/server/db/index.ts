import { DATABASE_URL } from "$env/static/private";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = neon(DATABASE_URL);

export const db = drizzle(client, { schema: { ...schema, ...authSchema } });
