import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const churchProfilesTable = pgTable("church_profiles", {
  id: serial("id").primaryKey(),
  churchName: text("church_name").notNull(),
  pastorName: text("pastor_name").notNull().default(""),
  address: text("address").notNull().default(""),
  serviceTime: text("service_time").notNull().default("Sunday at 10:00 AM"),
  welcomeNote: text("welcome_note").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertChurchProfileSchema = createInsertSchema(
  churchProfilesTable,
).omit({ id: true, updatedAt: true });
export type InsertChurchProfile = z.infer<typeof insertChurchProfileSchema>;
export type ChurchProfile = typeof churchProfilesTable.$inferSelect;