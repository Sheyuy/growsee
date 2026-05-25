import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getHeartLettersByChild, createHeartLetter } from "@/lib/db/queries/heart-letters";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });
  const data = await getHeartLettersByChild(childId, userId);
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
  const letter = await createHeartLetter(userId, {
    childId: body.childId,
    emotion: body.emotion ?? "joy",
    title: body.title ?? null,
    content: body.content,
    isTimeCapsule: body.isTimeCapsule ?? false,
    revealAtAge: body.revealAtAge ?? null,
  });
  return NextResponse.json(letter, { status: 201 });
}
