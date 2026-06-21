"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Loader2, Lock, Heart } from "lucide-react";
import { getChildren, getLetters, addLetter, deleteLetter } from "@/lib/demo/store";
import type { Child } from "@/types";
import type { HeartLetter } from "@/types";

const EMOTIONS = [
  { value: "joy", label: "欣喜", emoji: "✨", desc: "那一刻你特别高兴" },
  { value: "proud", label: "认同", emoji: "🌟", desc: "你为他/她骄傲" },
  { value: "gratitude", label: "感谢", emoji: "💛", desc: "感谢他/她来到你生命里" },
  { value: "wish", label: "祝愿", emoji: "🌱", desc: "你希望他/她将来……" },
  { value: "apology", label: "抱歉", emoji: "🤍", desc: "那次你没做好，想说一声对不起" },
  { value: "other", label: "说不清", emoji: "🌙", desc: "就是想说点什么" },
];

const REVEAL_AGES = ["10岁", "12岁", "15岁", "18岁", "成年后随时", "不打算给他看，只写给自己"];

function EmotionTag({ emotion }: { emotion: string }) {
  const e = EMOTIONS.find((x) => x.value === emotion) ?? EMOTIONS[5];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: "rgba(156,180,138,0.12)", color: "var(--color-primary)" }}>
      {e.emoji} {e.label}
    </span>
  );
}

