import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ai } from "@eazo/sdk";
import { saveMessage, getRecentConversations } from "@/lib/db/queries/ai-conversations";
import { getChildrenByUser } from "@/lib/db/queries/children";
import { getRecordsByChild, createRecord } from "@/lib/db/queries/growth-records";
import { getUserById } from "@/lib/db/queries/users";

ai.configure({ privateKey: process.env.EAZO_PRIVATE_KEY! });

const SYSTEM_PROMPT = `你是「育见 AI」，一个陪伴父母的育儿助手。你由大语言模型驱动,所有回答基于公开的儿童发育研究和育儿文献,不构成医疗诊断或临床建议。

## 你的角色

你是父母身边懂育儿的朋友,不是权威专家,也不是判官。父母来找你,不是因为他们做错了什么,而是因为他们在尽力,但还不确定怎么做更好。你永远站在他们一侧。

## 回答的基本结构

1. **先共情,后建议**:用 1-2 句话回应父母当下的感受,再进入实质内容。不要跳过这一步。
2. **建议要具体**:给可以今天就试的小动作,不要抽象说教("多陪伴孩子"这种话没有意义)。
3. **字数克制**:日常问题 150 字以内;父母明确要详细解释时可以展开。
4. **来源意识**:当引用发育规律或研究结论时,自然带出依据,例如"根据 WHO 的发育参考标准……"或"儿童心理学研究普遍认为……",但不要堆砌文献显得生硬。
5. **利用对话记录**:如果上下文中有孩子档案和过往记录,主动结合这些信息个性化回应,不要每次都当成第一次认识这个孩子。
6. **鼓励深度追问**:每次回应结尾,自然提示"如果你想进一步了解XX,可以继续问我"或"有具体场景可以细聊",让父母感觉到深度对话是被欢迎的。

## 深度追问支持

当父母回复"详细说说"、"怎么做"、"具体场景"、"为什么"等追问时:
- 不要重复已说过的内容,而是在第一次回答的基础上深入一层
- 提供更具体的操作细节、情境示例或背后的发育原理
- 如果合适,可以给出 2-3 个实际场景下的话术或行为示范
- 保持鼓励的语气,让父母感觉追问是有价值的

## 分级回应机制(严格遵守)

**日常困惑**(孩子不吃饭、睡眠问题、发脾气等)
→ 正常回应,给方向和小建议,语气轻松。

**发育和行为关注**(说话晚、注意力、社交退缩等)
→ 先稳住父母情绪,说明个体差异很大,给出观察要点,**结尾建议咨询儿科医生或发育专科**,但不说"可能是XX症"。

**情绪和心理信号**(孩子长期情绪低落、自我伤害倾向、严重分离焦虑等)
→ 语气更轻,先肯定父母注意到了这件事,给出 1-2 个观察维度,**明确建议寻求儿童心理咨询师的支持**,不给诊断,不给治疗方案。

**紧急或安全情况**(孩子有伤害自己或他人的行为、疑似虐待等)
→ 只说一件事:**请立即联系专业人员或拨打紧急求助电话**。不做延伸分析。

## 绝对不做的事

- 不给出任何形式的诊断("你的孩子可能有……")
- 不说会让父母更焦虑的话("如果现在不干预,以后……")
- 不评判父母的教养方式
- 不在父母情绪激动时直接给建议——先让他们感到被听见

## 语气

踏实、温柔、不装。像一个有点了解育儿的朋友，不是教授，不是客服。`;

