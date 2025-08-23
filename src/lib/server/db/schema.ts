import { boolean, customType, date, pgTable, serial, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";

type TimeSelection = {
    startTime: Date;
    endTime: Date;
};

const timeSelection = customType<{ data: TimeSelection; driverData: string }>({
    dataType() {
        return "jsonb";
    },
    toDriver(value: TimeSelection): string {
        return JSON.stringify({
            startTime: value.startTime.toISOString(),
            endTime: value.endTime.toISOString()
        });
    },
    fromDriver(value: string | { startTime: string; endTime: string }): TimeSelection {
        const obj = typeof value === "string" ? JSON.parse(value) : value;
        return {
            startTime: new Date(obj.startTime),
            endTime: new Date(obj.endTime)
        };
    }
});

export const event = pgTable("event", {
    id: text("id")
        .primaryKey()
        .default(sql`upper(substr(md5(random()::text), 1, 7))`),
    name: text("name").notNull(),
    timezone: text("timezone").default("UTC").notNull(), // IANA Timezone Identifier
    organizerName: text("organizer_name").notNull(),
    organizerId: text("organizer_id").references(() => user.id, { onDelete: "set null" }),
    availableTime: timeSelection("available_time").notNull(),
    weeklyRecurrence: boolean("weekly_recurrence").notNull().default(false)
});

export const participant = pgTable("participant", {
    id: serial("id").primaryKey(),
    eventId: text("event_id")
        .references(() => event.id, { onDelete: "cascade" })
        .notNull(),
    username: text("username").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: date("created_at").defaultNow().notNull(),
    updatedAt: date("updated_at").defaultNow().notNull(),
    timeSelection: timeSelection("time_selection").array().notNull()
});
