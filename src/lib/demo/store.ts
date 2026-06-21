import type { Child } from "@/types";
import type { GrowthRecord } from "@/types";
import type { HeartLetter } from "@/types";
import type { ParentMoodLog } from "@/types";
import type { Milestone } from "@/types";

/* ── 存储键 ── */
const LS_KEY = {
  children: "growsee.children",
  records: "growsee.records",
  letters: "growsee.letters",
  moods: "growsee.moods",
  milestones: "growsee.milestones",
  initialized: "growsee.initialized",
} as const;

/* ── 类型安全存取 ── */
function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function save<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

/* ── 初始化：从 JSON 示范数据加载一次 ── */
export async function initStore() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(LS_KEY.initialized)) return;

  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const [children, records, letters, moods, milestones] = await Promise.all([
    fetch(`${base}/data/demo-children.json`).then((r) => r.json()).catch(() => [] as Child[]),
    fetch(`${base}/data/demo-records.json`).then((r) => r.json()).catch(() => [] as GrowthRecord[]),
    fetch(`${base}/data/demo-letters.json`).then((r) => r.json()).catch(() => [] as HeartLetter[]),
    fetch(`${base}/data/demo-mood.json`).then((r) => r.json()).catch(() => [] as ParentMoodLog[]),
    fetch(`${base}/data/demo-milestones.json`).then((r) => r.json()).catch(() => [] as Milestone[]),
  ]);

  save(LS_KEY.children, children);
  save(LS_KEY.records, records);
  save(LS_KEY.letters, letters);
  save(LS_KEY.moods, moods);
  save(LS_KEY.milestones, milestones);
  localStorage.setItem(LS_KEY.initialized, "true");
}

/* ── 清空所有数据（用于重置演示） ── */
export function resetStore() {
  if (typeof window === "undefined") return;
  Object.values(LS_KEY).forEach((k) => localStorage.removeItem(k));
}

/* ── Children ── */
export function getChildren(): Child[] {
  return load<Child>(LS_KEY.children);
}
export function addChild(child: Omit<Child, "id" | "createdAt" | "updatedAt" | "userId">): Child {
  const data = load<Child>(LS_KEY.children);
  const now = new Date().toISOString();
  const newChild: Child = {
    ...child,
    id: crypto.randomUUID(),
    userId: "demo-user",
    createdAt: now as unknown as Date,
    updatedAt: now as unknown as Date,
  } as Child;
  save(LS_KEY.children, [...data, newChild]);
  return newChild;
}
export function updateChild(id: string, patch: Partial<Child>): Child | null {
  const data = load<Child>(LS_KEY.children);
  const idx = data.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  data[idx] = { ...data[idx], ...patch, updatedAt: now as unknown as Date } as Child;
  save(LS_KEY.children, data);
  return data[idx];
}
export function deleteChild(id: string) {
  save(LS_KEY.children, load<Child>(LS_KEY.children).filter((c) => c.id !== id));
}

/* ── Growth Records ── */
export function getRecords(childId?: string): GrowthRecord[] {
  const all = load<GrowthRecord>(LS_KEY.records).sort(
    (a, b) => new Date(b.recordedAt || b.createdAt).getTime() - new Date(a.recordedAt || a.createdAt).getTime()
  );
  return childId ? all.filter((r) => r.childId === childId) : all;
}
export function addRecord(
  record: {
    childId?: string | null;
    category?: string;
    title?: string | null;
    content: string;
    mood?: string | null;
    photoUrl?: string | null;
    recordedAt?: string;
  }
): GrowthRecord {
  const data = load<GrowthRecord>(LS_KEY.records);
  const now = new Date().toISOString();
  const newRecord: GrowthRecord = {
    ...record,
    id: crypto.randomUUID(),
    userId: "demo-user",
    createdAt: now as unknown as Date,
    updatedAt: now as unknown as Date,
  } as GrowthRecord;
  save(LS_KEY.records, [newRecord, ...data]);
  return newRecord;
}
export function deleteRecord(id: string) {
  save(LS_KEY.records, load<GrowthRecord>(LS_KEY.records).filter((r) => r.id !== id));
}