function LetterCard({ letter, onDelete }: { letter: HeartLetter; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(letter.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring" as const, stiffness: 220, damping: 28 }}
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.75)", borderColor: "var(--color-border)" }}
    >
      <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded((v) => !v)}
        className="p-4 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-2">
          <EmotionTag emotion={letter.emotion} />
          <div className="flex items-center gap-2">
            {letter.isTimeCapsule && (
              <span className="flex items-center gap-0.5 text-[9px] font-medium" style={{ color: "var(--color-secondary)" }}>
                <Lock className="w-2.5 h-2.5" /> 时间胶囊
              </span>
            )}
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{date}</span>
          </div>
        </div>
        {letter.title && (
          <h4 className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            {letter.title}
          </h4>
        )}
        <p className={`text-xs leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
          style={{ color: "var(--color-text-secondary)" }}>
          {letter.content}
        </p>
        {letter.isTimeCapsule && letter.revealAtAge && (
          <p className="mt-2 text-[10px]" style={{ color: "var(--color-secondary)" }}>
            计划在{letter.revealAtAge}给他/她看
          </p>
        )}
      </motion.div>
      {expanded && (
        <div className="px-4 pb-3 border-t flex justify-end" style={{ borderColor: "var(--color-border)" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onDelete}
            className="text-[10px] flex items-center gap-1 py-1"
            style={{ color: "var(--color-text-muted)" }}>
            <X className="w-3 h-3" /> 删除这条
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

function AddLetterSheet({ open, onClose, childId, childName, onSaved }: {
  open: boolean; onClose: () => void; childId: string | null; childName: string; onSaved: () => void;
}) {
  const [emotion, setEmotion] = useState("joy");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isTimeCapsule, setIsTimeCapsule] = useState(false);
  const [revealAtAge, setRevealAtAge] = useState("18岁");
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(""); setContent(""); setEmotion("joy"); setIsTimeCapsule(false); };

  const handleSave = () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      addLetter({
        childId,
        emotion,
        title: title.trim() || null,
        content: content.trim(),
        isTimeCapsule,
        revealAtAge: isTimeCapsule ? revealAtAge : null,
      });
      reset(); onSaved(); onClose();
    } catch { } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring" as const, stiffness: 350, damping: 35 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
            onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 500) onClose(); }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ backgroundColor: "var(--color-accent)", maxHeight: "90svh" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
            </div>
            <div className="overflow-y-auto pb-12 px-5" style={{ maxHeight: "calc(90svh - 20px)" }}>
              <div className="flex justify-between items-center mb-4 pt-2">
                <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                  写一句悄悄话{childId ? `给${childName}` : "（只是写给自己）"}
                </h3>
                <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}>
                  <X className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
                </motion.button>
              </div>

              {/* 情感类型 */}
              <div className="mb-4">
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-text-secondary)" }}>
                  这句话背后的感受是
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EMOTIONS.map((e) => (
                    <motion.button key={e.value} whileTap={{ scale: 0.95 }} onClick={() => setEmotion(e.value)}
                      className="py-2.5 px-2 rounded-xl border text-center transition-colors"
                      style={{
                        backgroundColor: emotion === e.value ? "var(--color-primary)" : "white",
                        borderColor: emotion === e.value ? "var(--color-primary)" : "var(--color-border)",
                        color: emotion === e.value ? "white" : "var(--color-text-secondary)",
                      }}>
                      <div className="text-base">{e.emoji}</div>
                      <div className="text-[10px] font-medium mt-0.5">{e.label}</div>
                    </motion.button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  {EMOTIONS.find((e) => e.value === emotion)?.desc}
                </p>
              </div>

              {/* 标题 */}
              <div className="mb-3">
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                  给这句话起个名字（选填）
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
                  placeholder={`例：${childName}今天做的那件事……`}
                  value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              {/* 正文 */}
              <div className="mb-4">
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                  就想说 *
                </label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none resize-none"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}
                  placeholder={`也许你一直没说出口，现在可以在这里说……`}
                  rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
              </div>

              {/* 时间胶囊开关 */}
              <div className="mb-5">
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsTimeCapsule((v) => !v)}
                  className="flex items-center justify-between p-3 rounded-xl border cursor-pointer"
                  style={{ backgroundColor: isTimeCapsule ? "rgba(156,180,138,0.1)" : "white", borderColor: isTimeCapsule ? "var(--color-primary)" : "var(--color-border)" }}>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: isTimeCapsule ? "var(--color-primary)" : "var(--color-text-muted)" }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>设为时间胶囊</p>
                      <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>等孩子长大后再让他/她看</p>
                    </div>
                  </div>
                  <div className="w-10 h-5 rounded-full relative transition-colors"
                    style={{ backgroundColor: isTimeCapsule ? "var(--color-primary)" : "var(--color-border)" }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                      style={{ left: isTimeCapsule ? "calc(100% - 18px)" : "2px" }} />
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isTimeCapsule && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden">
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                        计划在什么时候给他/她看
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {REVEAL_AGES.map((age) => (
                          <motion.button key={age} whileTap={{ scale: 0.95 }} onClick={() => setRevealAtAge(age)}
                            className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                            style={{
                              backgroundColor: revealAtAge === age ? "var(--color-secondary)" : "white",
                              borderColor: revealAtAge === age ? "var(--color-secondary)" : "var(--color-border)",
                              color: revealAtAge === age ? "white" : "var(--color-text-secondary)",
                            }}>
                            {age}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave}
                disabled={!content.trim() || saving}
                className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: content.trim() ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                保存这句悄悄话
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function HeartLettersScreen() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [letters, setLetters] = useState<HeartLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadLetters = (c: Child) => {
    const data = getLetters(c.id);
    setLetters(data);
  };

  useEffect(() => {
    const data = getChildren();
    if (data.length > 0) { setChild(data[0]); loadLetters(data[0]); }
    setLoading(false);
  }, []);

  const handleDelete = (id: string) => {
    try {
      deleteLetter(id);
      setLetters((prev) => prev.filter((l) => l.id !== id));
    } catch { }
  };

  const emotionGroups = EMOTIONS.map((e) => ({
    ...e,
    items: letters.filter((l) => l.emotion === e.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-svh w-full" style={{ backgroundColor: "var(--color-accent)", maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }}>
      <header className="sticky top-0 z-20 flex items-center px-5 pt-8 pb-4 border-b backdrop-blur-md"
        style={{ backgroundColor: "rgba(245,241,232,0.85)", borderColor: "var(--color-border)" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { if (window.history.length > 1) router.back(); else router.push("/"); }}
          className="w-8 h-8 rounded-full border flex items-center justify-center mr-3 bg-white"
          style={{ borderColor: "var(--color-border)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
        </motion.button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            悄悄话
          </h2>
          <span className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
            {child ? `写给${child.nickname ?? child.name}，或只是写给自己` : "先在这里说出来"}
          </span>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: "var(--color-primary)" }}>
          <Plus className="w-4 h-4" />
        </motion.button>
      </header>

      <div className="px-5 py-5 pb-28">
        {/* 说明 */}
        <div className="mb-6 p-4 rounded-3xl border"
          style={{ backgroundColor: "rgba(255,255,255,0.5)", borderColor: "rgba(156,180,138,0.2)" }}>
          <div className="flex items-start gap-3">
            <div className="text-xl">💌</div>
            <div>
              <h4 className="text-xs font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
                有些话，不是不想说，是说不出口
              </h4>
              <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                欣喜、认同、感谢、歉意——那些在心里积累了很久的话，可以先在这里写下来。写给孩子，或者只是写给自己，都可以。
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl p-4 border animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "var(--color-border)" }}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-16 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                  <div className="h-3 w-12 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                </div>
                <div className="h-3 w-3/4 rounded-full mb-1.5" style={{ backgroundColor: "var(--color-border)" }} />
                <div className="h-3 w-full rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
              </div>
            ))}
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">💌</div>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-heading)" }}>
              还没有悄悄话
            </p>
            <p className="text-xs mb-5 mx-8" style={{ color: "var(--color-text-secondary)" }}>
              有什么想说给孩子听的，或者只是想写给自己看的，都可以放在这里。
            </p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}>
              写下第一句悄悄话
            </motion.button>
          </div>
        ) : (
          <div className="space-y-6">
            {emotionGroups.map((group) => (
              <div key={group.value}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{group.emoji}</span>
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--color-text-secondary)" }}>
                    {group.label} · {group.items.length} 条
                  </span>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {group.items.map((letter) => (
                      <LetterCard key={letter.id} letter={letter} onDelete={() => handleDelete(letter.id)} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddLetterSheet
          open={showAdd}
          onClose={() => setShowAdd(false)}
          childId={child?.id ?? null}
          childName={child ? (child.nickname ?? child.name) : "自己"}
          onSaved={() => child ? loadLetters(child) : undefined}
        />
    </div>
  );
}
