import type { InferSelectModel } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    email: varchar("email", { length: 256 }).unique(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    // 扩展资料
    role: varchar("role", { length: 20 }), // 'mom' | 'dad' | 'grandparent' | 'other'
    bio: text("bio"),                       // 一句话自我介绍（选填）
    familyNote: text("family_note"),        // 家庭情况备注（选填，AI 用于个性化回答）
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  })
);

export type User = InferSelectModel<typeof users>;