/* ── Heart Letters ── */
export function getLetters(childId?: string): HeartLetter[] {
  const all = load<HeartLetter>(LS_KEY.letters).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return childId ? all.filter((l) => l.childId === childId) : all;
}
export function addLetter(
  letter: Omit<HeartLetter, "id" | "createdAt" | "updatedAt" | "userId">
): HeartLetter {
  const data = load<HeartLetter>(LS_KEY.letters);
  const now = new Date().toISOString();
  const newLetter: HeartLetter = {
    ...letter,
    id: crypto.randomUUID(),
    userId: "demo-user",
    createdAt: now as unknown as Date,
    updatedAt: now as unknown as Date,
  } as HeartLetter;
  save(LS_KEY.letters, [newLetter, ...data]);
  return newLetter;
}
export function deleteLetter(id: string) {
  save(LS_KEY.letters, load<HeartLetter>(LS_KEY.letters).filter((l) => l.id !== id));
}

/* ── Mood Logs ── */
export function getMoodLogs(): ParentMoodLog[] {
  return load<ParentMoodLog>(LS_KEY.moods).sort(
    (a, b) => new Date(b.loggedAt || b.createdAt).getTime() - new Date(a.loggedAt || a.createdAt).getTime()
  );
}
export function addMoodLog(
  log: { mood: string; note?: string | null; childId?: string | null; loggedAt?: string }
): ParentMoodLog {
  const data = load<ParentMoodLog>(LS_KEY.moods);
  const now = new Date().toISOString();
  const newLog: ParentMoodLog = {
    ...log,
    id: crypto.randomUUID(),
    userId: "demo-user",
    createdAt: now as unknown as Date,
  } as ParentMoodLog;
  save(LS_KEY.moods, [newLog, ...data]);
  return newLog;
}

/* ── Milestones ── */
export function getMilestones(childId?: string): Milestone[] {
  const all = load<Milestone>(LS_KEY.milestones).sort(
    (a, b) => new Date(b.occurredAt || b.createdAt).getTime() - new Date(a.occurredAt || a.createdAt).getTime()
  );
  return childId ? all.filter((m) => m.childId === childId) : all;
}
export function addMilestone(
  ms: Omit<Milestone, "id" | "createdAt" | "userId">
): Milestone {
  const data = load<Milestone>(LS_KEY.milestones);
  const now = new Date().toISOString();
  const newMs: Milestone = {
    ...ms,
    id: crypto.randomUUID(),
    userId: "demo-user",
    createdAt: now as unknown as Date,
  } as Milestone;
  save(LS_KEY.milestones, [newMs, ...data]);
  return newMs;
}

/* ── Home Summary ── */
export interface HomeSummary {
  childCount: number;
  recordCount: number;
  letterCount: number;
  lastChatPreview?: string;
  lastChatDaysAgo?: number;
  lastChatChildName?: string;
}
export function getHomeSummary(): HomeSummary {
  const children = getChildren();
  const records = getRecords();
  const letters = getLetters();
  return {
    childCount: children.length,
    recordCount: records.length,
    letterCount: letters.length,
    lastChatPreview: "为什么人会死？死了以后会去哪里？",
    lastChatDaysAgo: 3,
    lastChatChildName: "小阳",
  };
}

/* ── AI 预设数据 ── */
export function getQuickPrompts(childId?: string): string[] {
  if (childId === "child-01") {
    return [
      "小雨最近语言发展得特别快，正常吗？",
      "她有时候会突然大哭，是分离焦虑吗？",
      "3岁女孩该怎么培养阅读习惯？",
      "最近她总挑粉色衣服穿，要干预吗？",
    ];
  }
  if (childId === "child-02") {
    return [
      "6岁孩子问「人死了去哪里」该怎么回答？",
      "小阳最近对死亡很好奇，需要担心吗？",
      "怎么培养两个孩子的感情？",
      "他独立完成1100片乐高，需要额外支持吗？",
    ];
  }
  return [
    "孩子最近语言发展得特别快，正常吗？",
    "怎么培养两个孩子的感情？",
    "3-6岁孩子常见的情绪问题有哪些？",
    "孩子问「死亡」的问题该怎么回答？",
  ];
}

export function getReminders(childId?: string) {
  if (childId === "child-01") {
    return [
      {
        title: "小雨即将4岁生日",
        body: "还有3天就是小雨的生日了，3月15日。要不要准备个小惊喜？",
        urgency: "high" as const,
      },
    ];
  }
  if (childId === "child-02") {
    return [
      {
        title: "小阳牙齿检查",
        body: "建议每6个月做一次口腔检查，上次是去年12月。",
        urgency: "normal" as const,
      },
    ];
  }
  return [];
}
