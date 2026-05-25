import type { InferSelectModel } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const growthRecords = pgTable(
  "growth_records",
  {
    id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    // childId 为 null 表示「全家记录」或「不关联具体孩子」
    childId: varchar("child_id", { length: 128 }),
    userId: varchar("user_id", { length: 128 }).notNull(),
    // 'behavior' | 'emotion' | 'language' | 'physical' | 'social' | 'other'
    category: varchar("category", { length: 30 }).notNull().default("other"),
    title: text("title"),
    content: text("content").notNull(),
    mood: varchar("mood", { length: 20 }),
    // 可选附图，CDN URL
    photoUrl: text("photo_url"), // 'happy' | 'calm' | 'worried' | 'confused'
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    childIdx: index("growth_records_child_id_idx").on(table.childId),
    userIdx: index("growth_records_user_id_idx").on(table.userId),
    recordedAtIdx: index("growth_records_recorded_at_idx").on(table.recordedAt),
  })
);

export type GrowthRecord = InferSelectModel<typeof growthRecords>;
