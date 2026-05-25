import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { upsertUser, getUserById, updateUser } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { user } = auth;

  // 先同步 Eazo 基础信息，再读完整 DB 记录（含扩展字段）
  await upsertUser({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  }).catch(() => {});

  const dbUser = await getUserById(user.id);
  return NextResponse.json({ ok: true, user: dbUser ?? user });
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id: userId } = auth.user;
  const body = await request.json();
  const updated = await updateUser(userId, {
    role: body.role ?? undefined,
    bio: body.bio ?? undefined,
    familyNote: body.familyNote ?? undefined,
  });
  return NextResponse.json({ ok: true, user: updated });
}
