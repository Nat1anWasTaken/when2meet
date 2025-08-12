import { pgTable, serial, integer, text, customType, boolean, date } from "drizzle-orm/pg-core";
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
    fromDriver(value: string): TimeSelection {
        const obj = JSON.parse(value);
        return {
            startTime: new Date(obj.startTime),
            endTime: new Date(obj.endTime)
        };
    }
});

export const event = pgTable("event", {
    id: serial("id").primaryKey(),
    timezone: text("timezone").default("UTC").notNull(), // IANA Timezone Identifier
    organizerName: text("organizer_name").notNull(),
    organizerId: text("organizer_id").references(() => user.id, { onDelete: "set null" }),
    availableTime: timeSelection("available_time").notNull(),
    weeklyRecurrence: boolean("weekly_recurrence").notNull().default(false)
});

export const participant = pgTable("participant", {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
        .references(() => event.id, { onDelete: "cascade" })
        .notNull(),
    username: text("username").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: date("created_at").defaultNow().notNull(),
    updatedAt: date("updated_at").defaultNow().notNull(),
    timeSelection: timeSelection("time_selection").array().notNull()
});
