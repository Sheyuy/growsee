"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Star, Heart, BookOpen, PenLine, Smile } from "lucide-react";
import { getChildren, getRecords, getLetters, getMoodLogs } from "@/lib/demo/store";
import type { Child } from "@/types";
import type { GrowthRecord } from "@/types";
import type { HeartLetter } from "@/types";
import type { ParentMoodLog } from "@/types";
import { QuickNoteSheet } from "@/components/QuickNoteSheet";
import { RecordEditorModal } from "@/components/screens/RecordEditorModal";
import { ChildSwitcher } from "@/components/ChildSwitcher";

// ── 类型 ───────────────────────────────────────────────
type FeedItem =
  | { kind: "record"; data: GrowthRecord; ts: number }
  | { kind: "letter"; data: HeartLetter; ts: number };

type FilterType = "all" | "record" | "milestone" | "letter" | "mood";

// ── 常量 ───────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  behavior: "行为观察", emotion: "情绪状态", language: "语言发展",
  physical: "身体成长", social: "社交能力", other: "日常记录",
};
const EMOTION_LABELS: Record<string, string> = {
  joy: "欣喜 ✨", proud: "认同 🌟", gratitude: "感谢 💛",
  wish: "祝愿 🌱", apology: "抱歉 🤍", other: "说不清 🌙",
};
const PARENT_MOODS: Record<string, { emoji: string; label: string; color: string }> = {
  happy:       { emoji: "😄", label: "开心",  color: "#FFD93D" },
  calm:        { emoji: "😌", label: "平静",  color: "#6BCB77" },
  tired:       { emoji: "😴", label: "疲惫",  color: "#A8DADC" },
  stressed:    { emoji: "😤", label: "焦虑",  color: "#FF6B6B" },
  proud:       { emoji: "🥰", label: "骄傲",  color: "#FF90BB" },
  overwhelmed: { emoji: "😵", label: "崩溃",  color: "#C77DFF" },
  peaceful:    { emoji: "🌿", label: "宁静",  color: "#52B788" },
  anxious:     { emoji: "😰", label: "担心",  color: "#F4A261" },
};

function timeLabel(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - ts) / 86400000);
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

// ── 成长记录卡片 ────────────────────────────────────────
function RecordCard({ item }: { item: GrowthRecord }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="rounded-2xl border overflow-hidden cursor-pointer"
      style={{ backgroundColor: "rgba(255,255,255,0.75)", borderColor: "var(--color-border)" }}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2 gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(156,180,138,0.12)", color: "var(--color-primary)" }}>
            {CATEGORY_LABELS[item.category] ?? "日常记录"}
          </span>
          <span className="text-[10px] shrink-0" style={{ color: "var(--color-text-muted)" }}>
            {timeLabel(new Date(item.recordedAt ?? item.createdAt).getTime())}
          </span>
        </div>
        {item.title && (
          <p className="text-sm font-semibold mb-1"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            {item.title}
          </p>
        )}
        <p className={`text-xs leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
          style={{ color: "var(--color-text-secondary)" }}>
          {item.content}
        </p>
      </div>
    </motion.div>
  );
}

// ── 心里话卡片 ──────────────────────────────────────────
function LetterCard({ item }: { item: HeartLetter }) {
  const [expanded, setExpanded] = useState(false);
  const emotionLabel = EMOTION_LABELS[item.emotion] ?? "说不清 🌙";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="rounded-2xl border overflow-hidden cursor-pointer"
      style={{ backgroundColor: "rgba(255,255,255,0.75)", borderColor: "rgba(211,110,82,0.2)" }}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(211,110,82,0.1)", color: "var(--color-secondary)" }}>
              悄悄话 · {emotionLabel}
            </span>
            {item.isTimeCapsule && (
              <span className="text-[9px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                🔒 时间胶囊
              </span>
            )}
          </div>
          <span className="text-[10px] shrink-0" style={{ color: "var(--color-text-muted)" }}>
            {timeLabel(new Date(item.createdAt).getTime())}
          </span>
        </div>
        {item.title && (
          <p className="text-sm font-semibold mb-1"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            {item.title}
          </p>
        )}
        <p className={`text-xs leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
          style={{ color: "var(--color-text-secondary)" }}>
          {item.content}
        </p>
      </div>
    </motion.div>
  );
}

