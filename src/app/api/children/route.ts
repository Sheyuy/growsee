import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getChildrenByUser, createChild } from "@/lib/db/queries/children";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const data = await getChildrenByUser(userId);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const child = await createChild(userId, {
    name: body.name,
    nickname: body.nickname ?? null,
    gender: body.gender ?? null,
    birthDate: body.birthDate ?? null,
    avatarEmoji: body.avatarEmoji ?? "🌱",
    notes: body.notes ?? null,
    parentWish: body.parentWish ?? null,
    traits: body.traits ?? null,
  });
  return NextResponse.json(child, { status: 201 });
}
