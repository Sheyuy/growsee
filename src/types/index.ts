// ── 孩子类型 ─────────────────────────────
export interface Child {
  id: string;
  userId: string;
  name: string;
  nickname: string | null;
  gender: "boy" | "girl" | "other" | null;
  birthDate: string | null;
  avatarEmoji: string | null;
  notes: string | null;
  parentWish: string | null;
  traits: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ── 成长记录类型 ─────────────────────────────
export interface GrowthRecord {
  id: string;
  childId: string | null;
  userId: string;
  category: string;
  title: string | null;
  content: string;
  mood: string | null;
  photoUrl: string | null;
  recordedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ── 心里话类型 ─────────────────────────────
export interface HeartLetter {
  id: string;
  userId: string;
  childId: string | null;
  emotion: string;
  title: string | null;
  content: string;
  isTimeCapsule: boolean;
  revealAtAge: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ── 父母心情记录类型 ─────────────────────────────
export interface ParentMoodLog {
  id: string;
  userId: string;
  mood: string;
  note: string | null;
  childId: string | null;
  loggedAt: Date | string;
  createdAt: Date | string;
}

// ── 里程碑类型 ─────────────────────────────
export interface Milestone {
  id: string;
  childId: string;
  userId: string;
  title: string;
  description: string | null;
  milestoneType: string | null;
  emoji: string | null;
  photoUrl: string | null;
  occurredAt: Date | string;
  createdAt: Date | string;
}

// ── 用户类型 ─────────────────────────────
export interface User {
  id: string;
  openid: string;
  unionid: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: string | null;
  bio: string | null;
  familyNote: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
