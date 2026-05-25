import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getChildById, updateChild, deleteChild } from "@/lib/db/queries/children";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { id } = await params;
  const child = await getChildById(id, userId);
  if (!child) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(child);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { id } = await params;
  const body = await request.json();
  const child = await updateChild(id, userId, body);
  if (!child) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(child);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { id } = await params;
  const ok = await deleteChild(id, userId);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
