# Growsee

**Growsee**（育见）— 温柔且科学的儿童成长记录与非焦虑AI顾问，在您第一次为人父母的马拉松中，予您不评判、不拆解、恒温守护的安心与依靠。

## 功能

- 📋 多孩家庭成长记录 — 行为、情绪、语言、身体、社交五维记录
- 🤖 AI 育儿顾问 — 基于关键词匹配的预设回复，适合演示
- 💌 心里话/时间胶囊 — 写给孩子的悄悄话，可设为未来某年打开
- 📊 五维雷达图 — 可视化关注重点分布
- 🎨 个性化育儿洞察 — 基于家庭情况生成科学育儿文章（演示数据）
- 😊 父母情绪打卡 — 关注父母自身心理健康

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- 纯前端模式（无后端、无数据库、无小程序）
- 数据保存在浏览器 LocalStorage
- 演示数据从 JSON 文件加载

## 开发

```bash
bun install
bun dev
```

## 构建静态站点

```bash
bun run build
# 输出到 dist/ 目录
```

## 部署到 GitHub Pages

### 方案 1: 直接部署 dist 目录

1. 构建项目：`bun run build`
2. 进入 `dist` 目录，确认包含所有 HTML 文件和 `data/` 目录
3. 将 `dist` 内容推送到 GitHub 仓库的 `gh-pages` 分支，或使用 GitHub Actions 自动部署

### 方案 2: GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - uses: JamesIves/github-pages-deploy-action@v4
        with:
          branch: gh-pages
          folder: dist
```

然后在仓库 Settings → Pages → Build and deployment → Source 选择 `Deploy from a branch`，选择 `gh-pages` 分支。

### 方案 3: 本地预览

```bash
# 安装 http-server
npx http-server dist -p 3000
# 打开 http://localhost:3000
```

> ⚠️ 注意：直接打开 HTML 文件不会工作（因为 Next.js 路由需要服务器）。请使用 `http-server` 或 `python -m http.server` 等静态服务器。

## 项目结构

```
src/
  app/                    # Next.js 页面路由
  components/             # UI 组件
  hooks/                  # React hooks
  types/                  # 类型定义
  lib/demo/               # 模拟数据层 + AI 引擎
public/data/              # 演示数据 JSON 文件
```

## 环境变量

无需配置！纯前端模式零依赖。

## 数据说明

- **演示数据**: 5 个 JSON 文件包含 2 个孩子、8 条成长记录、4 封悄悄话、5 条心情记录、4 个里程碑
- **用户数据**: 写入浏览器 LocalStorage，关闭页面不会丢失
- **重置数据**: 在「我的资料」页面点击「重置所有演示数据」

## 注意事项

- 这是一个纯前端演示版本，AI 回复基于关键词匹配而非真实 LLM API
- 图片上传在演示模式下使用 Base64 编码（保存在本地）
- 如需接入真实 AI 和数据库，请切换回完整后端版本

