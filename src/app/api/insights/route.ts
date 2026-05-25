import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ai } from "@eazo/sdk";
import { getChildrenByUser } from "@/lib/db/queries/children";
import { getRecordsByChild } from "@/lib/db/queries/growth-records";
import { getUserById } from "@/lib/db/queries/users";

ai.configure({ privateKey: process.env.EAZO_PRIVATE_KEY! });

export interface InsightArticle {
  id: string;
  tag: string;
  title: string;
  summary: string;
  body: string;
  tips: { title: string; body: string }[];
  color: string;
  bgColor: string;
  isPersonalized: boolean;
}

const COLORS = [
  { color: "var(--color-primary)", bgColor: "rgba(156,180,138,0.1)" },
  { color: "var(--color-secondary)", bgColor: "rgba(211,110,82,0.08)" },
  { color: "#8B9DC3", bgColor: "rgba(139,157,195,0.1)" },
];

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const { id: userId } = authResult.user;

  const [dbUser, allChildren] = await Promise.all([
    getUserById(userId),
    getChildrenByUser(userId),
  ]);

  // 拉近期记录
  const allRecords = allChildren.length > 0
    ? await Promise.all(allChildren.map(c => getRecordsByChild(c.id, userId).then(rs => rs.slice(0, 5))))
    : [];

  // 组装家庭概况给 AI
  function describeAge(birthDate: string | null) {
    if (!birthDate) return "年龄未知";
    const months = Math.floor((Date.now() - new Date(birthDate).getTime()) / (30 * 24 * 3600 * 1000));
    const y = Math.floor(months / 12), m = months % 12;
    return y === 0 ? `${m}个月` : m === 0 ? `${y}岁` : `${y}岁${m}个月`;
  }

  const familySummary = allChildren.length === 0
    ? "用户尚未添加孩子信息"
    : allChildren.map((c, i) => {
        const recs = (allRecords[i] ?? []).map(r => r.content.slice(0, 40)).join("；");
        return `${c.nickname ?? c.name}（${c.gender === "girl" ? "女" : "男"}，${describeAge(c.birthDate)}）${recs ? `，近期：${recs}` : ""}`;
      }).join("\n");

  const parentInfo = dbUser?.familyNote ? `父母备注：${dbUser.familyNote}` : "";
  const month = new Date().getMonth() + 1;
  const season = month >= 3 && month <= 5 ? "春季" : month >= 6 && month <= 8 ? "夏季" : month >= 9 && month <= 11 ? "秋季" : "冬季";

  const prompt = `你是一位专业的育儿内容编辑，为家长生成个性化的育儿洞察文章。

家庭情况：
${familySummary}
${parentInfo}
当前季节：${season}

请根据上面的家庭情况，生成 3 篇有针对性的育儿洞察文章。每篇文章要：
1. 针对这个家庭的实际情况（孩子年龄段、近期状态）
2. 有科学依据，但语言亲切不生硬
3. 给出 2 条实用的小建议

以 JSON 数组格式返回，每个对象包含：
{
  "id": "唯一字符串",
  "tag": "主题标签（4-6字）",
  "title": "文章标题（10-20字，引人思考）",
  "summary": "一句话摘要（20字以内）",
  "body": "正文（80-120字，有温度，有依据）",
  "tips": [
    {"title": "建议标题（6字以内）", "body": "具体建议（30-50字）"},
    {"title": "建议标题（6字以内）", "body": "具体建议（30-50字）"}
  ]
}

只返回 JSON 数组，不要其他文字。`;

  try {
    const resp = await ai.chat({
      model: "deepseek.v3.1",
      messages: [{ role: "user" as const, content: prompt }],
      stream: false,
    }) as { choices?: Array<{ message?: { content?: string } }> };

    const raw = resp.choices?.[0]?.message?.content ?? "[]";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const articles: Omit<InsightArticle, "color" | "bgColor" | "isPersonalized">[] = JSON.parse(cleaned);

    const result: InsightArticle[] = articles.slice(0, 3).map((a, i) => ({
      ...a,
      ...COLORS[i % COLORS.length],
      isPersonalized: true,
    }));

    return NextResponse.json(result);
  } catch {
    // 降级：返回通用文章
    return NextResponse.json(getFallbackArticles());
  }
}

function getFallbackArticles(): InsightArticle[] {
  return [
    {
      id: "fallback-1", tag: "情绪发展",
      title: "孩子发脾气，背后在说什么？",
      summary: "情绪是孩子的语言，读懂它很重要",
      body: "儿童的情绪调节能力在6岁前仍在发展中，前额叶皮质尚未成熟，这意味着他们在情绪激动时真的「刹不住车」。根据发展心理学研究，父母的共情回应比立刻解决问题更能帮助孩子学会调节情绪。",
      tips: [
        { title: "先命名情绪", body: "在孩子平静后说：「你刚才好像很生气，因为玩具被拿走了。」帮他建立情绪词汇。" },
        { title: "不急着讲道理", body: "情绪激动时讲道理效果为零，等孩子平静下来再沟通。" },
      ],
      color: "var(--color-primary)", bgColor: "rgba(156,180,138,0.1)", isPersonalized: false,
    },
    {
      id: "fallback-2", tag: "语言发展",
      title: "孩子说话晚，真的需要担心吗？",
      summary: "了解语言发展的个体差异",
      body: "WHO 的发育参考数据显示，语言发展的正常范围比很多家长想象的宽得多。1岁会说1-2个词，2岁能说50个词以上，是常见的参考点，但个体差异很大。重要的是观察孩子是否在「理解」语言，而不只是「说」。",
      tips: [
        { title: "多说少问", body: "不要总问「这是什么」，改成描述性语言：「你在玩红色的球，球滚走了。」" },
        { title: "观察理解力", body: "如果孩子听得懂指令，只是说得少，通常不需要过度担心。" },
      ],
      color: "var(--color-secondary)", bgColor: "rgba(211,110,82,0.08)", isPersonalized: false,
    },
    {
      id: "fallback-3", tag: "亲子关系",
      title: "你不用每次都做对，孩子需要的是真实的你",
      summary: "完美父母不存在，但好父母可以修复",
      body: "心理学家温尼科特提出「足够好的父母」概念——不需要完美，只需要大多数时候在场、回应。研究表明，修复关系（在冲突后重新连接）的能力，比从不犯错更重要。父母的道歉，不会让你失去权威，反而让孩子学会修复关系。",
      tips: [
        { title: "允许自己出错", body: "发脾气后冷静了可以说：「妈妈刚才吼你不对，我那时候太累了。」" },
        { title: "修复优于完美", body: "每一次关系修复，都是在给孩子示范：关系可以被修好。" },
      ],
      color: "#8B9DC3", bgColor: "rgba(139,157,195,0.1)", isPersonalized: false,
    },
  ];
}
