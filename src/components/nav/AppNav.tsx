"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, MessageCircle, BookOpen, Sparkles } from "lucide-react";

const tabs = [
  { href: "/", label: "主页", icon: Home },
  { href: "/ai-companion", label: "聊聊", icon: MessageCircle },
  { href: "/record", label: "记录", icon: BookOpen },
  { href: "/scientific-insight", label: "洞察", icon: Sparkles },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[#FDFAF4]/90 backdrop-blur-md border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 min-h-[44px] min-w-[44px] justify-center relative px-2"
            >
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-0.5"
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-px left-2 right-2 h-0.5 rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}
                    transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full py-6 px-4">
      <div className="px-2 mb-8">
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          育见
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          温柔陪伴，科学成长
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link key={tab.href} href={tab.href}>
              <motion.div
                whileTap={{ scale: 0.98 }}
                whileHover={{ backgroundColor: "rgba(156,180,138,0.12)" }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? "rgba(156,180,138,0.15)" : "transparent",
                  color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
