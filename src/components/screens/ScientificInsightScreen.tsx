"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, RefreshCw, Sparkles, Plus } from "lucide-react";
import { QuickNoteSheet } from "@/components/QuickNoteSheet";

interface InsightArticle {
  id: string;
  title: string;
  summary: string;
  tag: string;
  bgColor: string;
  color: string;
  isPersonalized: boolean;
  body: string;
  tips: { title: string; body: string }[];
}

const DEMO_ARTICLES: InsightArticle[] = [
  {
    id: "1",
    title: "为什么孩子突然开始害怕分离？",
    summary: "3-4岁孩子常见的分离焦虑回归期，与认知能力飞跃有关。",
    tag: "情绪发展",
    bgColor: "rgba(255,240,220,0.7)",
    color: "#d36e52",
    isPersonalized: true,
    body: "很多家长会困惑：孩子明明已经过了分离焦虑最严重的阶段，为什么最近又突然不愿意去幼儿园了？这其实是3-4岁阶段一个常见的「回潮」现象。\n\n在这个年龄段，孩子的认知能力正在经历一次飞跃。他们开始理解「时间」的概念——知道「明天」意味着「妈妈今天会离开很长时间」。这种新的认知能力反而让他们重新体验到分离的焦虑。",
    tips: [
      { title: "建立告别仪式", body: "每天用相同的告别方式，比如一个拥抱、一句固定的话。仪式让孩子有预期感。" },
      { title: "不要偷偷溜走", body: "很多父母怕孩子哭会偷偷走，但这样会破坏信任。告诉孩子你要去哪、什么时候回来。" },
      { title: "信任老师", body: "把孩子交给老师后，果断离开。如果你自己在门口徘徊，孩子会感觉到你的焦虑。" },
    ],
  },
  {
    id: "2",
    title: "语言爆发期的正确打开方式",
    summary: "2-4岁语言发展关键期，每个孩子的节奏不同，但方法通用。",
    tag: "语言发展",
    bgColor: "rgba(235,245,230,0.7)",
    color: "#9cb48a",
    isPersonalized: true,
    body: "有些孩子两岁就能说完整句子，有些孩子到了四岁半才开始滔滔不绝。这是正常的个体差异，和智力无关。\n\n语言发展不仅仅是「能说出多少词」，还包括理解能力、表达能力、社交语言能力等多个维度。有些孩子在理解能力上很强，但表达能力相对较弱，或者反过来。",
    tips: [
      { title: "多描述，少提问", body: "不要说「这是什么颜色？」，而是说「看，这只苹果是红色的。」描述性语言更自然。" },
      { title: "不要急于纠正", body: "孩子说错的时候，不要直接纠正，而是用正确的说法重复一遍。他说「我吃了苹果」→ 你接「对，你吃了红红的苹果」。" },
      { title: "阅读绘本", body: "每天睡前10-15分钟的绘本阅读，是最有效的语言启蒙方式。不要求孩子复述，享受过程。" },
    ],
  },
  {
    id: "3",
    title: "孩子问「死亡」的问题，怎么回答？",
    summary: "6岁左右对死亡产生好奇是认知发展的里程碑，不是心理问题。",
    tag: "敏感话题",
    bgColor: "rgba(240,238,250,0.7)",
    color: "#7b6cb4",
    isPersonalized: false,
    body: "6岁左右的孩子开始对「死亡」产生好奇，这在发展心理学上是正常的。他们终于理解「死亡」是永久的，而不再像小时候那样以为死了还会回来。\n\n当孩子问「人死了会去哪里」，很多家长会紧张，担心孩子是不是有什么心理问题。但其实这只是认知发展的里程碑。孩子想了解的往往不是死亡本身，而是「你会不会离开我」。",
    tips: [
      { title: "诚实但不必过度", body: "可以诚实地说「我不知道死后会发生什么」，但可以分享你的信仰或想象。" },
      { title: "关注情绪", body: "如果孩子只是好奇，简单回答就好。如果他说完开始害怕，那就多拥抱、多安抚。" },
      { title: "不要回避", body: "说「别说这种不吉利的话」会让孩子觉得这个话题是禁忌。他更应该知道，有任何问题都可以问你。" },
    ],
  },
];

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
  const [articles, setArticles] = useState<InsightArticle[]>(DEMO_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setArticles([...DEMO_ARTICLES].sort(() => Math.random() - 0.5));
      setLoading(false);
    }, 800);
  };

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
        <motion.button whileTap={{ scale: 0.9 }} onClick={refresh} disabled={loading}
          className="w-8 h-8 rounded-full border flex items-center justify-center bg-white"
          style={{ borderColor: "var(--color-border)" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
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
        onSaved={() => {}}
      />
    </div>
  );
}
