"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";
import type { InsightArticle } from "@/app/api/insights/route";

function ArticleCard({ article }: { article: InsightArticle }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className="rounded-3xl border overflow-hidden mb-4"
      style={{ backgroundColor: article.bgColor, borderColor: "transparent" }}
    >
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: article.color }}>
            {article.tag}
          </span>
          {article.isPersonalized && (
            <span className="text-[9px] flex items-center gap-1" style={{ color: article.color }}>
              <Sparkles className="w-2.5 h-2.5" /> 为你定制
            </span>
          )}
        </div>
        <h3 className="text-base font-bold leading-snug mb-2"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          {article.title}
        </h3>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{article.summary}</p>
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-3">
          <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--color-text-secondary)" }}>
            {article.body}
          </p>
          {article.tips.map((tip, i) => (
            <div key={i} className="mb-3 p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: article.color }}>{tip.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{tip.body}</p>
            </div>
          ))}
        </motion.div>
      )}

      <div className="px-5 pb-4 flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setExpanded(v => !v)}
          className="text-xs font-medium" style={{ color: article.color }}>
          {expanded ? "收起" : "阅读全文 →"}
        </motion.button>
        <div className="flex items-center gap-3">
          <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>育见 AI · 仅供参考</span>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push("/ai-companion")}
            className="flex items-center gap-1 text-xs font-semibold" style={{ color: article.color }}>
            <MessageCircle className="w-3.5 h-3.5" /> 去聊聊
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function ScientificInsightScreen() {
  const user = useEazo((s) => s.auth.user);
  const [articles, setArticles] = useState<InsightArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadArticles = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await request("/api/insights");
      const data: InsightArticle[] = await res.json();
      setArticles(data);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { if (user) loadArticles(); }, [user]);

  return (
    <div className="min-h-svh w-full" style={{ backgroundColor: "var(--color-accent)", maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }}>
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-8 pb-4 border-b backdrop-blur-md"
        style={{ backgroundColor: "rgba(245,241,232,0.9)", borderColor: "var(--color-border)" }}>
        <div>
          <h2 className="text-base font-semibold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            洞察
          </h2>
          <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
            根据你家的情况为你推荐
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => loadArticles(true)} disabled={refreshing}
          className="w-8 h-8 rounded-full border flex items-center justify-center bg-white"
          style={{ borderColor: "var(--color-border)" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            style={{ color: "var(--color-text-secondary)" }} />
        </motion.button>
      </header>

      <div className="px-5 py-5 pb-24">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl p-5 mb-4 animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.6)", height: "160px" }}>
                <div className="h-4 w-24 rounded-full mb-3" style={{ backgroundColor: "var(--color-border)" }} />
                <div className="h-5 w-4/5 rounded-full mb-2" style={{ backgroundColor: "var(--color-border)" }} />
                <div className="h-3 w-3/5 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
              </div>
            ))}
            <p className="text-center text-xs py-2" style={{ color: "var(--color-text-muted)" }}>
              正在根据你的家庭情况生成推荐……
            </p>
          </>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📖</div>
            <p className="text-sm font-medium mb-2"
              style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-heading)" }}>
              先添加孩子的信息
            </p>
            <p className="text-xs mx-8" style={{ color: "var(--color-text-secondary)" }}>
              我们就能根据你家的情况推荐更有针对性的内容
            </p>
          </div>
        ) : articles.map(a => <ArticleCard key={a.id} article={a} />)}
      </div>
    </div>
  );
}
