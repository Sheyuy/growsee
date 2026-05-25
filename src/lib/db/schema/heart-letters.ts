import type { InferSelectModel } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

// 心里话 —— 父母对孩子说不出口的话，先在这里记下来
export const heartLetters = pgTable(
  "heart_letters",
  {
    id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 128 }).notNull(),
    // childId 为 null 表示「不写给特定孩子」，只是父母自己的记录
    childId: varchar("child_id", { length: 128 }),
    // 情感类型：joy(欣喜) | proud(认同/骄傲) | gratitude(感谢) | wish(祝愿) | apology(抱歉) | other
    emotion: varchar("emotion", { length: 30 }).notNull().default("joy"),
    title: text("title"),
    content: text("content").notNull(),
    // 是否计划将来给孩子看（时间胶囊模式）
    isTimeCapsule: boolean("is_time_capsule").notNull().default(false),
    // 计划给孩子看的年龄（仅 isTimeCapsule=true 时有意义）
    revealAtAge: varchar("reveal_at_age", { length: 20 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("heart_letters_user_id_idx").on(table.userId),
    childIdx: index("heart_letters_child_id_idx").on(table.childId),
    createdAtIdx: index("heart_letters_created_at_idx").on(table.createdAt),
  })
);

export type HeartLetter = InferSelectModel<typeof heartLetters>;
