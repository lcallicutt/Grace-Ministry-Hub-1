import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchProfilesTable } from "./church-profiles";
import { volunteerSlotsTable } from "./volunteer-slots";
import { volunteersTable } from "./volunteers";

export const volunteerSignupStatusEnum = pgEnum("volunteer_signup_status", [
  "confirmed",
  "waitlisted",
  "cancelled",
  "no_show",
]);

export const volunteerSignupsTable = pgTable(
  "volunteer_signups",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchProfilesTable.id, { onDelete: "cascade" }),
    slotId: integer("slot_id")
      .notNull()
      .references(() => volunteerSlotsTable.id, { onDelete: "cascade" }),
    volunteerId: integer("volunteer_id").references(() => volunteersTable.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    isStudent: boolean("is_student").notNull().default(false),
    schoolName: text("school_name"),
    guardianName: text("guardian_name"),
    guardianPhone: text("guardian_phone"),
    status: volunteerSignupStatusEnum("status")
      .notNull()
      .default("confirmed"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("volunteer_signups_church_idx").on(table.churchId),
    index("volunteer_signups_slot_status_idx").on(table.slotId, table.status),
    uniqueIndex("volunteer_signups_slot_email_unique").on(
      table.slotId,
      table.email,
    ),
    check(
      "volunteer_signups_student_guardian_check",
      sql`NOT ${table.isStudent} OR (${table.schoolName} IS NOT NULL AND ${table.guardianName} IS NOT NULL AND ${table.guardianPhone} IS NOT NULL)`,
    ),
  ],
);

export const insertVolunteerSignupSchema = createInsertSchema(
  volunteerSignupsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVolunteerSignup = z.infer<
  typeof insertVolunteerSignupSchema
>;
export type VolunteerSignup = typeof volunteerSignupsTable.$inferSelect;