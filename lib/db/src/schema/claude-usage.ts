import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { churchProfilesTable } from "./church-profiles";

export const claudeUsageTable = pgTable(
  "claude_usage",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => churchProfilesTable.id, { onDelete: "cascade" }),
    estimatedInputTokens: integer("estimated_input_tokens").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    reservedTokens: integer("reserved_tokens").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("claude_usage_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export const insertClaudeUsageSchema = createInsertSchema(
  claudeUsageTable,
).omit({ id: true, createdAt: true });
export type InsertClaudeUsage = z.infer<typeof insertClaudeUsageSchema>;
export type ClaudeUsage = typeof claudeUsageTable.$inferSelect;