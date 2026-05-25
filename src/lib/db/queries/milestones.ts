import { and, asc, eq } from "drizzle-orm";
import { db } from "../client";
import { milestones } from "../schema/milestones";
import type { Milestone } from "../schema/milestones";

export async function getMilestonesByChild(childId: string, userId: string): Promise<Milestone[]> {
  return db
    .select()
    .from(milestones)
    .where(and(eq(milestones.childId, childId), eq(milestones.userId, userId)))
    .orderBy(asc(milestones.occurredAt));
}

export async function createMilestone(
  userId: string,
  data: Omit<Milestone, "id" | "userId" | "createdAt">
): Promise<Milestone> {
  const rows = await db
    .insert(milestones)
    .values({ ...data, userId })
    .returning();
  return rows[0];
}

export async function deleteMilestone(id: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(milestones)
    .where(and(eq(milestones.id, id), eq(milestones.userId, userId)))
    .returning({ id: milestones.id });
  return rows.length > 0;
}
