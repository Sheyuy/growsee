import { and, asc, desc, eq, lt } from "drizzle-orm";
import { db } from "../client";
import { aiConversations } from "../schema/ai-conversations";
import type { AiConversation } from "../schema/ai-conversations";

export async function getConversationBySession(
  sessionId: string,
  userId: string
): Promise<AiConversation[]> {
  return db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.sessionId, sessionId), eq(aiConversations.userId, userId)))
    .orderBy(asc(aiConversations.createdAt));
}

// 获取某个孩子最近 N 条对话（跨 session，用于上下文注入）
export async function getRecentConversations(
  childId: string,
  userId: string,
  limit = 20
): Promise<AiConversation[]> {
  const rows = await db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.childId, childId), eq(aiConversations.userId, userId)))
    .orderBy(desc(aiConversations.createdAt))
    .limit(limit);
  return rows.reverse(); // 按时间正序返回，便于组装 messages
}

export async function saveMessage(
  userId: string,
  data: Omit<AiConversation, "id" | "userId" | "createdAt">
): Promise<AiConversation> {
  const rows = await db
    .insert(aiConversations)
    .values({ ...data, userId })
    .returning();
  return rows[0];
}
