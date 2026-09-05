import {
  date,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const servicePlansTable = pgTable("service_plans", {
  id: serial("id").primaryKey(),
  churchName: text("church_name").notNull(),
  serviceDate: date("service_date", { mode: "string" }).notNull(),
  serviceTime: text("service_time").notNull(),
  sermonTitle: text("sermon_title").notNull(),
  speaker: text("speaker"),
  orderOfService: text("order_of_service"),
  announcements: text("announcements"),
  notes: text("notes"),
  bulletin: text("bulletin").notNull(),
  projection: text("projection").notNull(),
  announcerSheet: text("announcer_sheet").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertServicePlanSchema = createInsertSchema(
  servicePlansTable,
).omit({ id: true, createdAt: true });
export type InsertServicePlan = z.infer<typeof insertServicePlanSchema>;
export type ServicePlan = typeof servicePlansTable.$inferSelect;