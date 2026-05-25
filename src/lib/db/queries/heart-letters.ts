import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../client";
import { heartLetters } from "../schema/heart-letters";
import type { HeartLetter } from "../schema/heart-letters";

export async function getHeartLettersByChild(childId: string, userId: string): Promise<HeartLetter[]> {
  return db
    .select()
    .from(heartLetters)
    .where(and(eq(heartLetters.childId, childId), eq(heartLetters.userId, userId)))
    .orderBy(desc(heartLetters.createdAt));
}

// 获取「不关联具体孩子」的心里话（父母自己的情绪出口）
export async function getPersonalHeartLetters(userId: string): Promise<HeartLetter[]> {
  return db
    .select()
    .from(heartLetters)
    .where(and(isNull(heartLetters.childId), eq(heartLetters.userId, userId)))
    .orderBy(desc(heartLetters.createdAt));
}

export async function createHeartLetter(
  userId: string,
  data: Omit<HeartLetter, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<HeartLetter> {
  const rows = await db
    .insert(heartLetters)
    .values({ ...data, userId })
    .returning();
  return rows[0];
}

export async function deleteHeartLetter(id: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(heartLetters)
    .where(and(eq(heartLetters.id, id), eq(heartLetters.userId, userId)))
    .returning({ id: heartLetters.id });
  return rows.length > 0;
}
