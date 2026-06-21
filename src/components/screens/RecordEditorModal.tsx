"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ChevronDown } from "lucide-react";
import { addChild, addRecord } from "@/lib/demo/store";
import type { Child } from "@/types";

interface RecordEditorModalProps {
  open: boolean;
  onClose: () => void;
  activeChild: Child | null;        // 预设关联的孩子，null 表示未指定
  allChildren?: Child[];            // 多孩家庭时传入，用于选择关联哪个孩子
  onSaved: () => void;
  onChildCreated?: (child: Child) => void;
}

const CATEGORIES = [
  { value: "behavior", label: "行为观察", emoji: "👀" },
  { value: "emotion", label: "情绪状态", emoji: "💛" },
  { value: "language", label: "语言发展", emoji: "💬" },
  { value: "physical", label: "身体成长", emoji: "🌱" },
  { value: "social", label: "社交能力", emoji: "🤝" },
  { value: "other", label: "日常记录", emoji: "📝" },
];

const MOODS = [
  { value: "happy", label: "开心", emoji: "😊" },
  { value: "calm", label: "平静", emoji: "😌" },
  { value: "worried", label: "担心", emoji: "😟" },
  { value: "confused", label: "困惑", emoji: "🤔" },
];

// 创建孩子的内嵌表单
function NewChildForm({ onCreated }: { onCreated: (child: Child) => void }) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("other");
  const [birthDate, setBirthDate] = useState("");
  const [traits, setTraits] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const child = addChild({
        name: name.trim(),
        nickname: nickname.trim() || null,
        gender: gender as "boy" | "girl" | "other",
        birthDate: birthDate || null,
        avatarEmoji: "🌱",
        notes: null,
        parentWish: null,
        traits: traits.trim() || null,
      });
      onCreated(child);
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>孩子的名字 *</label>
        <input
          className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none focus:ring-1"
          style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}
          placeholder="例：小明"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>小名或昵称</label>
        <input
          className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none"
          style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
          placeholder="例：迎迎（选填）"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>出生日期</label>
        <input
          type="date"
          className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none"
          style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
          你注意到TA的特别之处（选填）
        </label>
        <textarea
          className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none resize-none"
          style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
          placeholder="比如：特别爱观察小虫子，记性很好，容易被声音吸引……随便写"
          rows={2}
          value={traits}
          onChange={(e) => setTraits(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-text-secondary)" }}>性别</label>
        <div className="flex gap-2">
          {[{ v: "boy", l: "男孩 🧒" }, { v: "girl", l: "女孩 👧" }, { v: "other", l: "不填" }].map((g) => (
            <motion.button
              key={g.v}
              whileTap={{ scale: 0.96 }}
              onClick={() => setGender(g.v)}
              className="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors"
              style={{
                backgroundColor: gender === g.v ? "var(--color-primary)" : "white",
                color: gender === g.v ? "white" : "var(--color-text-secondary)",
                borderColor: gender === g.v ? "var(--color-primary)" : "var(--color-border)",
              }}
            >
              {g.l}
            </motion.button>
          ))}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleSubmit}
        disabled={!name.trim() || saving}
        className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
        style={{ backgroundColor: name.trim() ? "var(--color-primary)" : "var(--color-text-muted)" }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        建立孩子的成长档案
      </motion.button>
    </div>
  );
}

export function RecordEditorModal({ open, onClose, activeChild, allChildren, onSaved, onChildCreated }: RecordEditorModalProps) {
  const [mode, setMode] = useState<"record" | "new-child">(activeChild || (allChildren && allChildren.length > 0) ? "record" : "new-child");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(activeChild?.id ?? null);
  const [category, setCategory] = useState("other");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // 当 activeChild 外部变化时同步
  useEffect(() => {
    setSelectedChildId(activeChild?.id ?? null);
    setMode(activeChild || (allChildren && allChildren.length > 0) ? "record" : "new-child");
  }, [activeChild, allChildren]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      addRecord({
        childId: selectedChildId ?? null,
        category,
        title: title.trim() || null,
        content: content.trim(),
        mood: mood || null,
        photoUrl: null,
        recordedAt: new Date().toISOString(),
      });
      setTitle("");
      setContent("");
      setMood("");
      setCategory("other");
      onSaved();
      onClose();
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />
          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring" as const, stiffness: 350, damping: 35 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
            </div>

            <div className="px-5 pb-8 max-h-[85svh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                  {mode === "new-child" ? "建立孩子的档案" : "记录今天的瞬间"}
                </h3>
                <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}>
                  <X className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
                </motion.button>
              </div>

              {mode === "new-child" ? (
                <NewChildForm
                  onCreated={(child) => {
                    onChildCreated?.(child);
                    setMode("record");
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {/* 关联孩子选择器（多孩或无预设孩子时显示） */}
                  {allChildren && allChildren.length > 0 && (
                    <div>
                      <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-text-secondary)" }}>
                        这条记录关于谁
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allChildren.map(c => (
                          <motion.button key={c.id} whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedChildId(c.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: selectedChildId === c.id ? "var(--color-primary)" : "white",
                              borderColor: selectedChildId === c.id ? "var(--color-primary)" : "var(--color-border)",
                              color: selectedChildId === c.id ? "white" : "var(--color-text-secondary)",
                            }}>
                            {c.avatarEmoji ?? "🌱"} {c.nickname ?? c.name}
                          </motion.button>
                        ))}
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedChildId(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: selectedChildId === null ? "var(--color-secondary)" : "white",
                            borderColor: selectedChildId === null ? "var(--color-secondary)" : "var(--color-border)",
                            color: selectedChildId === null ? "white" : "var(--color-text-secondary)",
                          }}>
                          👨‍👩‍👧‍👦 全家 / 不关联
                        </motion.button>
                      </div>
                    </div>
                  )}
                  {/* 分类 */}
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-text-secondary)" }}>这条记录属于</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <motion.button
                          key={cat.value}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCategory(cat.value)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                          style={{
                            backgroundColor: category === cat.value ? "var(--color-primary)" : "white",
                            color: category === cat.value ? "white" : "var(--color-text-secondary)",
                            borderColor: category === cat.value ? "var(--color-primary)" : "var(--color-border)",
                          }}
                        >
                          {cat.emoji} {cat.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* 标题 */}
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>给这个瞬间起个名字（选填）</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none"
                      style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
                      placeholder="例：迎迎的拉链搏斗记"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* 内容 */}
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>用自己的话记下来 *</label>
                    <textarea
                      className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none resize-none"
                      style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}
                      placeholder="就用自己的话，不用写得很完整，哪怕一句话也好……"
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>

                  {/* 当下心情 */}
                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-text-secondary)" }}>此刻你的感受（选填）</label>
                    <div className="flex gap-2">
                      {MOODS.map((m) => (
                        <motion.button
                          key={m.value}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setMood(mood === m.value ? "" : m.value)}
                          className="flex-1 py-2 rounded-xl text-xs border transition-colors"
                          style={{
                            backgroundColor: mood === m.value ? "rgba(156,180,138,0.15)" : "white",
                            color: mood === m.value ? "var(--color-primary)" : "var(--color-text-secondary)",
                            borderColor: mood === m.value ? "var(--color-primary)" : "var(--color-border)",
                          }}
                        >
                          {m.emoji}
                          <span className="block mt-0.5">{m.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSave}
                    disabled={!content.trim() || saving}
                    className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: content.trim() ? "var(--color-primary)" : "var(--color-text-muted)" }}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    保存这个瞬间
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
