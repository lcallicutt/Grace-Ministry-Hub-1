import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchProfilesTable } from "./church-profiles";
import { volunteerSlotsTable } from "./volunteer-slots";
import { volunteersTable } from "./volunteers";

export const volunteerHoursTable = pgTable(
  "volunteer_hours",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchProfilesTable.id, { onDelete: "cascade" }),
    volunteerId: integer("volunteer_id")
      .notNull()
      .references(() => volunteersTable.id, { onDelete: "cascade" }),
    slotId: integer("slot_id").references(() => volunteerSlotsTable.id, {
      onDelete: "set null",
    }),
    date: date("date", { mode: "string" }).notNull(),
    hours: numeric("hours", { precision: 6, scale: 2 }).notNull(),
    description: text("description").notNull(),
    approved: boolean("approved").notNull().default(false),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("volunteer_hours_church_date_idx").on(table.churchId, table.date),
    index("volunteer_hours_volunteer_idx").on(table.volunteerId),
    check(
      "volunteer_hours_quarter_increment_check",
      sql`${table.hours} > 0 AND MOD(${table.hours}, 0.25) = 0`,
    ),
    check(
      "volunteer_hours_approval_check",
      sql`NOT ${table.approved} OR (${table.approvedBy} IS NOT NULL AND ${table.approvedAt} IS NOT NULL)`,
    ),
  ],
);

export const insertVolunteerHoursSchema = createInsertSchema(
  volunteerHoursTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVolunteerHours = z.infer<typeof insertVolunteerHoursSchema>;
export type VolunteerHours = typeof volunteerHoursTable.$inferSelect;