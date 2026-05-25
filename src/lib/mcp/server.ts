import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getChildrenByUser } from "@/lib/db/queries/children";
import { getRecordsByChild } from "@/lib/db/queries/growth-records";
import { getMilestonesByChild } from "@/lib/db/queries/milestones";

export function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: "yujian-app", version: "1.0.0" });

  // Tool 1: 列出孩子档案
  server.registerTool("list_children", {
    description: "获取当前用户的所有孩子档案列表，包含姓名、生日、年龄信息。",
  }, async () => {
    const children = await getChildrenByUser(userId);
    return { content: [{ type: "text", text: JSON.stringify(children, null, 2) }] };
  });

  // Tool 2: 获取成长记录
  server.registerTool("get_growth_records", {
    description: "获取某个孩子的成长记录列表，按时间倒序。",
    inputSchema: {
      childId: z.string().describe("孩子的 ID"),
    },
  }, async ({ childId }) => {
    const records = await getRecordsByChild(childId, userId);
    return { content: [{ type: "text", text: JSON.stringify(records, null, 2) }] };
  });

  // Tool 3: 获取里程碑
  server.registerTool("get_milestones", {
    description: "获取某个孩子的所有里程碑，按时间顺序排列。",
    inputSchema: {
      childId: z.string().describe("孩子的 ID"),
    },
  }, async ({ childId }) => {
    const milestones = await getMilestonesByChild(childId, userId);
    return { content: [{ type: "text", text: JSON.stringify(milestones, null, 2) }] };
  });

  // Tool 4: 成长摘要
  server.registerTool("get_child_summary", {
    description: "获取某个孩子的完整概况，包括档案、最近10条记录、所有里程碑。",
    inputSchema: {
      childId: z.string().describe("孩子的 ID"),
    },
  }, async ({ childId }) => {
    const [children, records, milestones] = await Promise.all([
      getChildrenByUser(userId),
      getRecordsByChild(childId, userId),
      getMilestonesByChild(childId, userId),
    ]);
    const child = children.find((c) => c.id === childId);
    if (!child) return { isError: true, content: [{ type: "text", text: "孩子档案不存在" }] };
    const summary = { child, recentRecords: records.slice(0, 10), milestones };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  });

  // Tool 5: 育儿建议摘要
  server.registerTool("get_parenting_context", {
    description: "为 AI 顾问提供当前用户的所有孩子的基础信息，用于个性化育儿建议。",
  }, async () => {
    const children = await getChildrenByUser(userId);
    const context = await Promise.all(
      children.map(async (child) => {
        const records = await getRecordsByChild(child.id, userId);
        return { child, recentRecordCount: records.length, latestRecord: records[0] ?? null };
      })
    );
    return { content: [{ type: "text", text: JSON.stringify(context, null, 2) }] };
  });

  return server;
}
