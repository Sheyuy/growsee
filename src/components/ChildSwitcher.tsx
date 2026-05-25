"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Child } from "@/lib/db/schema/children";

interface ChildSwitcherProps {
  children: Child[];
  activeChild: Child | null;
  onChange: (child: Child | null) => void;
  allowAll?: boolean;   // 是否允许选「全部」（记录页用）
  allLabel?: string;    // 「全部」的显示文字
}

export function ChildSwitcher({
  children: kids,
  activeChild,
  onChange,
  allowAll = false,
  allLabel = "全部",
}: ChildSwitcherProps) {
  const [open, setOpen] = useState(false);

  if (kids.length === 0) return null;

  const displayName = activeChild
    ? (activeChild.nickname ?? activeChild.name)
    : allLabel;
  const displayEmoji = activeChild ? (activeChild.avatarEmoji ?? "🌱") : "👨‍👩‍👧";

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
        style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-primary)",
        }}
      >
        <span className="text-sm">{displayEmoji}</span>
        <span>{displayName}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown className="w-3 h-3" style={{ color: "var(--color-text-muted)" }} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* 遮罩 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            {/* 下拉菜单 */}
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute top-full left-0 mt-1.5 rounded-2xl border shadow-md overflow-hidden z-50 min-w-[140px]"
              style={{ backgroundColor: "var(--color-accent)", borderColor: "var(--color-border)" }}
            >
              {allowAll && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onChange(null); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-left"
                  style={{
                    backgroundColor: !activeChild ? "rgba(156,180,138,0.12)" : "transparent",
                    color: !activeChild ? "var(--color-primary)" : "var(--color-text-secondary)",
                  }}
                >
                  <span className="text-sm">👨‍👩‍👧</span>
                  {allLabel}
                </motion.button>
              )}
              {kids.map(kid => (
                <motion.button
                  key={kid.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onChange(kid); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-left border-t first:border-t-0"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: activeChild?.id === kid.id ? "rgba(156,180,138,0.12)" : "transparent",
                    color: activeChild?.id === kid.id ? "var(--color-primary)" : "var(--color-text-secondary)",
                  }}
                >
                  <span className="text-sm">{kid.avatarEmoji ?? "🌱"}</span>
                  <span>{kid.nickname ?? kid.name}</span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
