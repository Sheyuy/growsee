"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Check, ImagePlus, XCircle } from "lucide-react";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { addRecord, getChildren } from "@/lib/demo/store";

const CATEGORY_LABELS: Record<string, string> = {
  behavior: "行为观察", emotion: "情绪状态", language: "语言发展",
  physical: "身体成长", social: "社交能力", other: "日常记录",
};

interface QuickNoteSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type Phase = "input" | "saving" | "done";

export function QuickNoteSheet({ open, onClose, onSaved }: QuickNoteSheetProps) {
  const [content, setContent] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setContent("");
      setPhase("input");
      setPhotoUrl(null);
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!content.trim() || phase === "saving") return;
    setPhase("saving");
    try {
      const children = getChildren();
      const firstChild = children[0];
      addRecord({
        childId: firstChild?.id ?? null,
        category: "other",
        title: null,
        content: content.trim(),
        mood: null,
        photoUrl: photoUrl ?? null,
        recordedAt: new Date().toISOString(),
      });
      setPhase("done");
      onSaved?.();
      setTimeout(() => { onClose(); setPhase("input"); }, 1800);
    } catch {
      setPhase("input");
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    // Demo 模式：不上传图片，直接显示本地预览
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch { /* 静默失败 */ } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
                        Demo 模式 — 自动保存到记录
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSubmit}
                      disabled={!content.trim() || phase === "saving"}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: content.trim() && phase !== "saving" ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                      {phase === "saving"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />
                      }
                    </motion.button>
                  </div>
                </>
              )}

              {/* ── 完成阶段 ── */}
              {phase === "done" && (
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
                    已保存到「日常记录」
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
