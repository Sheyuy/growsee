import type { InferSelectModel } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar, date } from "drizzle-orm/pg-core";

export const children = pgTable(
  "children",
  {
    id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 128 }).notNull(),
    name: text("name").notNull(),
    nickname: text("nickname"),
    gender: varchar("gender", { length: 10 }), // 'boy' | 'girl' | 'other'
    birthDate: date("birth_date"),
    avatarEmoji: text("avatar_emoji").default("🌱"),
    notes: text("notes"),
    // 父母写下的小心思 —— 对孩子的一点期待,选填,随时可改
    parentWish: text("parent_wish"),
    // 父母观察到的孩子特质 —— 自由文字,不是标签不是评分
    traits: text("traits"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("children_user_id_idx").on(table.userId),
  })
);

export type Child = InferSelectModel<typeof children>;