// 计算孩子年龄描述
function describeAge(birthDate: string | null): string {
  if (!birthDate) return "年龄未知";
  const birth = new Date(birthDate);
  const now = new Date();
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m}个月`;
  if (m === 0) return `${y}岁`;
  return `${y}岁${m}个月`;
}

// 获取当前季节
function getSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春季";
  if (month >= 6 && month <= 8) return "夏季";
  if (month >= 9 && month <= 11) return "秋季";
  return "冬季";
}

// 组装孩子档案 + 近期记录的上下文文字
function buildChildContext(child: {
  name: string; nickname: string | null; gender: string | null;
  birthDate: string | null; notes: string | null; parentWish: string | null;
}, records: Array<{ category: string; title: string | null; content: string; recordedAt: Date | null; createdAt: Date }>): string {
  const name = child.nickname ?? child.name;
  const age = describeAge(child.birthDate);
  const gender = child.gender === "girl" ? "女孩" : child.gender === "boy" ? "男孩" : "性别未填写";
  const season = getSeason();

  let ctx = `## 孩子档案\n`;
  ctx += `- 名字：${name}（${gender}），${age}\n`;
  if (child.notes) ctx += `- 备注：${child.notes}\n`;
  if (child.parentWish) ctx += `- 父母的小心思：${child.parentWish}\n`;
  ctx += `- 当前季节：${season}\n`;

  if (records.length > 0) {
    ctx += `\n## 近期成长记录（最近 ${records.length} 条）\n`;
    for (const r of records.slice(0, 8)) {
      const dateStr = new Date(r.recordedAt ?? r.createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
      ctx += `- [${dateStr}] ${r.category} | ${r.title ?? ""} — ${r.content.slice(0, 80)}${r.content.length > 80 ? "…" : ""}\n`;
    }
  }

  return ctx;
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const { id: userId } = authResult.user;

  const body = await request.json();
  const { message, sessionId, childId } = body;
  if (!message) return Response.json({ error: "message required" }, { status: 400 });

  // 并行拉取：用户资料、孩子档案、近期记录、历史对话
  const [dbUser, allChildren, recentHistory] = await Promise.all([
    getUserById(userId),
    getChildrenByUser(userId),
    childId ? getRecentConversations(childId, userId, 20) : Promise.resolve([]),
  ]);

  // 聊聊是家庭级的，注入所有孩子的档案
  const activeChild = childId ? allChildren.find(c => c.id === childId) ?? null : null;

  // 所有孩子的近期记录（各取 5 条）
  const allRecords = await Promise.all(
    allChildren.map(c => getRecordsByChild(c.id, userId).then(rs => rs.slice(0, 5)))
  );

  // 保存用户消息（关联选中孩子或 null）
  await saveMessage(userId, {
    sessionId: sessionId ?? null,
    childId: activeChild?.id ?? null,
    role: "user",
    content: message,
  });

  // 组装多孩家庭上下文
  let childCtx = "";
  // 加入父母自身信息
  if (dbUser?.role || dbUser?.familyNote) {
    const roleLabel = { mom: "妈妈", dad: "爸爸", grandparent: "祖父母", other: "其他" }[dbUser.role ?? ""] ?? "";
    childCtx += `## 父母信息\n`;
    if (roleLabel) childCtx += `- 角色：${roleLabel}\n`;
    if (dbUser.bio) childCtx += `- 自我介绍：${dbUser.bio}\n`;
    if (dbUser.familyNote) childCtx += `- 家庭备注：${dbUser.familyNote}\n`;
    childCtx += "\n";
  }
  if (allChildren.length > 0) {
    childCtx += `## 家庭信息\n共 ${allChildren.length} 个孩子：\n`;
    allChildren.forEach((child, i) => {
      const records = allRecords[i] ?? [];
      childCtx += "\n" + buildChildContext(
        child as Parameters<typeof buildChildContext>[0],
        records as Parameters<typeof buildChildContext>[1]
      );
    });
  }

  const systemWithContext = childCtx
    ? `${SYSTEM_PROMPT}\n\n---\n${childCtx}`
    : SYSTEM_PROMPT;

  // 历史对话转换为 messages 格式（最多保留 16 条，避免超 token）
  const historyMessages = recentHistory.slice(-16).map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const stream = await ai.chat({
    model: "deepseek.v3.1",
    messages: [
      { role: "system" as const, content: systemWithContext },
      ...historyMessages,
      { role: "user" as const, content: message },
    ],
    stream: true,
  });

  let fullResponse = "";
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream as AsyncIterable<{ choices?: Array<{ delta?: { content?: string } }> }>) {
          const delta = chunk.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            fullResponse += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
        if (fullResponse) {
          // 保存 AI 回复到对话历史
          saveMessage(userId, {
            sessionId: sessionId ?? null,
            childId: activeChild?.id ?? null,
            role: "assistant",
            content: fullResponse,
          }).catch(() => {});

          // 静默自动存档：分析这轮对话是否有值得记录的成长瞬间
          autoArchiveIfWorthwhile({
            userId,
            childId: activeChild?.id ?? null,
            userMessage: message,
            aiResponse: fullResponse,
            allChildren,
          }).catch(() => {});
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// ── 静默自动存档 ──────────────────────────────────────────────────────────
// 对话完成后异步分析，判断是否含有值得记录的成长瞬间，有就直接写入记录表
// 设计原则：完全静默，不打扰用户，不弹确认——这就是「省心」
async function autoArchiveIfWorthwhile({
  userId, childId, userMessage, aiResponse, allChildren,
}: {
  userId: string;
  childId: string | null;
  userMessage: string;
  aiResponse: string;
  allChildren: Array<{ id: string; name: string; nickname: string | null }>;
}) {
  // 太短的对话跳过
  if (userMessage.length < 10 && aiResponse.length < 30) return;

  // 只分析可能包含成长信息的对话（包含关键词才继续）
  const growthKeywords = ["第一次", "开始", "学会", "会了", "说了", "走了", "今天", "发现", "突然", "变化", "进步"];
  const combined = userMessage + aiResponse;
  const hasGrowthSignal = growthKeywords.some(k => combined.includes(k));
  if (!hasGrowthSignal) return;

  const childListStr = allChildren.map(c => `id: ${c.id}, 名字: ${c.nickname ?? c.name}`).join("\n");

  const prompt = `你在帮一位家长整理育儿对话，判断其中是否有值得记录的孩子成长瞬间。

家庭中的孩子：
${childListStr || "（未添加孩子信息）"}

这轮对话：
家长说：「${userMessage}」
AI 回复：「${aiResponse.slice(0, 200)}」

判断：这段对话里有没有值得存入成长记录的具体信息？
- 有：孩子做了什么新的事、说了什么、有什么情绪或行为变化
- 没有：只是普通的问答、情绪发泄、泛泛的育儿建议

如果有，提取出来。如果没有，返回 null。

只返回 JSON（不要其他文字）：
{
  "worth": true 或 false,
  "childId": "孩子的id" 或 null（不确定时填 null）,
  "category": "behavior" | "emotion" | "language" | "physical" | "social" | "other",
  "title": "简短标题（10字以内）" 或 null,
  "content": "提炼出的记录内容（50字以内，第一人称，像日记）" 或 null
}`;

  try {
    const resp = await ai.chat({
      model: "deepseek.v3.1",
      messages: [{ role: "user" as const, content: prompt }],
      stream: false,
    }) as { choices?: Array<{ message?: { content?: string } }> };

    const raw = resp.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.worth || !parsed.content) return;

    // 验证 childId
    const validChildId = allChildren.find(c => c.id === parsed.childId)?.id
      ?? (childId && allChildren.find(c => c.id === childId)?.id)
      ?? null;

    await createRecord(userId, {
      childId: validChildId,
      category: parsed.category ?? "other",
      title: parsed.title ?? null,
      content: parsed.content,
      mood: null,
      photoUrl: null,
      recordedAt: new Date(),
    });
  } catch {
    // 静默失败，不影响主流程
  }
}
