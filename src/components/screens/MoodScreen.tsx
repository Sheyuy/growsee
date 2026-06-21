"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getMoodLogs, addMoodLog } from "@/lib/demo/store";
import type { ParentMoodLog } from "@/types";

const MOODS = [
  { value: "happy", emoji: "😄", label: "开心", color: "#FFD93D" },
  { value: "calm", emoji: "😌", label: "平静", color: "#6BCB77" },
  { value: "tired", emoji: "😴", label: "疲惫", color: "#A8DADC" },
  { value: "stressed", emoji: "😤", label: "焦虑", color: "#FF6B6B" },
  { value: "proud", emoji: "🥰", label: "骄傲", color: "#FF90BB" },
  { value: "overwhelmed", emoji: "😵", label: "崩溃", color: "#C77DFF" },
  { value: "peaceful", emoji: "🌿", label: "宁静", color: "#52B788" },
  { value: "anxious", emoji: "😰", label: "担心", color: "#F4A261" },
];

const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.value, m]));

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export function MoodScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<ParentMoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadLogs = useCallback(() => {
    try {
      setLogs(getMoodLogs());
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function handleSave() {
    if (!selectedMood) return;
    setSaving(true);
    try {
      addMoodLog({
        mood: selectedMood,
        note: note.trim() || null,
        childId: null,
        loggedAt: new Date().toISOString(),
      });
      setSelectedMood("");
      setNote("");
      loadLogs();
    } catch { } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ background: "linear-gradient(160deg, #fff8f0 0%, #f0faf4 100%)" }}>
      {/* 头部 */}
      <header className="sticky top-0 z-20 flex items-center px-5 pt-8 pb-4 border-b backdrop-blur-md"
        style={{ backgroundColor: "rgba(255,248,240,0.9)", borderColor: "var(--color-border)" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-8 h-8 rounded-full border flex items-center justify-center mr-3 bg-white"
          style={{ borderColor: "var(--color-border)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
        </motion.button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            父母情绪打卡
          </h2>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>记录你的状态，也照顾好自己 💛</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowHistory(!showHistory)}
          className="text-[11px] px-3 py-1.5 rounded-full border"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          {showHistory ? "打卡" : "历史"}
        </motion.button>
      </header>

      <div className="px-5 py-6 space-y-6 pb-24">
        {!showHistory ? (
          <>
            {/* 今日心情选择 */}
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
                现在感觉怎么样？
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {MOODS.map((m) => (
                  <motion.button key={m.value} whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedMood(m.value === selectedMood ? "" : m.value)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: selectedMood === m.value ? m.color : "transparent",
                      background: selectedMood === m.value
                        ? `${m.color}22`
                        : "rgba(255,255,255,0.7)",
                    }}>
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {m.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 备注 */}
            <AnimatePresence>
              {selectedMood && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                  <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-text-secondary)" }}>
                    想说点什么？（可选）
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-2xl text-base border focus:outline-none resize-none"
                    style={{ borderColor: "var(--color-border)", background: "rgba(255,255,255,0.9)", color: "var(--color-text)" }}
                    placeholder="今天发生了什么……"
                    rows={3}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={saving}
                    onClick={handleSave}
                    className="w-full mt-3 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
                    style={{ background: MOOD_MAP[selectedMood]?.color ?? "var(--color-primary)" }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-xl">{MOOD_MAP[selectedMood]?.emoji}</span>}
                    记录这一刻
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 今日最近打卡 */}
            {logs.length > 0 && (
              <div>
                <h3 className="text-xs font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>最近记录</h3>
                <div className="space-y-2">
                  {logs.slice(0, 3).map((log) => {
                    const m = MOOD_MAP[log.mood];
                    return (
                      <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-start gap-3 p-3 rounded-2xl border"
                        style={{ background: "rgba(255,255,255,0.7)", borderColor: "var(--color-border)" }}>
                        <span className="text-xl mt-0.5">{m?.emoji ?? "💛"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-semibold" style={{ color: m?.color ?? "var(--color-primary)" }}>{m?.label ?? log.mood}</span>
                            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{formatTime(log.loggedAt as unknown as string)}</span>
                          </div>
                          {log.note && <p className="text-[11px] leading-relaxed truncate" style={{ color: "var(--color-text-secondary)" }}>{log.note}</p>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* 历史视图 */
          <div>
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              情绪轨迹
            </h3>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--color-text-muted)" }} /></div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">💛</p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>还没有记录，开始打卡吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const m = MOOD_MAP[log.mood];
                  return (
                    <motion.div key={log.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-4 rounded-2xl border"
                      style={{ background: "rgba(255,255,255,0.8)", borderColor: "var(--color-border)" }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: `${m?.color ?? "#ffd93d"}33` }}>
                        {m?.emoji ?? "💛"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold" style={{ color: m?.color ?? "var(--color-primary)" }}>
                            {m?.label ?? log.mood}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                            {formatTime(log.loggedAt as unknown as string)}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{log.note}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
