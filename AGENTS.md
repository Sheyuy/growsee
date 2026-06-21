# Growsee 开发指南

育见 — 温柔且科学的儿童成长记录与非焦虑AI顾问。

## 1. 技术栈

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Bun (包管理器 + 本地脚本运行)
- shadcn/ui, lucide-react, framer-motion
- Drizzle ORM (PostgreSQL)
- MiniMax AI API

## 2. 快速开始

```bash
bun install
bun dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 3. 数据库

```bash
bun run db:generate    # 生成迁移文件
bun run db:migrate     # 执行迁移
bun run db:push        # 推送 schema 变更
bun run db:studio      # 打开 Drizzle Studio
```

## 4. 项目结构

```
src/
  app/
    api/                # API 路由
      ai/chat/route.ts
      children/route.ts
      records/route.ts
      milestones/route.ts
      heart-letters/route.ts
      mood/route.ts
      insights/route.ts
      upload/photo/route.ts
      user/profile/route.ts
      home/summary/route.ts
      mcp/route.ts
    layout.tsx          # 根布局
    page.tsx            # 首页
    globals.css         # 全局样式
    ai-companion/page.tsx
    record/page.tsx
    heart-letters/page.tsx
    mood/page.tsx
    profile/page.tsx
    scientific-insight/page.tsx
    timeline-milestones/page.tsx
  components/
    screens/            # 页面级组件
    ui/                 # shadcn/ui 组件
    nav/                # 导航组件
    user-profile/       # 用户相关组件
  lib/
    db/                 # 数据库层
    api/                # API 封装
    auth/               # 认证相关
    mcp/                # MCP 服务器
  utils/
    utils.ts            # 工具函数
```

## 5. 认证

微信小程序登录。前端通过 wx.login 获取 code，后端调用微信 API 换取 openid，生成 JWT session。

## 6. AI

服务端通过 MiniMax API 提供 AI 对话、育儿建议生成、自动归档等功能。

**AI 调用仅允许在 API 路由中，严禁在客户端组件中调用。**

## 7. 文件上传

照片上传至腾讯云 COS。前端获取预签名 URL 后直传。

## 8. 环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串 |
| `MINIMAX_API_KEY` | 是 | MiniMax API Key |
| `MINIMAX_GROUP_ID` | 是 | MiniMax Group ID |
| `TENCENT_COS_SECRET_ID` | 是 | 腾讯云 COS SecretId |
| `TENCENT_COS_SECRET_KEY` | 是 | 腾讯云 COS SecretKey |
| `TENCENT_COS_BUCKET` | 是 | COS Bucket 名称 |
| `TENCENT_COS_REGION` | 是 | COS 区域 |
| `WECHAT_MINIAPP_ID` | 是 | 微信小程序 AppID |
| `WECHAT_MINIAPP_SECRET` | 是 | 微信小程序 AppSecret |
| `JWT_SECRET` | 是 | JWT 签名密钥 |
| `CRON_SECRET` | 否 | Vercel Cron 密钥 |

复制 `.env.example` 到 `.env` 进行本地配置。

## 9. UI 组件

shadcn/ui 已初始化。可用组件：

| 组件 | 导入 |
|---|---|
| Button | `import { Button } from "@/components/ui/button"` |
| Card | `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"` |
| Dialog | `import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"` |
| Input | `import { Input } from "@/components/ui/input"` |
| Label | `import { Label } from "@/components/ui/label"` |
| Select | `import { Select, SelectContent, SelectItem } from "@/components/ui/select"` |
| Sheet | `import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"` |
| Tabs | `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"` |
| Textarea | `import { Textarea } from "@/components/ui/textarea"` |
| Sonner (toast) | `import { Toaster } from "@/components/ui/sonner"` |

添加更多：`bunx shadcn@latest add <component>`。图标：`lucide-react`。动画：`framer-motion`。

## 10. 编码规范

### 组件封装（强制）

- 每个文件只导出一个组件。
- `page.tsx` 保持精简，只导入顶层组件。
- 按功能分组，不扁平化。

### 文件大小限制

| 文件类型 | 软限制 | 硬限制 |
|---|---|---|
| Page component | 30 行 | 50 行 |
| Feature component | 150 行 | 250 行 |
| Utility / helper | 80 行 | 150 行 |
| API route handler | 60 行 | 100 行 |

### 命名规范

- 组件文件：`kebab-case.tsx`
- 组件导出：`PascalCase`
- 每个功能文件夹通过 `index.tsx` 暴露入口
- API 辅助函数：`camelCase`

### 状态和数据

- 不在 `page.tsx` 中直接获取数据。
- 使用 Zustand 存储全局状态，放在 `src/stores/`。
- 所有 API 调用逻辑放在 `src/lib/api/`，不在组件中直接调用 `fetch`。

### 导入规范

- 使用 `@/` 路径别名，不用相对路径 `../../`。
- 从 `@/components/ui/` 导入 UI 组件，不直接导入 shadcn 源路径。

## 11. 项目规则

- 所有命令使用 Bun。
- 保持精简，只在有具体需求时增加复杂度。
- AI 调用仅限 `src/app/api/` 路由中 — 严禁在客户端组件、hooks 或 `src/lib/api/` 中调用。
- 维护本地 `users` 表，每个应用必须持久化认证用户信息。
- 提交前运行 `bun run lint` 和 `bun run build`。

## 12. 目标

快速启动，保持灵活，只在有具体产品需求时增加复杂度。
