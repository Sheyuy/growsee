/**
 * 育见 App 测试数据种子
 * 覆盖 6 个典型中国家庭场景，验证多孩、不同年龄、单亲、祖父母代养等使用场景
 * 运行：bun scripts/seed-test-data.ts
 */
import { config } from "dotenv";
config({ path: ".env" });

import { db } from "../src/lib/db/client";
import { users } from "../src/lib/db/schema/users";
import { children } from "../src/lib/db/schema/children";
import { growthRecords } from "../src/lib/db/schema/growth-records";
import { milestones } from "../src/lib/db/schema/milestones";
import { heartLetters } from "../src/lib/db/schema/heart-letters";

// ── 工具函数 ──────────────────────────────────────────
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function yearsAgo(y: number, m = 0) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - y);
  d.setMonth(d.getMonth() - m);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("开始注入测试数据...\n");

  // ════════════════════════════════════════════════════
  // 家庭 1：陈思雨 × 李磊 — 新手爸妈，独生女 18 个月
  // 场景：刚刚成为父母，孩子还是小宝宝，焦虑感最强
  // ════════════════════════════════════════════════════
  const [user1] = await db.insert(users).values({
    id: "test-user-chensiyu",
    name: "陈思雨",
    email: "chensiyu@test.yujian.app",
    avatarUrl: null,
  }).onConflictDoUpdate({ target: users.id, set: { name: "陈思雨" } }).returning();

  const [child1] = await db.insert(children).values({
    id: "test-child-nuonuo",
    userId: user1.id,
    name: "李诺诺",
    nickname: "诺诺",
    gender: "girl",
    birthDate: yearsAgo(1, 6),
    avatarEmoji: "🌸",
    notes: "早产儿，34周出生，体重2.4kg，目前发育追赶中",
  }).onConflictDoUpdate({ target: children.id, set: { nickname: "诺诺" } }).returning();

  await db.insert(growthRecords).values([
    {
      id: "rec-nuonuo-1",
      childId: child1.id, userId: user1.id,
      category: "language", title: "第一次喊妈妈",
      content: "今天早上7点半，诺诺睁开眼睛看着我，清清楚楚喊了一声「妈妈」。我愣了三秒，然后就哭了。她可能不知道这两个字对我意味着什么。",
      mood: "happy", recordedAt: daysAgo(3),
    },
    {
      id: "rec-nuonuo-2",
      childId: child1.id, userId: user1.id,
      category: "physical", title: "扶着沙发站了18秒",
      content: "物理治疗师说诺诺的肌张力比同月龄孩子稍低，需要多练习。今天她自己扶着沙发站起来，居然站了将近20秒。旁边婆婆喊「快来看」，她被吓到坐下去了，但已经很好了。",
      mood: "happy", recordedAt: daysAgo(7),
    },
    {
      id: "rec-nuonuo-3",
      childId: child1.id, userId: user1.id,
      category: "emotion", title: "离乳第三天崩溃大哭",
      content: "决定断奶了。诺诺睡前找奶找了一个多小时，哭得上气不接下气。我躲在卫生间哭了半天，不知道这个决定对不对。网上说18个月断奶太晚了，也有人说再早一些更好。我到底做错了什么吗。",
      mood: "worried", recordedAt: daysAgo(14),
    },
  ]).onConflictDoNothing();

  await db.insert(milestones).values([
    { id: "ms-nuonuo-1", childId: child1.id, userId: user1.id, title: "第一次独立坐稳", emoji: "🌱", milestoneType: "custom", occurredAt: daysAgo(120) },
    { id: "ms-nuonuo-2", childId: child1.id, userId: user1.id, title: "喊出第一声妈妈", emoji: "💛", milestoneType: "first_word", occurredAt: daysAgo(3) },
  ]).onConflictDoNothing();

  await db.insert(heartLetters).values([
    {
      id: "hl-nuonuo-1",
      childId: child1.id, userId: user1.id,
      emotion: "gratitude",
      title: "谢谢你选择了我",
      content: "诺诺，谢谢你在34周就迫不及待地来到这个世界。你在保温箱里的那27天，我每天按时去送母乳，手都挤破了，但我从没觉得苦。因为是你。\n\n你让我第一次知道，原来一个人可以同时这么害怕，又这么勇敢。",
      isTimeCapsule: true, revealAtAge: "18岁",
    },
    {
      id: "hl-nuonuo-2",
      childId: child1.id, userId: user1.id,
      emotion: "apology",
      title: "对不起，那天我不应该发脾气",
      content: "那天你一直哭，我已经连续三个晚上没睡超过两小时了。我对你吼了一声「够了！」。你突然安静下来，用那双大眼睛看着我，我立刻就后悔了。\n\n你才一岁多，你只是不舒服，不会用别的方式表达。而我，是大人。我应该做得更好。",
      isTimeCapsule: false, revealAtAge: null,
    },
  ]).onConflictDoNothing();

  console.log("✓ 家庭1 完成：陈思雨 × 诺诺（18个月，早产宝宝）");

  // ════════════════════════════════════════════════════
  // 家庭 2：王建国 — 单亲爸爸，儿子 6 岁，刚上小学
  // 场景：爸爸独自带孩子，面对学业压力和情绪管理挑战
  // ════════════════════════════════════════════════════
  const [user2] = await db.insert(users).values({
    id: "test-user-wangjianguo",
    name: "王建国",
    email: "wangjianguo@test.yujian.app",
    avatarUrl: null,
  }).onConflictDoUpdate({ target: users.id, set: { name: "王建国" } }).returning();

  const [child2] = await db.insert(children).values({
    id: "test-child-xiaobao",
    userId: user2.id,
    name: "王小宝",
    nickname: "小宝",
    gender: "boy",
    birthDate: yearsAgo(6),
    avatarEmoji: "🦁",
    notes: "一年级，老师反映上课容易分心，喜欢恐龙和乐高",
  }).onConflictDoUpdate({ target: children.id, set: { nickname: "小宝" } }).returning();

  await db.insert(growthRecords).values([
    {
      id: "rec-xiaobao-1",
      childId: child2.id, userId: user2.id,
      category: "social", title: "第一次被同学排挤",
      content: "小宝放学回来说，今天体育课分组没人要他。我问为什么，他说「因为我跑得慢」。我不知道说什么好，就带他去楼下踢了半小时球。他好像没事了，但我一直在想这件事。",
      mood: "worried", recordedAt: daysAgo(5),
    },
    {
      id: "rec-xiaobao-2",
      childId: child2.id, userId: user2.id,
      category: "behavior", title: "自己订了闹钟起床",
      content: "不知道从哪学的，他把我手机的闹钟调到6:30，说「爸爸你起不来我帮你叫」。今天早上他真的在我前面起来了，还给我倒了一杯水放在床头。这个臭小子。",
      mood: "happy", recordedAt: daysAgo(2),
    },
    {
      id: "rec-xiaobao-3",
      childId: child2.id, userId: user2.id,
      category: "emotion", title: "问我妈妈去哪了",
      content: "今晚睡前，小宝突然问「爸爸，其他小朋友都有妈妈，我的妈妈去哪了」。我说妈妈在很远的地方，但很爱你。他说「那为什么她不来看我」。\n\n我没有答案。我只是把他抱得很紧。",
      mood: "confused", recordedAt: daysAgo(10),
    },
  ]).onConflictDoNothing();

  await db.insert(heartLetters).values([
    {
      id: "hl-xiaobao-1",
      childId: child2.id, userId: user2.id,
      emotion: "proud",
      title: "你比你知道的更勇敢",
      content: "小宝，你知道吗，从你两岁开始爸爸就一个人带你，我也不知道怎么当爸爸，也不会梳头发，不会给你扎辫子，第一次送你上幼儿园我在门口哭了。\n\n但你从来没有让我失望过。你是这个世界上最勇敢的小朋友。",
      isTimeCapsule: true, revealAtAge: "18岁",
    },
  ]).onConflictDoNothing();

  console.log("✓ 家庭2 完成：王建国（单亲爸爸）× 小宝（6岁，刚上小学）");

  // ════════════════════════════════════════════════════
  // 家庭 3：张美玲 — 妈妈，两个孩子，大女儿9岁，小儿子3岁
  // 场景：多孩家庭，大小孩冲突，「老大情绪」管理
  // ════════════════════════════════════════════════════
  const [user3] = await db.insert(users).values({
    id: "test-user-zhangmeiling",
    name: "张美玲",
    email: "zhangmeiling@test.yujian.app",
    avatarUrl: null,
  }).onConflictDoUpdate({ target: users.id, set: { name: "张美玲" } }).returning();

  const [child3a] = await db.insert(children).values({
    id: "test-child-tangtang",
    userId: user3.id,
    name: "张唐唐",
    nickname: "唐唐",
    gender: "girl",
    birthDate: yearsAgo(9),
    avatarEmoji: "🌻",
    notes: "三年级，成绩中等，钢琴学了两年，最近不想练了",
  }).onConflictDoUpdate({ target: children.id, set: { nickname: "唐唐" } }).returning();

  const [child3b] = await db.insert(children).values({
    id: "test-child-duoduo",
    userId: user3.id,
    name: "张多多",
    nickname: "多多",
    gender: "boy",
    birthDate: yearsAgo(3),
    avatarEmoji: "🐣",
    notes: "刚上幼儿园，分离焦虑，总爱黏着姐姐",
  }).onConflictDoUpdate({ target: children.id, set: { nickname: "多多" } }).returning();

  await db.insert(growthRecords).values([
    {
      id: "rec-tangtang-1",
      childId: child3a.id, userId: user3.id,
      category: "emotion", title: "唐唐跟我说「你生了弟弟就不爱我了」",
      content: "今天唐唐把自己关在房间里，不吃晚饭。我进去问，她哭着说「你只知道照顾多多，你不爱我了」。我抱着她说了很久，但我心里也很难过——她说的不是完全没有道理。",
      mood: "worried", recordedAt: daysAgo(4),
    },
    {
      id: "rec-duoduo-1",
      childId: child3b.id, userId: user3.id,
      category: "social", title: "第一天幼儿园没哭",
      content: "多多上幼儿园第8天，今天送他进去他没有哭。只是在门口回头看了我一眼，然后跟着老师进去了。我在门口站了很久，才回家。",
      mood: "calm", recordedAt: daysAgo(6),
    },
  ]).onConflictDoNothing();

  await db.insert(heartLetters).values([
    {
      id: "hl-tangtang-1",
      childId: child3a.id, userId: user3.id,
      emotion: "apology",
      title: "对不起，这两年我亏欠了你",
      content: "唐唐，多多出生之后，妈妈有很长一段时间真的顾不上你。我知道你懂事，你没有闹，但妈妈知道你委屈。\n\n你问我「你是不是更爱弟弟」，我说不是。但你又问「那为什么你总是陪着他」。我没有答案。\n\n只是想让你知道：你来了九年，是妈妈人生里最好的九年。弟弟没有办法取代你在我心里的位置。",
      isTimeCapsule: false, revealAtAge: null,
    },
    {
      id: "hl-duoduo-1",
      childId: child3b.id, userId: user3.id,
      emotion: "joy",
      title: "你笑起来的样子",
      content: "多多，你笑起来的时候两边各有一个小酒窝。你知道吗，你爸爸也是这样的。\n\n每次你笑，我都想把这个时刻抓住，一直留着。",
      isTimeCapsule: true, revealAtAge: "成年后随时",
    },
  ]).onConflictDoNothing();

  console.log("✓ 家庭3 完成：张美玲 × 唐唐（9岁）+ 多多（3岁）（多孩家庭）");

  // ════════════════════════════════════════════════════
  // 家庭 4：刘奶奶（刘桂芳） — 祖父母代养，孙子5岁
  // 场景：隔代养育，和儿子媳妇观念冲突
  // ════════════════════════════════════════════════════
  const [user4] = await db.insert(users).values({
    id: "test-user-liuguifang",
    name: "刘桂芳",
    email: "liuguifang@test.yujian.app",
    avatarUrl: null,
  }).onConflictDoUpdate({ target: users.id, set: { name: "刘桂芳" } }).returning();

  const [child4] = await db.insert(children).values({
    id: "test-child-xiaohu",
    userId: user4.id,
    name: "陈小虎",
    nickname: "小虎",
    gender: "boy",
    birthDate: yearsAgo(5),
    avatarEmoji: "🐯",
    notes: "爸妈在深圳打工，跟着奶奶住。幼儿园中班，很调皮但很聪明",
  }).onConflictDoUpdate({ target: children.id, set: { nickname: "小虎" } }).returning();

  await db.insert(growthRecords).values([
    {
      id: "rec-xiaohu-1",
      childId: child4.id, userId: user4.id,
      category: "language", title: "小虎会认字了",
      content: "今天小虎指着路边的牌子，认出了「出口」两个字。我说你怎么认识，他说幼儿园老师教的。我打电话跟他爸说，他爸说「妈你别激动」，但我就是激动。我的孙子不是普通的孩子。",
      mood: "happy", recordedAt: daysAgo(2),
    },
    {
      id: "rec-xiaohu-2",
      childId: child4.id, userId: user4.id,
      category: "emotion", title: "视频里喊妈妈",
      content: "今晚跟他爸妈视频，他们问小虎最近怎么样，小虎说「妈妈我想你」。我在旁边假装没听见，把头扭过去了。\n\n孩子需要妈妈。我再能干，也不是他妈妈。",
      mood: "worried", recordedAt: daysAgo(9),
    },
  ]).onConflictDoNothing();

  await db.insert(heartLetters).values([
    {
      id: "hl-xiaohu-1",
      childId: child4.id, userId: user4.id,
      emotion: "wish",
      title: "奶奶希望你长大后……",
      content: "小虎，奶奶不求你将来多有出息，不求你挣多少钱，不求你让奶奶住大房子。\n\n奶奶就只希望你健健康康，长大了，还记得回来看奶奶一眼。",
      isTimeCapsule: true, revealAtAge: "18岁",
    },
  ]).onConflictDoNothing();

  console.log("✓ 家庭4 完成：刘桂芳（奶奶代养）× 小虎（5岁，留守儿童）");

  // ════════════════════════════════════════════════════
  // 家庭 5：林晓彤 — 妈妈，女儿11岁，青春期前期
  // 场景：即将进入青春期，亲子关系开始疏远
  // ════════════════════════════════════════════════════
  const [user5] = await db.insert(users).values({
    id: "test-user-linxiaotong",
    name: "林晓彤",
    email: "linxiaotong@test.yujian.app",
    avatarUrl: null,
  }).onConflictDoUpdate({ target: users.id, set: { name: "林晓彤" } }).returning();

  const [child5] = await db.insert(children).values({
    id: "test-child-yiyi",
    userId: user5.id,
    name: "林依依",
    nickname: "依依",
    gender: "girl",
    birthDate: yearsAgo(11),
    avatarEmoji: "🌙",
    notes: "五年级，成绩很好，最近开始有小秘密，不太愿意跟妈妈说话",
  }).onConflictDoUpdate({ target: children.id, set: { nickname: "依依" } }).returning();

  await db.insert(growthRecords).values([
    {
      id: "rec-yiyi-1",
      childId: child5.id, userId: user5.id,
      category: "social", title: "有喜欢的男生了吗？",
      content: "依依最近放学回来经常对着手机笑。我问她在跟谁聊天，她说「同学」，然后把手机扣过来。我装作没在意，但心里很好奇，也有点紧张。\n\n她开始有自己的世界了。我不知道该高兴还是担心。",
      mood: "confused", recordedAt: daysAgo(8),
    },
    {
      id: "rec-yiyi-2",
      childId: child5.id, userId: user5.id,
      category: "emotion", title: "她说「你不懂我」",
      content: "因为她房间乱，我说了几句，她突然很大声说「你根本不懂我，你只会管我」然后把门关上了。\n\n我站在门口，不知道是该敲门，还是等她冷静。我选择了等。\n\n十一岁了，她好像突然不是我认识的那个小女孩了。",
      mood: "worried", recordedAt: daysAgo(3),
    },
  ]).onConflictDoNothing();

  await db.insert(heartLetters).values([
    {
      id: "hl-yiyi-1",
      childId: child5.id, userId: user5.id,
      emotion: "proud",
      title: "你长成了一个有自己想法的人，这很好",
      content: "依依，当你说「你不懂我」的时候，我很难过，但我也有一点点高兴。\n\n因为你有了自己的想法，你知道什么是你自己的世界，你不再什么都告诉我——这说明你长大了。\n\n妈妈也需要时间学习，怎么做一个能配得上你信任的妈妈。",
      isTimeCapsule: false, revealAtAge: null,
    },
  ]).onConflictDoNothing();

  console.log("✓ 家庭5 完成：林晓彤 × 依依（11岁，青春期前期）");

  // ════════════════════════════════════════════════════
  // 家庭 6：赵天明 × 孙倩 — 双职工家庭，儿子7岁有学习困难
  // 场景：孩子被怀疑有ADHD倾向，父母观念不一致
  // ════════════════════════════════════════════════════
  const [user6] = await db.insert(users).values({
    id: "test-user-zhaotianming",
    name: "赵天明",
    email: "zhaotianming@test.yujian.app",
    avatarUrl: null,
  }).onConflictDoUpdate({ target: users.id, set: { name: "赵天明" } }).returning();

  const [child6] = await db.insert(children).values({
    id: "test-child-chengcheng",
    userId: user6.id,
    name: "赵成成",
    nickname: "成成",
    gender: "boy",
    birthDate: yearsAgo(7),
    avatarEmoji: "⚡",
    notes: "二年级，老师多次反映上课注意力不集中，医院初步评估有ADHD倾向，父母意见不一",
  }).onConflictDoUpdate({ target: children.id, set: { nickname: "成成" } }).returning();

  await db.insert(growthRecords).values([
    {
      id: "rec-chengcheng-1",
      childId: child6.id, userId: user6.id,
      category: "behavior", title: "老师第三次打电话来了",
      content: "今天班主任又打电话，说成成上课站起来在教室里走，影响了其他同学。我和他妈妈意见不一样——她觉得先别给孩子贴标签，我觉得该去做个正式评估。\n\n我不知道谁对。但我知道成成不是坏孩子，他只是停不下来。",
      mood: "confused", recordedAt: daysAgo(1),
    },
    {
      id: "rec-chengcheng-2",
      childId: child6.id, userId: user6.id,
      category: "behavior", title: "他用乐高拼了一个航天飞机",
      content: "成成用乐高拼了一个航天飞机，说是自己设计的，不是按说明书来的。拼了三个多小时，一直没动。\n\n就是这个孩子，老师说他注意力有问题。我不知道该怎么理解这件事。",
      mood: "happy", recordedAt: daysAgo(12),
    },
  ]).onConflictDoNothing();

  await db.insert(heartLetters).values([
    {
      id: "hl-chengcheng-1",
      childId: child6.id, userId: user6.id,
      emotion: "joy",
      title: "你的大脑是不同的，不是坏掉的",
      content: "成成，爸爸最近查了很多资料，才知道像你这样的孩子，大脑的运转方式跟别人不一样，不是「坏掉了」，而是「不同」。\n\n那个用三个小时拼出航天飞机的你，跟那个在课堂上停不下来的你，是同一个人。\n\n爸爸会一直在，帮你找到适合你的方式。",
      isTimeCapsule: true, revealAtAge: "15岁",
    },
  ]).onConflictDoNothing();

  console.log("✓ 家庭6 完成：赵天明 × 成成（7岁，疑似ADHD）");

  console.log("\n全部测试数据注入完成！共 6 个家庭场景：");
  console.log("  1. 陈思雨 × 诺诺（18个月，早产宝宝，新手父母焦虑）");
  console.log("  2. 王建国 × 小宝（6岁，单亲爸爸独自带娃）");
  console.log("  3. 张美玲 × 唐唐+多多（多孩家庭，老大情绪管理）");
  console.log("  4. 刘桂芳（奶奶）× 小虎（5岁，祖父母代养）");
  console.log("  5. 林晓彤 × 依依（11岁，青春期前期疏远）");
  console.log("  6. 赵天明 × 成成（7岁，ADHD倾向，父母分歧）");

  process.exit(0);
}

main().catch((err) => {
  console.error("种子数据注入失败：", err);
  process.exit(1);
});
