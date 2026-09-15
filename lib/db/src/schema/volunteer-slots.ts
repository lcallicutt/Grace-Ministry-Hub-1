import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchProfilesTable } from "./church-profiles";

export const volunteerSlotStatusEnum = pgEnum("volunteer_slot_status", [
  "open",
  "closed",
]);

export const volunteerSlotsTable = pgTable(
  "volunteer_slots",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchProfilesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    role: text("role").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    capacity: integer("capacity").notNull(),
    location: text("location"),
    description: text("description"),
    signupToken: text("signup_token").notNull(),
    status: volunteerSlotStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("volunteer_slots_signup_token_unique").on(table.signupToken),
    index("volunteer_slots_church_date_idx").on(table.churchId, table.date),
  ],
);

export const insertVolunteerSlotSchema = createInsertSchema(
  volunteerSlotsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVolunteerSlot = z.infer<typeof insertVolunteerSlotSchema>;
export type VolunteerSlot = typeof volunteerSlotsTable.$inferSelect;