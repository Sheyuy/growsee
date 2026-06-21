"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageCircle, BookOpen, ChevronRight, Users } from "lucide-react";
import { getChildren, getRecords, getHomeSummary } from "@/lib/demo/store";
import type { Child } from "@/types";
import type { GrowthRecord } from "@/types";
import type { HomeSummary } from "@/lib/demo/store";
import { QuickNoteSheet } from "@/components/QuickNoteSheet";
import { RecordEditorModal } from "@/components/screens/RecordEditorModal";
import { QuickSetupGuide } from "@/components/QuickSetupGuide";

// ── 工具函数 ──────────────────────────────────────────────
function calcAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12
    + (now.getMonth() - birth.getMonth())
    + (now.getDate() < birth.getDate() ? -1 : 0);
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0 && m === 0) return "新生儿";
  if (y === 0) return `${m}个月`;
  if (m === 0) return `${y}岁`;
  return `${y}岁${m}个月`;
}

function daysUntilBirthday(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return Math.round((next.getTime() - now.getTime()) / 86400000);
}

const CATEGORY_LABELS: Record<string, string> = {
  behavior: "行为", emotion: "情绪", language: "语言",
  physical: "身体", social: "社交", other: "日常",
};

// ── 孩子卡片 ───────────────────────────────────────────────
function ChildCard({ child, records }: {
  child: Child;
  records: GrowthRecord[];
}) {
  const router = useRouter();
  const age = calcAge(child.birthDate);
  const latestRecord = records[0];
  const birthdayDays = child.birthDate ? daysUntilBirthday(child.birthDate) : null;
  const isBirthdaySoon = birthdayDays !== null && birthdayDays <= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border overflow-hidden mb-4"
      style={{ backgroundColor: "rgba(255,255,255,0.75)", borderColor: "var(--color-border)" }}
    >
      {/* 孩子头部信息 */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: "rgba(156,180,138,0.15)" }}>
              {child.avatarEmoji ?? "🌱"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                  {child.nickname ?? child.name}
                </h3>
                {isBirthdaySoon && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(211,110,82,0.12)", color: "var(--color-secondary)" }}>
                    {birthdayDays === 0 ? "🎂 今天生日" : `🎈 ${birthdayDays}天后生日`}
                  </span>
                )}
              </div>
              <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {age ?? "未填写生日"}{child.gender === "girl" ? " · 女孩" : child.gender === "boy" ? " · 男孩" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* 最近一条记录预览 */}
        {latestRecord ? (
          <motion.div whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/record?childId=${child.id}`)}
            className="rounded-2xl p-3 cursor-pointer"
            style={{ backgroundColor: "var(--color-accent)", maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(156,180,138,0.15)", color: "var(--color-primary)" }}>
                {CATEGORY_LABELS[latestRecord.category] ?? "日常"}
              </span>
              <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
                最近记录
              </span>
            </div>
            <p className="text-xs leading-relaxed line-clamp-2"
              style={{ color: "var(--color-text-secondary)" }}>
              {latestRecord.content}
            </p>
          </motion.div>
        ) : (
          <div className="rounded-2xl p-3 text-center"
            style={{ backgroundColor: "var(--color-accent)", border: "1px dashed var(--color-border)" }}>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              还没有记录，点 + 写第一条
            </p>
          </div>
        )}

        {/* 父母小心思 */}
        {child.parentWish && (
          <p className="mt-2 text-[10px] italic" style={{ color: "var(--color-text-muted)" }}>
            💌 {child.parentWish}
          </p>
        )}
        {/* 孩子特质 */}
        {child.traits && (
          <p className="mt-1.5 text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
            ✦ {child.traits}
          </p>
        )}
      </div>

      {/* 快捷操作 */}
      <div className="flex border-t" style={{ borderColor: "var(--color-border)" }}>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/ai-companion?childId=${child.id}`)}
          className="flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}>
          <MessageCircle className="w-3.5 h-3.5" />
          聊聊
        </motion.button>
        <div className="w-px" style={{ backgroundColor: "var(--color-border)" }} />
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/record?childId=${child.id}`)}
          className="flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}>
          <BookOpen className="w-3.5 h-3.5" />
          成长记录
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── 新手引导卡片 ───────────────────────────────────────────
function OnboardingCard({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-6 text-center mb-4"
      style={{ backgroundColor: "rgba(255,255,255,0.75)", borderColor: "var(--color-border)" }}>
      <div className="text-4xl mb-3">🌱</div>
      <h3 className="text-base font-semibold mb-2"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
        欢迎来到育见
      </h3>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        先为孩子创建一个档案，所有的记录和陪伴就从这里开始。
      </p>
      <motion.button whileTap={{ scale: 0.96 }} onClick={onAdd}
        className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
        style={{ backgroundColor: "var(--color-primary)" }}>
        添加第一个孩子
      </motion.button>
    </motion.div>
  );
}

// ── 主组件 ────────────────────────────────────────────────
export function HomeScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [recordsMap, setRecordsMap] = useState<Record<string, GrowthRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [showNote, setShowNote] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [user] = useState<{ name?: string; avatarUrl?: string | null }>({ name: "我" }); // mini-program auto-login

  const loadData = useCallback(() => {
    const kids = getChildren();
    const summaryData = getHomeSummary();
    setChildren(kids);
    setSummary(summaryData);
    setShowGuide(kids.length === 0);
    if (kids.length > 0) {
      const map: Record<string, GrowthRecord[]> = {};
      for (const k of kids) {
        map[k.id] = getRecords(k.id).slice(0, 3);
      }
      setRecordsMap(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddRecord = () => {
    setShowNote(true);
  };
  const handleAddChild = () => {
    setShowAddChild(true);
    // Re-trigger QuickSetupGuide by resetting the guide flag
    setShowGuide(true);
  };

  return (
    <div className="relative min-h-svh overflow-x-hidden w-full"
      style={{ backgroundColor: "var(--color-accent)", maxWidth: "640px" }}>

      {/* 快速建档引导（首次使用 或 点击添加孩子） */}
      <AnimatePresence>
        {(showGuide || showAddChild) && !loading && (
          <QuickSetupGuide
            onComplete={(child) => {
              setShowAddChild(false);
              setShowGuide(false);
              loadData();
            }}
          />
        )}
      </AnimatePresence>

      <div className="px-5 pt-safe-top">

        {/* 头部 */}
        <header className="pt-8 pb-4 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--color-primary)" }} />
              <span className="text-[10px] tracking-wider uppercase font-bold"
                style={{ color: "var(--color-primary)" }}>
                {children.length > 0 ? `${children.length} 个孩子` : "育见"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
              {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" })}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {children.length > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleAddRecord}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "white" }}>
                <Plus className="w-3 h-3" /> 记瞬间
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push("/profile")}
              className="w-9 h-9 rounded-full border flex items-center justify-center overflow-hidden"
              style={{ borderColor: "var(--color-border)", backgroundColor: "white" }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>我</span>
              }
            </motion.button>
          </div>
        </header>

        {/* 上次对话情境提示 */}
        {summary?.lastChatPreview && summary.lastChatDaysAgo != null && summary.lastChatDaysAgo <= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push("/ai-companion")}
            className="mb-5 px-4 py-3 rounded-2xl border cursor-pointer"
            style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5 shrink-0">💬</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {summary.lastChatDaysAgo === 0 ? "今天" : `${summary.lastChatDaysAgo}天前`}
                  {summary.lastChatChildName ? `，聊到了${summary.lastChatChildName}` : ""}
                </p>
                <p className="text-xs leading-relaxed line-clamp-2"
                  style={{ color: "var(--color-text-secondary)" }}>
                  「{summary.lastChatPreview}」
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: "var(--color-text-muted)" }} />
            </div>
          </motion.div>
        )}

        {/* 孩子卡片列表 */}
        <div className="mb-2 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
          <span className="text-xs font-bold tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            家庭成员
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-3xl border p-5 animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "var(--color-border)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                  <div className="flex-1">
                    <div className="h-4 w-20 rounded-full mb-1.5" style={{ backgroundColor: "var(--color-border)" }} />
                    <div className="h-3 w-14 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                  </div>
                </div>
                <div className="h-14 rounded-2xl" style={{ backgroundColor: "var(--color-border)" }} />
              </div>
            ))}
          </div>
        ) : children.length === 0 && !showGuide ? (
          <OnboardingCard onAdd={handleAddChild} />
        ) : (
          <AnimatePresence>
            {children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                records={recordsMap[child.id] ?? []}
              />
            ))}
          </AnimatePresence>

          {/* 添加孩子卡片 */}
          {!loading && children.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleAddChild}
              className="w-full rounded-3xl border flex items-center justify-center gap-2 py-3 mb-4"
              style={{ backgroundColor: "rgba(255,255,255,0.5)", borderColor: "var(--color-border)", borderStyle: "dashed" }}>
              <Plus className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>添加孩子</span>
            </motion.button>
          )}
        )}

        <div className="h-24" />
      </div>

      {/* 悬浮「记一下」按钮 */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setShowNote(true)}
        className="fixed bottom-20 right-5 md:bottom-8 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center z-40"
        style={{ backgroundColor: "var(--color-secondary)", boxShadow: "0 8px 24px rgba(211,110,82,0.3)" }}
        aria-label="记一下">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </motion.button>

      <QuickNoteSheet
        open={showNote}
        onClose={() => setShowNote(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
}
