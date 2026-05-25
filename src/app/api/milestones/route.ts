import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMilestonesByChild, createMilestone } from "@/lib/db/queries/milestones";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });
  const data = await getMilestonesByChild(childId, userId);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const body = await request.json();
  if (!body.childId || !body.title) {
    return NextResponse.json({ error: "childId and title required" }, { status: 400 });
  }
  const milestone = await createMilestone(userId, {
    childId: body.childId,
    title: body.title,
    description: body.description ?? null,
    milestoneType: body.milestoneType ?? "custom",
    emoji: body.emoji ?? "⭐",
    photoUrl: body.photoUrl ?? null,
    occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
  });
  return NextResponse.json(milestone, { status: 201 });
}
