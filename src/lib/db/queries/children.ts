import { desc, eq } from "drizzle-orm";
import { db } from "../client";
import { children } from "../schema/children";
import type { Child } from "../schema/children";

export async function getChildrenByUser(userId: string): Promise<Child[]> {
  return db.select().from(children).where(eq(children.userId, userId)).orderBy(desc(children.createdAt));
}

export async function getChildById(id: string, userId: string): Promise<Child | undefined> {
  const rows = await db
    .select()
    .from(children)
    .where(eq(children.id, id))
    .limit(1);
  const child = rows[0];
  if (!child || child.userId !== userId) return undefined;
  return child;
}

export async function createChild(
  userId: string,
  data: Omit<Child, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Child> {
  const rows = await db
    .insert(children)
    .values({ ...data, userId })
    .returning();
  return rows[0];
}

export async function updateChild(
  id: string,
  userId: string,
  data: Partial<Omit<Child, "id" | "userId" | "createdAt">>
): Promise<Child | undefined> {
  const rows = await db
    .update(children)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(children.id, id))
    .returning();
  const child = rows[0];
  if (!child || child.userId !== userId) return undefined;
  return child;
}

export async function deleteChild(id: string, userId: string): Promise<boolean> {
  const existing = await getChildById(id, userId);
  if (!existing) return false;
  await db.delete(children).where(eq(children.id, id));
  return true;
}
