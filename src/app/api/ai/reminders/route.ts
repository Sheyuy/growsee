import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ai } from "@eazo/sdk";
import { getChildrenByUser } from "@/lib/db/queries/children";
import { getRecordsByChild } from "@/lib/db/queries/growth-records";

ai.configure({ privateKey: process.env.EAZO_PRIVATE_KEY! });

// 计算距离生日的天数（支持跨年）
function daysUntilBirthday(birthDate: string): { days: number; isToday: boolean; age: number } {
  const birth = new Date(birthDate);
  const now = new Date();
  const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1);
  const days = Math.round((nextBirthday.getTime() - now.getTime()) / 86400000);
  const age = nextBirthday.getFullYear() - birth.getFullYear();
  return { days, isToday: days === 0, age };
}

// 获取即将到来的节日（30天内）
function getUpcomingHolidays(): { name: string; daysAway: number }[] {
  const now = new Date();
  const year = now.getFullYear();
  const holidays = [
    { name: "元旦", date: new Date(year, 0, 1) },
    { name: "春节", date: new Date(year, 0, 29) }, // 近似，实际农历需额外处理
    { name: "儿童节", date: new Date(year, 5, 1) },
    { name: "教师节", date: new Date(year, 8, 10) },
    { name: "国庆节", date: new Date(year, 9, 1) },
    { name: "圣诞节", date: new Date(year, 11, 25) },
    { name: "元旦", date: new Date(year + 1, 0, 1) },
  ];
  return holidays
    .map(h => ({ name: h.name, daysAway: Math.round((h.date.getTime() - now.getTime()) / 86400000) }))
    .filter(h => h.daysAway >= 0 && h.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway);
}

// 获取年龄段发展提示
function getAgeReminder(months: number): string | null {
  if (months === 6) return "6个月里程碑：宝宝开始能独坐片刻，注意观察头部控制能力";
  if (months === 12) return "1岁啦！这个阶段宝宝通常会说第一个词，注意语言环境";
  if (months === 18) return "18个月：分离焦虑高峰期，入园过渡期需要更多耐心";
  if (months === 24) return "2岁：「不」字阶段开始，自我意识萌发，这是正常发展";
  if (months === 36) return "3岁：幼儿园适应的关键期，社交能力开始快速发展";
  if (months === 48) return "4岁：为什么问题爆发期，好奇心旺盛，鼓励探索";
  if (months === 60) return "5岁：入学前准备阶段，培养规律作息和专注力";
  if (months === 72) return "6岁：开始上小学，情绪调节和同伴关系很重要";
  if (months === 84) return "7岁：道德感开始形成，喜欢讨论公平与规则";
  if (months === 108) return "9岁：同伴关系比父母更重要，尊重孩子的社交空间";
  if (months === 120) return "10岁：青春期前期，情绪波动增加，保持沟通渠道畅通";
  return null;
}

export interface ReminderItem {
  type: "birthday" | "holiday" | "age_milestone" | "weekly_summary" | "seasonal";
  title: string;
  body: string;
  urgency: "high" | "medium" | "low";
}

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const { id: userId } = authResult.user;

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  const allChildren = await getChildrenByUser(userId);
  const child = childId ? allChildren.find(c => c.id === childId) ?? allChildren[0] : allChildren[0];

  if (!child) return NextResponse.json([]);

  const reminders: ReminderItem[] = [];
  const name = child.nickname ?? child.name;

  // 1. 生日提醒
  if (child.birthDate) {
    const { days, isToday, age } = daysUntilBirthday(child.birthDate);
    const totalMonths = (new Date().getFullYear() - new Date(child.birthDate).getFullYear()) * 12
      + (new Date().getMonth() - new Date(child.birthDate).getMonth());

    if (isToday) {
      reminders.push({ type: "birthday", title: `🎂 今天是${name}的生日！`, body: `${name}今天${age}岁了，有没有什么想对他/她说的话？`, urgency: "high" });
    } else if (days <= 7) {
      reminders.push({ type: "birthday", title: `🎈 ${name}的生日快到了`, body: `还有 ${days} 天，${name}就 ${age} 岁了`, urgency: "medium" });
    }

    // 年龄段里程碑
    const milestone = getAgeReminder(totalMonths);
    if (milestone) {
      reminders.push({ type: "age_milestone", title: `📌 ${name}到了新阶段`, body: milestone, urgency: "medium" });
    }
  }

  // 2. 节日提醒
  const holidays = getUpcomingHolidays();
  for (const h of holidays.slice(0, 1)) {
    if (h.daysAway === 0) {
      reminders.push({ type: "holiday", title: `🎉 今天是${h.name}`, body: `节假日里，陪伴就是最好的礼物`, urgency: "low" });
    } else if (h.daysAway <= 7) {
      reminders.push({ type: "holiday", title: `📅 ${h.name}快到了`, body: `还有 ${h.daysAway} 天，可以和${name}一起做点有意思的事`, urgency: "low" });
    }
  }

  // 3. 季节提示
  const month = new Date().getMonth() + 1;
  const seasonTips: Record<number, string> = {
    3: "春天来了，户外活动时间可以增加，也是观察自然的好时机",
    6: "夏天注意防晒和补水，游泳是很好的亲子活动",
    9: "秋天昼夜温差大，注意增减衣物，也是上学适应的关键期",
    12: "冬天室内时间增多，可以多做一些亲子手工和阅读",
  };
  if (seasonTips[month]) {
    reminders.push({ type: "seasonal", title: `🌿 这个季节的小提示`, body: seasonTips[month], urgency: "low" });
  }

  // 4. 每周 AI 总结（周一触发）
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 1) {
    try {
      const recentRecords = await getRecordsByChild(child.id, userId).then(rs => rs.slice(0, 7));
      if (recentRecords.length >= 2) {
        const recordSummary = recentRecords
          .map(r => `[${r.category}] ${r.content.slice(0, 60)}`)
          .join("\n");
        const summaryPrompt = `根据以下这位 ${child.birthDate ? Math.floor(((new Date().getTime() - new Date(child.birthDate).getTime()) / 86400000) / 365) : "?"} 岁孩子近一周的成长记录，用 2-3 句话温柔地总结孩子这周的状态，并给父母一句轻松的话：\n${recordSummary}`;
        const resp = await ai.chat({
          model: "deepseek.v3.1",
          messages: [{ role: "user" as const, content: summaryPrompt }],
          stream: false,
        }) as { choices?: Array<{ message?: { content?: string } }> };
        const summary = resp.choices?.[0]?.message?.content ?? "";
        if (summary) {
          reminders.push({ type: "weekly_summary", title: `📝 ${name}这周的状态小结`, body: summary.slice(0, 120), urgency: "low" });
        }
      }
    } catch { /* 总结失败静默处理 */ }
  }

  return NextResponse.json(reminders);
}
