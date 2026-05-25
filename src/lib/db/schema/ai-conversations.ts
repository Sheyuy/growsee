import type { InferSelectModel } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 128 }).notNull(),
    childId: varchar("child_id", { length: 128 }),
    // 'user' | 'assistant'
    role: varchar("role", { length: 10 }).notNull(),
    content: text("content").notNull(),
    sessionId: varchar("session_id", { length: 128 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("ai_conv_user_id_idx").on(table.userId),
    sessionIdx: index("ai_conv_session_id_idx").on(table.sessionId),
    createdAtIdx: index("ai_conv_created_at_idx").on(table.createdAt),
  })
);

export type AiConversation = InferSelectModel<typeof aiConversations>;
