# PromptMinder 部署文档

> 本项目基于 aircrushin/promptMinder 修改，替换原始智谱 AI 为 Minimax Anthropic 兼容 API，部署于 Vercel。

---

## 技术栈

### 前端
| 技术 | 用途 |
|------|------|
| Next.js 16 + React 19 | 框架 |
| Tailwind CSS + Shadcn UI | 样式组件库 |
| TypeScript | 类型检查 |

### 后端 & 数据库
| 技术 | 用途 |
|------|------|
| Neon PostgreSQL | Serverless 数据库 |
| Supabase | 文件存储（附件、头像） |
| Drizzle ORM | 数据库 ORM |

### 认证 & 权限
| 技术 | 用途 |
|------|------|
| Clerk | 用户认证、登录注册、团队权限 |

### AI 服务
| 技术 | 用途 |
|------|------|
| Minimax（Anthropic 兼容 API） | 提示词生成、元数据生成、对话导入 |
| Anthropic SDK | AI 模型调用 |

### 部署
| 技术 | 用途 |
|------|------|
| Vercel | 前端部署、自动构建、CDN |
| GitHub | 代码托管、触发自动部署 |

---

## 目录结构

```
promptMinder/
├── app/                    # Next.js App Router 页面与 API
│   ├── api/               # API 路由
│   │   ├── agent/        # Agent 对话 API
│   │   ├── chat/         # 聊天 API
│   │   ├── generate/     # 提示词生成 API（AI）
│   │   ├── playground/    # Playground API
│   │   └── prompts/      # 提示词 CRUD API
│   ├── prompts/           # 提示词管理页面
│   ├── teams/             # 团队管理页面
│   └── ...
├── components/             # React 组件
├── lib/                    # 工具库、数据库、认证
├── drizzle/                # 数据库迁移脚本
├── messages/               # 国际化文案
└── packages/               # CLI 子包
```

---

## 部署流程

### 一、准备工作

#### 1. 注册所需服务账号

| 服务 | 注册地址 | 套餐 |
|------|----------|------|
| Neon PostgreSQL | https://neon.tech | 免费（0.5GB 存储） |
| Supabase | https://supabase.com | 免费（1GB 存储） |
| Clerk | https://clerk.com | 免费（10,000 MAU） |
| Minimax | https://www.minimaxi.com | 按量计费 |

#### 2. 获取各服务凭证

**Neon（数据库）**
- 创建 Project → Settings → Connection Strings
- 复制完整连接字符串，格式：`postgresql://user:pass@host/db?sslmode=require`

**Supabase（存储）**
- 创建 Project → Settings → API
- 记录三个值：SUPABASE_URL、anon key、service_role key

**Clerk（认证）**
- 创建 Application
- 记录 Publishable Key（pk_）和 Secret Key（sk_）

**Minimax（AI）**
- 获取 API Key 和 API Endpoint
- 项目中使用 `https://api.minimaxi.com/anthropic/v1` 作为 baseURL

#### 3. Fork 源码仓库

```bash
# 访问 https://github.com/aircrushin/promptMinder
# 点 Fork，选择 Private（私有）
```

### 二、本地修改（如需要）

如需替换默认 AI Provider，需修改以下文件：

| 文件 | 修改内容 |
|------|----------|
| `app/api/generate/route.js` | API URL + SDK 切换 |
| `app/api/generate/meta/route.js` | API URL + SDK 切换 |
| `app/api/chat/route.js` | 默认 API Key 变量名 |
| `lib/constants.js` | 默认 Base URL |
| `lib/conversation-import.js` | AI 调用方式 |
| `components/chat/ChatTest.js` | 前端默认 Provider |
| `.env.example` | 环境变量模板 |

```bash
git clone https://github.com/YOUR_USERNAME/promptMinder.git
cd promptMinder
# 修改代码...
git add -A && git commit -m "your changes"
git push origin main
```

### 三、Vercel 部署

#### 方式一：CLI（推荐）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 进入项目目录并链接
cd promptMinder
vercel link

# 4. 添加环境变量
vercel env add DATABASE_URL production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_BASE_URL production

# 5. 部署到生产环境
vercel --prod
```

#### 方式二：浏览器导入

1. 访问 https://vercel.com/new
2. Import Git Repository → 选择 fork 的仓库
3. Framework 选 Next.js
4. 添加所有环境变量（name | value）
5. Deploy

### 四、必需环境变量清单

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接字符串 | `postgresql://...neon.tech/neondb?sslmode=require` |
| `SUPABASE_URL` | Supabase 项目 URL | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon 密钥 | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 密钥 | `eyJ...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 前端公钥 | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk 后端密钥 | `sk_test_...` |
| `ANTHROPIC_API_KEY` | Minimax API Key | `sk-cp-...` |
| `ANTHROPIC_BASE_URL` | Anthropic 兼容端点 | `https://api.minimaxi.com/anthropic/v1` |

### 五、Clerk 回调域名配置

部署完成后需在 Clerk 后台配置允许的域名：

1. https://clerk.com → 你的 Application
2. User Management → Domains
3. 添加以下域名：
   - `https://YOUR_APP.vercel.app`（生产域名）
   - `http://localhost:3000`（本地开发）

### 六、自动部署配置

Vercel 与 GitHub 绑定后，每次 push 到 main 分支会自动触发部署。

```bash
# 在已链接的项目中连接 GitHub
vercel git connect https://github.com/YOUR_USERNAME/promptMinder.git
```

或在 Vercel Dashboard：Project → Settings → Git → Connect Git Repository

### 七、本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/YOUR_USERNAME/promptMinder.git
cd promptMinder

# 2. 安装依赖
pnpm install

# 3. 复制环境变量
cp .env.example .env.local
# 手动填写 .env.local 中的所有变量

# 4. 数据库迁移
pnpm db:migrate

# 5. 启动开发服务器
pnpm dev
```

---

## 常用开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` | 运行测试 |
| `pnpm db:migrate` | 执行数据库迁移 |
| `pnpm db:push` | 推送 Schema 到数据库 |
| `pnpm db:studio` | 打开 Drizzle Studio |

---

## 数据流向

```
用户浏览器
    ↓ HTTPS
Vercel CDN
    ↓
Next.js App (API Routes)
    ↓
Neon PostgreSQL (数据存储)
Supabase (文件存储)
Clerk (用户认证)
Minimax API (AI 生成)
    ↓
返回用户
```

---

## 注意事项

1. **API Key 安全**：所有 Key 只放在 Vercel 环境变量中，不要提交到 Git
2. **Clerk 域名**：上线前必须在 Clerk 后台添加生产域名，否则认证失效
3. **数据库迁移**：首次部署后需执行 `pnpm db:migrate` 初始化数据库表
4. **Supabase Storage**：需在 Supabase 后台创建 `prompts` bucket 并设为 Public

---

## 踩坑记录

- [x] 智谱 AI → Minimax Anthropic 兼容 API：需同时改 baseURL 和 SDK（原始用 fetch，改用 @anthropic-ai/sdk）
- [x] Vercel 构建失败：conversation-import.js 语法错误，多余的 try/catch 代码块
- [x] GitHub Fork 权限：PAT 需要勾选 `repo` scope 才能 Fork 仓库
- [x] Vercel CLI 非交互：使用 `echo "" | vercel link --yes` 跳过交互提示
