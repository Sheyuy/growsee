import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { growthRecords } from "@/lib/db/schema/growth-records";
import { aiConversations } from "@/lib/db/schema/ai-conversations";
import { children } from "@/lib/db/schema/children";
import { and, eq, gte, desc } from "drizzle-orm";

export interface HomeSummary {
  weekRecordCount: number;
  weekCategories: string[];           // 本周出现的记录分类
  lastChatPreview: string | null;     // 上次 AI 对话的用户消息摘要
  lastChatChildName: string | null;
  lastChatDaysAgo: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  behavior: "行为观察", emotion: "情绪状态", language: "语言发展",
  physical: "身体成长", social: "社交能力", other: "日常记录",
};

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const { id: userId } = authResult.user;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 本周记录统计
  const weekRecs = await db.select({
    category: growthRecords.category,
  }).from(growthRecords)
    .where(and(
      eq(growthRecords.userId, userId),
      gte(growthRecords.createdAt, sevenDaysAgo),
    ));

  const weekCategories = [...new Set(weekRecs.map(r => CATEGORY_LABELS[r.category] ?? "日常记录"))];

  // 最近一条用户发出的 AI 对话消息
  const lastChats = await db.select({
    content: aiConversations.content,
    childId: aiConversations.childId,
    createdAt: aiConversations.createdAt,
  }).from(aiConversations)
    .where(and(
      eq(aiConversations.userId, userId),
      eq(aiConversations.role, "user"),
    ))
    .orderBy(desc(aiConversations.createdAt))
    .limit(1);

  let lastChatPreview: string | null = null;
  let lastChatChildName: string | null = null;
  let lastChatDaysAgo: number | null = null;

  if (lastChats.length > 0) {
    const last = lastChats[0];
    const content = last.content ?? "";
    lastChatPreview = content.length > 30 ? content.slice(0, 30) + "……" : content;
    lastChatDaysAgo = Math.floor((Date.now() - new Date(last.createdAt).getTime()) / 86400000);

    if (last.childId) {
      const child = await db.select({ nickname: children.nickname, name: children.name })
        .from(children).where(eq(children.id, last.childId)).limit(1);
      lastChatChildName = child[0]?.nickname ?? child[0]?.name ?? null;
    }
  }

  return NextResponse.json({
    weekRecordCount: weekRecs.length,
    weekCategories,
    lastChatPreview,
    lastChatChildName,
    lastChatDaysAgo,
  } satisfies HomeSummary);
}
