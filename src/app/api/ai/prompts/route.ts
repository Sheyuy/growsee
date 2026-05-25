import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ai } from "@eazo/sdk";
import { getChildrenByUser } from "@/lib/db/queries/children";
import { getRecordsByChild } from "@/lib/db/queries/growth-records";

ai.configure({ privateKey: process.env.EAZO_PRIVATE_KEY! });

function describeAge(birthDate: string | null): { text: string; months: number } {
  if (!birthDate) return { text: "年龄未知", months: 0 };
  const birth = new Date(birthDate);
  const now = new Date();
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const text = y === 0 ? `${m}个月` : m === 0 ? `${y}岁` : `${y}岁${m}个月`;
  return { text, months: totalMonths };
}

function getSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春季";
  if (month >= 6 && month <= 8) return "夏季";
  if (month >= 9 && month <= 11) return "秋季";
  return "冬季";
}

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const { id: userId } = authResult.user;

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  const allChildren = await getChildrenByUser(userId);
  const child = childId ? allChildren.find(c => c.id === childId) ?? allChildren[0] : allChildren[0];

  // 无孩子档案：返回通用提问
  if (!child) {
    return NextResponse.json([
      "孩子今天有没有让你觉得特别可爱的瞬间？",
      "最近带孩子遇到最难的是什么？",
      "你有没有觉得自己哪里做得还不够好？",
      "孩子现在最让你担心的一件事是什么？",
    ]);
  }

  const { text: ageText, months } = describeAge(child.birthDate);
  const season = getSeason();
  const recentRecords = await getRecordsByChild(child.id, userId).then(rs => rs.slice(0, 5));
  const name = child.nickname ?? child.name;

  // 组装给 AI 的生成 prompt
  const recentSummary = recentRecords.length > 0
    ? recentRecords.map(r => `[${r.category}] ${r.title ?? ""} — ${r.content.slice(0, 60)}`).join("\n")
    : "暂无近期记录";

  const prompt = `你在帮一位家长设计今天打开育见 App 时看到的快捷提问入口。

孩子信息：
- 名字：${name}，${ageText}
- 当前季节：${season}
- 近期成长记录：
${recentSummary}

请生成 4 条贴合这个孩子当前状况的快捷提问，用于引导家长开口倾诉或提问。要求：
1. 口语化，像家长自己说的话，不要问句太正式
2. 结合孩子的年龄段特点（${ageText}阶段常见的发展课题）
3. 如果近期记录里有特别的内容，可以回应那件事
4. 不要重复，覆盖不同维度（情绪/行为/发展/日常）
5. 每条不超过 20 字
6. 直接输出 4 条，每行一条，不要编号，不要解释`;

  try {
    const resp = await ai.chat({
      model: "deepseek.v3.1",
      messages: [{ role: "user" as const, content: prompt }],
      stream: false,
    }) as { choices?: Array<{ message?: { content?: string } }> };

    const raw = resp.choices?.[0]?.message?.content ?? "";
    const lines = raw.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 40);
    const prompts = lines.slice(0, 4);

    // 补足到 4 条（若 AI 返回不足）
    const fallbacks = [
      `${name}今天有没有让你意外的表现？`,
      `最近带${name}有没有特别累的时候？`,
      `${name}这个阶段让你最困惑的是什么？`,
      "你有什么话一直想说但没说出口吗？",
    ];
    while (prompts.length < 4) prompts.push(fallbacks[prompts.length]);

    return NextResponse.json(prompts);
  } catch {
    // 降级：返回基于年龄段的静态提问
    const fallback = months < 12
      ? [`${name}最近睡眠怎么样？`, `${name}有没有什么新的变化？`, "今天带孩子有没有让你崩溃的瞬间？", "有没有什么让你特别感动的时刻？"]
      : months < 36
      ? [`${name}说话越来越多了吗？`, `${name}最近有没有让你头疼的行为？`, "你觉得自己在哪件事上做得还不够好？", "最近带娃最累的是哪一块？"]
      : months < 72
      ? [`${name}上学/幼儿园适应得怎么样？`, `${name}最近交到新朋友了吗？`, "你最担心${name}的哪一块发展？", "有没有什么事让你觉得自己误解了孩子？"]
      : [`${name}最近学习状态怎么样？`, `${name}有没有跟你说过悄悄话？`, "你觉得你们亲子关系最近怎么样？", "有没有你想对${name}说但没说出口的话？"];
    return NextResponse.json(fallback);
  }
}
