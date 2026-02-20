import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./schema";

export const notificationsTable = pgTable(
  "notifications",
  {
    uuid: uuid("uuid").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull().default("info"), // info, success, warning, error
    is_read: boolean("is_read").notNull().default(false),
    link: text("link"),
    user_id: text("user_id").references(() => usersTable.id, {
      onDelete: "cascade",
    }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.user_id),
    index("notifications_created_at_idx").on(table.created_at),
    index("notifications_is_read_idx").on(table.is_read),
  ],
);
