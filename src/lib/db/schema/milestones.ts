import type { InferSelectModel } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const milestones = pgTable(
  "milestones",
  {
    id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    childId: varchar("child_id", { length: 128 }).notNull(),
    userId: varchar("user_id", { length: 128 }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    // 'first_word' | 'first_step' | 'first_day_school' | 'custom'
    milestoneType: varchar("milestone_type", { length: 30 }).default("custom"),
    emoji: text("emoji").default("⭐"),
    // 可选照片，CDN URL
    photoUrl: text("photo_url"),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    childIdx: index("milestones_child_id_idx").on(table.childId),
    occurredAtIdx: index("milestones_occurred_at_idx").on(table.occurredAt),
  })
);

export type Milestone = InferSelectModel<typeof milestones>;
