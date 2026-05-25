import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { parentMoodLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/mood — 获取当前用户最近 30 条情绪记录
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id: userId } = auth.user;

  const logs = await db
    .select()
    .from(parentMoodLogs)
    .where(eq(parentMoodLogs.userId, userId))
    .orderBy(desc(parentMoodLogs.loggedAt))
    .limit(30);

  return NextResponse.json({ logs });
}

// POST /api/mood — 新增一条情绪打卡
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id: userId } = auth.user;

  const body = await request.json();
  const { mood, note, childId } = body as { mood: string; note?: string; childId?: string };

  if (!mood) {
    return NextResponse.json({ error: "缺少 mood 字段" }, { status: 400 });
  }

  const [inserted] = await db
    .insert(parentMoodLogs)
    .values({ userId, mood, note: note ?? null, childId: childId ?? null })
    .returning();

  return NextResponse.json({ log: inserted }, { status: 201 });
}

// DELETE /api/mood?id=<id> — 删除一条记录
export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id: userId } = auth.user;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  await db
    .delete(parentMoodLogs)
    .where(eq(parentMoodLogs.id, id));

  return NextResponse.json({ ok: true });
}
