import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
  pgEnum,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { usersTable } from "./schema";

export const scheduledTasksTable = pgTable(
  "scheduled_tasks",
  {
    uuid: uuid("uuid").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    cron_expression: text("cron_expression").notNull(),
    task_definition: jsonb("task_definition")
      .$type<{
        type: "tool_call" | "agent_task";
        target: string; // tool name or agent prompt
        arguments?: Record<string, any>;
      }>()
      .notNull(),
    is_active: boolean("is_active").notNull().default(true),
    last_run_at: timestamp("last_run_at", { withTimezone: true }),
    next_run_at: timestamp("next_run_at", { withTimezone: true }),
    user_id: text("user_id").references(() => usersTable.id, {
      onDelete: "cascade",
    }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("scheduled_tasks_user_id_idx").on(table.user_id),
    index("scheduled_tasks_is_active_idx").on(table.is_active),
  ],
);
