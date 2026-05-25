import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../client";
import { growthRecords } from "../schema/growth-records";
import type { GrowthRecord } from "../schema/growth-records";

export async function getRecordsByChild(childId: string, userId: string): Promise<GrowthRecord[]> {
  return db
    .select()
    .from(growthRecords)
    .where(and(eq(growthRecords.childId, childId), eq(growthRecords.userId, userId)))
    .orderBy(desc(growthRecords.recordedAt));
}

// 获取「全家/不关联孩子」的记录
export async function getFamilyRecords(userId: string): Promise<GrowthRecord[]> {
  return db
    .select()
    .from(growthRecords)
    .where(and(isNull(growthRecords.childId), eq(growthRecords.userId, userId)))
    .orderBy(desc(growthRecords.recordedAt));
}

export async function createRecord(
  userId: string,
  data: Omit<GrowthRecord, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<GrowthRecord> {
  const rows = await db
    .insert(growthRecords)
    .values({ ...data, userId })
    .returning();
  return rows[0];
}

export async function updateRecord(
  id: string,
  userId: string,
  data: Partial<Omit<GrowthRecord, "id" | "userId" | "createdAt">>
): Promise<GrowthRecord | undefined> {
  const rows = await db
    .update(growthRecords)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(growthRecords.id, id), eq(growthRecords.userId, userId)))
    .returning();
  return rows[0];
}

export async function deleteRecord(id: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(growthRecords)
    .where(and(eq(growthRecords.id, id), eq(growthRecords.userId, userId)))
    .returning({ id: growthRecords.id });
  return rows.length > 0;
}
