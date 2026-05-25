"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Check, HelpCircle, ImagePlus, XCircle } from "lucide-react";
import { request } from "@/lib/api/request";
import { storage } from "@eazo/sdk";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import type { AutoArchiveResult } from "@/app/api/records/auto-archive/route";

const CATEGORY_LABELS: Record<string, string> = {
  behavior: "行为观察", emotion: "情绪状态", language: "语言发展",
  physical: "身体成长", social: "社交能力", other: "日常记录",
};

interface QuickNoteSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type Phase = "input" | "saving" | "confirm" | "done";

export function QuickNoteSheet({ open, onClose, onSaved }: QuickNoteSheetProps) {
  const [content, setContent] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [result, setResult] = useState<AutoArchiveResult | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setContent("");
      setPhase("input");
      setResult(null);
      setPhotoUrl(null);
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!content.trim() || phase === "saving") return;
    setPhase("saving");
    try {
      const res = await request("/api/records/auto-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, photoUrl }),
      });
      const data: AutoArchiveResult = await res.json();
      setResult(data);
      if (data.needsConfirm) {
        setPhase("confirm");
      } else {
        setPhase("done");
        onSaved?.();
        setTimeout(() => { onClose(); setPhase("input"); }, 1800);
      }
    } catch {
      setPhase("input");
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const { url } = await storage.upload(`records/${Date.now()}-${file.name}`, file);
      setPhotoUrl(url);
    } catch { /* 静默失败 */ } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!result) return;
    setPhase("saving");
    if (!confirmed) {
      // 用户否认：childId 置空，重新保存
      const res = await request("/api/records/auto-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          confirm: { childId: null, category: result.category, title: result.title },
        }),
      });
      const data: AutoArchiveResult = await res.json();
      setResult(data);
    } else {
      // 用户确认：用 AI 猜的结果保存
      const res = await request("/api/records/auto-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          confirm: { childId: result.childId, category: result.category, title: result.title },
        }),
      });
      const data: AutoArchiveResult = await res.json();
      setResult(data);
    }
    setPhase("done");
    onSaved?.();
    setTimeout(() => { onClose(); setPhase("input"); }, 1800);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => phase === "input" && onClose()}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
          />

          {/* 底部弹窗 */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag={phase === "input" ? "y" : false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.08}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 400) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden mx-auto"
            style={{ backgroundColor: "var(--color-accent)", maxWidth: "640px" }}
          >
            {/* 拖拽把手 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
            </div>

            <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">

              {/* ── 输入阶段 ── */}
              {(phase === "input" || phase === "saving") && (
                <>
                  <div className="flex justify-between items-center mb-3 pt-1">
                    <p className="text-sm font-semibold"
                      style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                      记一下
                    </p>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}>
                      <X className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                    </motion.button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    className="w-full text-base leading-relaxed border-0 focus:outline-none resize-none bg-transparent"
                    style={{ color: "var(--color-text-primary)", minHeight: "80px", maxHeight: "200px" }}
                    placeholder="随便说，孩子的、自己的都行……"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
                    }}
                    disabled={phase === "saving"}
                    rows={3}
                  />

                  {/* 图片预览 */}
                  {photoUrl && (
                    <div className="relative mt-2 inline-block">
                      <img src={photoUrl} alt="附图" className="h-20 w-20 object-cover rounded-xl" />
                      <button onClick={() => setPhotoUrl(null)}
                        className="absolute -top-1.5 -right-1.5 bg-white rounded-full">
                        <XCircle className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3 pt-3 border-t"
                    style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-2">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={handlePhotoSelect} />
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoUploading}
                        className="w-7 h-7 rounded-full border flex items-center justify-center"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "white" }}>
                        {photoUploading
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--color-text-muted)" }} />
                          : <ImagePlus className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                        }
                      </motion.button>
                      <VoiceInputButton
                        disabled={phase === "saving"}
                        onTranscript={(t) => setContent(prev => prev ? prev + " " + t : t)}
                      />
                      <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
                        AI 会自动判断关联谁、分什么类
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSubmit}
                      disabled={!content.trim() || phase === "saving"}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: content.trim() && phase !== "saving" ? "var(--color-primary)" : "var(--color-text-muted)" }}
                    >
                      {phase === "saving"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />
                      }
                    </motion.button>
                  </div>
                </>
              )}

              {/* ── 确认阶段 ── */}
              {phase === "confirm" && result && (
                <div className="py-3">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 shrink-0" style={{ color: "var(--color-secondary)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {result.confirmPrompt ?? "这条记录关于哪个孩子？"}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl mb-4 text-xs leading-relaxed line-clamp-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "var(--color-text-secondary)" }}>
                    {content}
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleConfirm(true)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                      style={{ backgroundColor: "var(--color-primary)" }}>
                      是的，关于{result.childName ?? "他/她"}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "white" }}>
                      不，这是我自己的
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ── 完成阶段 ── */}
              {phase === "done" && result && (
                <div className="py-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white mx-auto mb-3"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    <Check className="w-6 h-6" />
                  </motion.div>
                  <p className="text-sm font-semibold mb-1"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                    已记下来了
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {result.childName
                      ? `归到了${result.childName}的「${CATEGORY_LABELS[result.category] ?? "日常记录"}」`
                      : `已保存为「${CATEGORY_LABELS[result.category] ?? "日常记录"}」`}
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
