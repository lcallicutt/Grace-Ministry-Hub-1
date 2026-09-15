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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchProfilesTable } from "./church-profiles";

export const volunteerStatusEnum = pgEnum("volunteer_status", [
  "active",
  "inactive",
]);

export const volunteersTable = pgTable(
  "volunteers",
  {
    id: serial("id").primaryKey(),
    churchId: integer("church_id")
      .notNull()
      .references(() => churchProfilesTable.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    team: text("team"),
    status: volunteerStatusEnum("status").notNull().default("active"),
    isStudent: boolean("is_student").notNull().default(false),
    schoolName: text("school_name"),
    guardianName: text("guardian_name"),
    guardianPhone: text("guardian_phone"),
    guardianEmail: text("guardian_email"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("volunteers_church_idx").on(table.churchId),
    index("volunteers_church_team_idx").on(table.churchId, table.team),
    check(
      "volunteers_student_guardian_check",
      sql`NOT ${table.isStudent} OR (${table.guardianName} IS NOT NULL AND ${table.guardianPhone} IS NOT NULL)`,
    ),
  ],
);

export const insertVolunteerSchema = createInsertSchema(volunteersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVolunteer = z.infer<typeof insertVolunteerSchema>;
export type Volunteer = typeof volunteersTable.$inferSelect;