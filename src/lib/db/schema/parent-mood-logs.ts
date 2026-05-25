import type { InferSelectModel } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const parentMoodLogs = pgTable(
  "parent_mood_logs",
  {
    id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 128 }).notNull(),
    // 'calm' | 'happy' | 'tired' | 'stressed' | 'anxious' | 'proud' | 'overwhelmed' | 'peaceful'
    mood: varchar("mood", { length: 30 }).notNull(),
    // 可选简短描述
    note: text("note"),
    // 可选关联孩子（有些心情可能不特定于某个孩子）
    childId: varchar("child_id", { length: 128 }),
    loggedAt: timestamp("logged_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("parent_mood_logs_user_id_idx").on(table.userId),
    loggedAtIdx: index("parent_mood_logs_logged_at_idx").on(table.loggedAt),
  })
);

export type ParentMoodLog = InferSelectModel<typeof parentMoodLogs>;