// ── 主组件 ─────────────────────────────────────────────
export function RecordScreen() {
  const router = useRouter();
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [child, setChild] = useState<Child | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [moodLogs, setMoodLogs] = useState<ParentMoodLog[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [showNote, setShowNote] = useState(false);
  const [showRecord, setShowRecord] = useState(false);

  const loadFeed = useCallback((c: Child | null) => {
    if (!c) { setFeed([]); return; }
    const recs = getRecords(c.id);
    const letters = getLetters(c.id);
    const items: FeedItem[] = [
      ...(recs as GrowthRecord[]).map(d => ({
        kind: "record" as const, data: d,
        ts: new Date(d.recordedAt ?? d.createdAt).getTime(),
      })),
      ...(letters as HeartLetter[]).map(d => ({
        kind: "letter" as const, data: d,
        ts: new Date(d.createdAt).getTime(),
      })),
    ];
    items.sort((a, b) => b.ts - a.ts);
    setFeed(items);
    // 同步拉取父母情绪记录（不关联具体孩子）
    setMoodLogs(getMoodLogs());
  }, []);

  useEffect(() => {
    const data = getChildren();
    setAllChildren(data);
    if (data.length > 0) { setChild(data[0]); loadFeed(data[0]); }
    setLoading(false);
  }, [loadFeed]);

  const filtered = feed.filter(item => {
    if (filter === "all") return true;
    if (filter === "record") return item.kind === "record";
    if (filter === "letter") return item.kind === "letter";
    if (filter === "mood") return false; // 心情模式单独渲染
    return true;
  });

  // 按日期分组
  const grouped: { label: string; items: FeedItem[] }[] = [];
  for (const item of filtered) {
    const label = timeLabel(item.ts);
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) last.items.push(item);
    else grouped.push({ label, items: [item] });
  }

  const FILTERS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: "all",    label: "全部",   icon: <BookOpen className="w-3 h-3" /> },
    { key: "record", label: "成长记录", icon: <Star className="w-3 h-3" /> },
    { key: "letter", label: "悄悄话",  icon: <Heart className="w-3 h-3" /> },
    { key: "mood",   label: "我的心情", icon: <Smile className="w-3 h-3" /> },
  ];

  return (
    <div className="min-h-svh w-full" style={{ backgroundColor: "var(--color-accent)", maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }}>
      {/* 顶部 */}
      <header className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{ backgroundColor: "rgba(245,241,232,0.9)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between px-5 pt-8 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
              记录
            </h2>
            {allChildren.length > 0 && (
              <ChildSwitcher
                children={allChildren}
                activeChild={child}
                onChange={c => { setChild(c); if (c) loadFeed(c); }}
                allowAll={true}
                allLabel="全部"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setShowRecord(true)}
            </motion.button>
          </div>
        </div>
        {/* 筛选标签 */}
        <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-none">
          {FILTERS.map(f => (
            <motion.button key={f.key} whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: filter === f.key ? "var(--color-primary)" : "white",
                borderColor: filter === f.key ? "var(--color-primary)" : "var(--color-border)",
                color: filter === f.key ? "white" : "var(--color-text-secondary)",
              }}>
              {f.icon}{f.label}
            </motion.button>
          ))}
        </div>
      </header>

      {/* 内容 */}
      <div className="px-5 py-5 pb-28">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl p-4 border animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "var(--color-border)" }}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-20 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                  <div className="h-3 w-10 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                </div>
                <div className="h-3 w-2/3 rounded-full mb-1.5" style={{ backgroundColor: "var(--color-border)" }} />
                <div className="h-3 w-full rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
              </div>
            ))}
          </div>
        ) : grouped.length === 0 && filter !== "mood" ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📖</div>
            <p className="text-sm font-medium mb-2"
              style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-heading)" }}>
              还没有记录
            </p>
            <p className="text-xs mb-6 mx-10 leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}>
              孩子今天说了什么、做了什么、让你感动的瞬间，都可以写在这里。
            </p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowRecord(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}>
              写第一条记录
            </motion.button>
          </div>
        ) : filter !== "mood" ? (
          <div className="space-y-6">
            <AnimatePresence>
              {grouped.map(group => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}>
                      {group.label}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
                  </div>
                  <div className="space-y-3">
                    {group.items.map(item =>
                      item.kind === "record"
                        ? <RecordCard key={item.data.id} item={item.data} />
                        : <LetterCard key={item.data.id} item={item.data} />
                    )}
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        ) : null}

        {/* 心情模式 */}
        {!loading && filter === "mood" && (
          <div>
            {moodLogs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">💛</p>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>还没有情绪记录</p>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => { window.location.href = "/mood"; }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  开始打卡
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3">
                {moodLogs.map((log) => {
                  const m = PARENT_MOODS[log.mood] ?? { emoji: "💛", label: log.mood, color: "#FFD93D" };
                  const timeStr = new Date(log.loggedAt as unknown as string)
                    .toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                  return (
                    <motion.div key={log.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-4 rounded-2xl border"
                      style={{ background: "rgba(255,255,255,0.8)", borderColor: "var(--color-border)" }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: `${m.color}33` }}>
                        {m.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold" style={{ color: m.color }}>{m.label}</span>
                          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{timeStr}</span>
                        </div>
                        {log.note && (
                          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{log.note}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { window.location.href = "/mood"; }}
                  className="w-full py-3 rounded-2xl border text-sm text-center mt-2"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                  + 记录今天的心情
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      <QuickNoteSheet
        open={showNote}
        onClose={() => setShowNote(false)}
        onSaved={() => child && loadFeed(child)}
      />

      <RecordEditorModal
        open={showRecord}
        onClose={() => setShowRecord(false)}
        activeChild={child}
        allChildren={allChildren}
        onSaved={() => child && loadFeed(child)}
      />
    </div>
  );
}
