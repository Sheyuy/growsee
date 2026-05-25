import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ai } from "@eazo/sdk";
import { getChildrenByUser } from "@/lib/db/queries/children";
import { createRecord } from "@/lib/db/queries/growth-records";

ai.configure({ privateKey: process.env.EAZO_PRIVATE_KEY! });

export interface AutoArchiveResult {
  saved: boolean;
  childId: string | null;
  childName: string | null;
  category: string;
  title: string | null;
  needsConfirm: boolean;       // true = AI 不确定，需要用户确认
  confirmPrompt: string | null; // 展示给用户的确认问题
  recordId: string | null;
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const { id: userId } = authResult.user;

  const body = await request.json();
  const { content, confirm, photoUrl } = body; // confirm: { childId, category } 用户确认后传入
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const allChildren = await getChildrenByUser(userId);

  // ── 用户已确认，直接保存 ─────────────────────────────────
  if (confirm) {
    const rec = await createRecord(userId, {
      childId: confirm.childId ?? null,
      category: confirm.category ?? "other",
      title: confirm.title ?? null,
      content: content.trim(),
      mood: null, photoUrl: (photoUrl as string | undefined) ?? null,
      recordedAt: new Date(),
    });
    const child = allChildren.find(c => c.id === confirm.childId);
    return NextResponse.json({
      saved: true,
      childId: confirm.childId ?? null,
      childName: child?.nickname ?? child?.name ?? null,
      category: confirm.category ?? "other",
      title: confirm.title ?? null,
      needsConfirm: false,
      confirmPrompt: null,
      recordId: rec.id,
    } satisfies AutoArchiveResult);
  }

  // ── 无孩子档案，直接保存为「不关联孩子」 ──────────────────
  if (allChildren.length === 0) {
    const rec = await createRecord(userId, {
      childId: null,
      category: "other",
      title: null,
      content: content.trim(),
      mood: null, photoUrl: (photoUrl as string | undefined) ?? null,
      recordedAt: new Date(),
    });
    return NextResponse.json({
      saved: true, childId: null, childName: null,
      category: "other", title: null,
      needsConfirm: false, confirmPrompt: null,
      recordId: rec.id,
    } satisfies AutoArchiveResult);
  }

  // ── AI 判断归属 ───────────────────────────────────────────
  const childList = allChildren
    .map(c => `- id: ${c.id}, 名字: ${c.nickname ?? c.name}, 性别: ${c.gender === "girl" ? "女" : c.gender === "boy" ? "男" : "未知"}`)
    .join("\n");

  const prompt = `你在帮助一位家长自动归档一条成长记录。

家里的孩子：
${childList}
${allChildren.length === 1 ? `（只有一个孩子，除非内容明确是家长自己的情绪，否则默认关联这个孩子）` : ""}

家长写的内容：
「${content.trim()}」

请判断：
1. 这条记录关于哪个孩子？如果是家长自己的情绪/感受/无奈，填 null
2. 最合适的分类：behavior（行为观察）/ emotion（情绪状态）/ language（语言发展）/ physical（身体成长）/ social（社交能力）/ other（日常）
3. 简短标题（10字以内，可以为 null）
4. 是否需要向家长确认（当内容含糊不清，无法判断是哪个孩子时才填 true）
5. 如果需要确认，给出确认问题（简短，如「这条是关于诺诺的吗？」）

只返回 JSON，格式：
{
  "childId": "xxx" 或 null,
  "category": "behavior" | "emotion" | "language" | "physical" | "social" | "other",
  "title": "标题" 或 null,
  "needsConfirm": true 或 false,
  "confirmPrompt": "问题" 或 null
}`;

  try {
    const resp = await ai.chat({
      model: "deepseek.v3.1",
      messages: [{ role: "user" as const, content: prompt }],
      stream: false,
    }) as { choices?: Array<{ message?: { content?: string } }> };

    const raw = resp.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const childId: string | null = parsed.childId ?? null;
    const category: string = parsed.category ?? "other";
    const title: string | null = parsed.title ?? null;
    const needsConfirm: boolean = parsed.needsConfirm === true;
    const confirmPrompt: string | null = parsed.confirmPrompt ?? null;

    // 验证 childId 是否真实存在
    const validChildId = allChildren.find(c => c.id === childId)?.id ?? null;
    const child = allChildren.find(c => c.id === validChildId);

    // 需要确认：先返回，不保存
    if (needsConfirm) {
      return NextResponse.json({
        saved: false,
        childId: validChildId,
        childName: child?.nickname ?? child?.name ?? null,
        category, title, needsConfirm: true,
        confirmPrompt, recordId: null,
      } satisfies AutoArchiveResult);
    }

    // 不需要确认：直接保存
    const rec = await createRecord(userId, {
      childId: validChildId,
      category, title,
      content: content.trim(),
      mood: null, photoUrl: (photoUrl as string | undefined) ?? null,
      recordedAt: new Date(),
    });

    return NextResponse.json({
      saved: true,
      childId: validChildId,
      childName: child?.nickname ?? child?.name ?? null,
      category, title,
      needsConfirm: false, confirmPrompt: null,
      recordId: rec.id,
    } satisfies AutoArchiveResult);

  } catch {
    // AI 解析失败，降级：直接保存为 other 不关联
    const child = allChildren.length === 1 ? allChildren[0] : null;
    const rec = await createRecord(userId, {
      childId: child?.id ?? null,
      category: "other", title: null,
      content: content.trim(),
      mood: null, photoUrl: (photoUrl as string | undefined) ?? null, recordedAt: new Date(),
    });
    return NextResponse.json({
      saved: true,
      childId: child?.id ?? null,
      childName: child?.nickname ?? child?.name ?? null,
      category: "other", title: null,
      needsConfirm: false, confirmPrompt: null,
      recordId: rec.id,
    } satisfies AutoArchiveResult);
  }
}
