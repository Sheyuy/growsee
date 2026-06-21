# Growsee 部署与运行指南

> 本文档面向 Demo 阶段，目标是快速在本地或服务器上跑起来，对外展示。

---

## 快速启动 (3 步)

### 1. 准备环境变量

复制模板并填写：

```bash
cp .env.example .env
```

编辑 `.env`，填写以下必填项：

| 变量 | 说明 | 获取方式 |
|------|------|----------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | 见下方「数据库方案」 |
| `MINIMAX_API_KEY` | MiniMax AI API 密钥 | 1Password → Clawbot/LLM_MiniMax_Official |
| `MINIMAX_GROUP_ID` | MiniMax 组织 ID | 同上 |
| `JWT_SECRET` | JWT 签名密钥 | 运行 `openssl rand -hex 32` |

**其他项保持默认即可**（Demo 模式已启用，无需微信小程序）。

---

### 2. 启动数据库

选择以下任意一种方案：

#### A. 本地 Docker (推荐，最快)

```bash
docker run -d --name growsee-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=growsee \
  -p 5432:5432 \
  postgres:16
```

对应 `.env`：
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/growsee
```

#### B. 免费托管 (Supabase / Neon)

注册 Supabase (supabase.com) 或 Neon (neon.tech)，创建项目，复制连接字符串：

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

> Supabase 免费 500MB，Neon 免费 500MB，都够用。

#### C. 自己的服务器 (tc-ts)

在服务器上安装 PostgreSQL，创建数据库和用户，然后：

```
DATABASE_URL=postgresql://growsee:your_password@your_server_ip:5432/growsee
```

---

### 3. 安装依赖并启动

```bash
# 安装依赖
npm install

# 运行数据库迁移
npm run db:migrate

# 填充演示数据（可选，用于展示）
npx tsx scripts/seed-test-data.ts

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 即可。

---

## 对外展示方案

### 方案 1: 本地 + 内网穿透 (最快，5 分钟)

适合临时演示，不需要服务器。

```bash
# 1. 本地启动
npm run dev

# 2. 另开终端，安装 ngrok
npm install -g ngrok

# 3. 注册 ngrok (免费)，获取 authtoken
ngrok config add-authtoken <your_token>

# 4. 暴露本地服务
ngrok http 3000
```

ngrok 会给你一个 `https://xxxx.ngrok-free.app` 的 URL，发给任何人都可以访问。

**优点**: 零成本，5 分钟搞定  
**缺点**: URL 每次重启会变，免费版有流量限制

---

### 方案 2: 部署到服务器 (tc-ts)

适合长期展示，需要稳定访问。

#### 前置条件
- 服务器已安装 Node.js 18+ 和 PostgreSQL
- 服务器可访问互联网

#### 部署步骤

```bash
# 在服务器上克隆代码
git clone https://github.com/Sheyuy/growsee.git
cd growsee

# 安装依赖
npm install

# 复制环境变量并编辑
cp .env.example .env
# nano .env  # 填写数据库连接和密钥

# 构建
npm run build

# 启动 (前台)
npm run start

# 或者用 PM2 后台运行
npm install -g pm2
pm2 start npm --name growsee -- run start
pm2 save
pm2 startup
```

#### 用 Nginx 反代 (可选)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### 方案 3: Vercel 部署 (最省心)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel
```

**数据库问题**: Vercel 是 Serverless，需要把数据库放在外部：
- Supabase (免费 500MB)
- Neon (免费 500MB)
- 自己的服务器 PostgreSQL

在 Vercel Dashboard 中设置环境变量，然后部署即可。

**优点**: 自动 HTTPS，全球 CDN，零运维  
**缺点**: 需要外部数据库，免费额度有限

---

## 数据持久化

### 本地上传文件

Demo 阶段图片保存在 `public/uploads/` 下，已添加到 `.gitignore` 不会被提交。

如需备份：
```bash
tar czf uploads-backup.tar.gz public/uploads/
```

### 数据库备份

```bash
# 导出
pg_dump $DATABASE_URL > growsee-backup.sql

# 导入
psql $DATABASE_URL < growsee-backup.sql
```

---

## 环境变量参考

```bash
# 数据库 (必填)
DATABASE_URL=postgresql://postgres:password@localhost:5432/growsee

# AI (必填)
MINIMAX_API_KEY=your_minimax_key
MINIMAX_GROUP_ID=your_minimax_group_id

# 认证 (必填)
JWT_SECRET=your_64_char_hex_string

# 存储 (默认本地，无需修改)
STORAGE_TYPE=local
UPLOAD_DIR=public/uploads
UPLOAD_BASE_URL=/uploads

# Demo 模式 (默认开启，无需修改)
NEXT_PUBLIC_DEMO_MODE=true

# 微信小程序 (可选，正式环境需要)
WECHAT_MINIAPP_ID=your_wechat_app_id
WECHAT_MINIAPP_SECRET=your_wechat_app_secret
```

---

## 常见问题

**Q: 没有 MiniMax API Key 怎么办？**  
A: 从 1Password 获取，或先用假值启动，AI 功能会报错但不影响其他功能。

**Q: 不想装 PostgreSQL 怎么办？**  
A: 用 Supabase (免费) 或 Neon (免费)，注册 2 分钟，复制连接字符串即可。

**Q: 图片上传后找不到？**  
A: 检查 `public/uploads/` 目录是否存在，Next.js 开发服务器会自动暴露 `public/` 下的文件。

**Q: 如何清空演示数据？**  
A: 删除数据库重新迁移：`psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"` 然后重新运行 `npm run db:migrate`。

**Q: 如何切换到真实微信登录？**  
A: 注册微信小程序，获取 AppID 和 Secret，填入 `.env`，然后关闭 Demo 模式：`NEXT_PUBLIC_DEMO_MODE=false`。

