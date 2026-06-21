"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight } from "lucide-react";
import { addChild } from "@/lib/demo/store";
import type { Child } from "@/types";

interface QuickSetupGuideProps {
  onComplete: (child: Child) => void;
}

const GENDER_OPTIONS = [
  { value: "boy", label: "男孩 👦" },
  { value: "girl", label: "女孩 👧" },
  { value: "other", label: "保密 ✨" },
];

export function QuickSetupGuide({ onComplete }: QuickSetupGuideProps) {
  const [step, setStep] = useState<"welcome" | "form">("welcome");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("other");
  const [birthDate, setBirthDate] = useState("");
  const [traits, setTraits] = useState("");
  const [parentWish, setParentWish] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleCreate() {
    if (!name.trim()) { setError("请输入孩子的名字"); return; }
    setSaving(true);
    setError("");
    try {
      const child = addChild({
        name: name.trim(),
        nickname: nickname.trim() || null,
        gender: gender as "boy" | "girl" | "other",
        birthDate: birthDate || null,
        avatarEmoji: "🌱",
        notes: null,
        parentWish: parentWish.trim() || null,
        traits: traits.trim() || null,
      });
      onComplete(child);
    } catch (e) {
      setError("建档失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6 z-50"
      style={{ background: "linear-gradient(160deg, #f9f4ef 0%, #f0f7f4 100%)" }}>
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div key="welcome"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center gap-6 w-full max-w-xs">
            <div className="text-5xl mb-2">🌱</div>
            <div className="flex flex-col items-center gap-3">
              <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                育见
              </h1>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                和孩子一起长大
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                记下每个珍贵瞬间
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep("form")}
              className="w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--color-primary)" }}>
              开始建档
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {step === "form" && (
          <motion.div key="form"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="w-full max-w-xs flex flex-col gap-4">
            <div className="text-center mb-2">
              <p className="text-xs font-medium tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                告诉我关于TA的一点点 ✨
              </p>
            </div>

            {/* 名字 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>孩子的名字 *</label>
              <input
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-base outline-none border"
                style={{ background: "rgba(255,255,255,0.9)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                placeholder="例如：小宝"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
            </div>

            {/* 昵称（可选） */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                小名 <span style={{ color: "var(--color-text-muted)" }}>（可选）</span>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl text-base outline-none border"
                style={{ background: "rgba(255,255,255,0.9)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                placeholder="TA 最常被叫的名字"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
              />
            </div>

            {/* 性别 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>性别</label>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map(opt => (
                  <motion.button key={opt.value} whileTap={{ scale: 0.95 }}
                    onClick={() => setGender(opt.value)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors"
                    style={{
                      background: gender === opt.value ? "var(--color-primary)" : "rgba(255,255,255,0.9)",
                      borderColor: gender === opt.value ? "var(--color-primary)" : "var(--color-border)",
                      color: gender === opt.value ? "#fff" : "var(--color-text)",
                    }}>
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 出生日期（可选） */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                出生日期 <span style={{ color: "var(--color-text-muted)" }}>（可选）</span>
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl text-base outline-none border"
                style={{ background: "rgba(255,255,255,0.9)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                value={birthDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setBirthDate(e.target.value)}
              />
            </div>

            {/* 孩子特质（可选） */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                TA的特点 <span style={{ color: "var(--color-text-muted)" }}>（可选）</span>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl text-base outline-none border"
                style={{ background: "rgba(255,255,255,0.9)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                placeholder="例如：特别爱笑，喜欢音乐"
                value={traits}
                onChange={e => setTraits(e.target.value)}
              />
            </div>

            {/* 父母期待（可选） */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                对TA的期待 <span style={{ color: "var(--color-text-muted)" }}>（可选）</span>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl text-base outline-none border"
                style={{ background: "rgba(255,255,255,0.9)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                placeholder="例如：愿你一直保持对世界的好奇"
                value={parentWish}
                onChange={e => setParentWish(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs text-center" style={{ color: "var(--color-secondary)" }}>{error}</p>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={saving || !name.trim()}
              onClick={handleCreate}
              className="w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 mt-2"
              style={{ background: name.trim() && !saving ? "var(--color-primary)" : "var(--color-text-muted)" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              进入育见
            </motion.button>

            <button onClick={() => setStep("welcome")} className="text-xs text-center mt-1"
              style={{ color: "var(--color-text-muted)" }}>
              ← 返回
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
