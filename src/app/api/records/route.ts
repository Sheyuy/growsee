import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getRecordsByChild, createRecord } from "@/lib/db/queries/growth-records";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });
  const data = await getRecordsByChild(childId, userId);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const body = await request.json();
  if (!body.childId || !body.content) {
    return NextResponse.json({ error: "childId and content required" }, { status: 400 });
  }
  const record = await createRecord(userId, {
    childId: body.childId,
    category: body.category ?? "other",
    title: body.title ?? null,
    content: body.content,
    mood: body.mood ?? null,
    photoUrl: body.photoUrl ?? null,
    recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
  });
  return NextResponse.json(record, { status: 201 });
}
