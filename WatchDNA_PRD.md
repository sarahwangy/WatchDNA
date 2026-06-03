# Tubelens — Product Requirements Document (PRD)

> **YouTube 订阅与观看习惯分析 Dashboard**
> "You watch differently than you think you do."

---

## 文档信息

| 项 | 内容 |
|---|---|
| 项目代号 | Tubelens |
| 文档版本 | v1.0 |
| 文档作者 | sw (sarahwangdk@gmail.com) |
| 最后更新 | 2026-05-15 |
| 项目状态 | Planning |
| 目标上线 | V1: 4 周内 / V2: 8 周内 |

---

## 1. 产品概述

### 1.1 产品定位

Tubelens 是一个**个人 YouTube 数字足迹分析 Dashboard**，帮助用户基于 Google Takeout 导出的数据，深度分析自己的订阅偏好、观看习惯、搜索兴趣，并通过 AI 生成个性化洞察报告。

它属于作者的 **"Digital Footprint" 个人数字行为分析系列**的第二个产品（第一个为 Linknest 书签聚合 Dashboard）。

### 1.2 核心价值主张

| 用户痛点 | Tubelens 的解决方案 |
|---|---|
| "我订阅了几百个频道，但根本不知道自己在看什么" | 订阅 vs 实际观看的错位分析 |
| "我以为自己什么都看，其实只在重复看几个频道" | 观看集中度分析 + 长尾发现 |
| "我的兴趣是怎么变化的？" | 时间序列下的兴趣迁移可视化 |
| "我浪费了多少时间？什么时段最沉迷？" | 观看时段热力图 + 时长统计 |
| "我应该取消哪些订阅？" | "已订阅但从不观看"清单 + 推荐 |

### 1.3 一句话产品描述

> Tubelens 把你的 YouTube Takeout 数据变成一份会让你"哇"出声的自我认知报告——看清你订阅了什么，更看清你真正在看什么。

### 1.4 目标用户

**Primary**：
- 重度 YouTube 用户（每天观看 1+ 小时）
- 对自我量化（Quantified Self）感兴趣的人群
- 关注数字健康、想优化观看习惯的人

**Secondary（作品集场景）**：
- 招聘方 / 面试官（评估技术能力）
- 同行开发者（学习参考）

### 1.5 非目标用户

- 频道运营方（这是给观众的工具，不是给 Creator 的）
- 多用户 SaaS 客户（V1/V2 都聚焦个人使用）

---

## 2. 项目背景

### 2.1 为什么做这个项目

**个人动机**：作者本人是重度 YouTube 用户，希望通过数据自我审视：订阅是否合理？观看时间分布如何？兴趣是否在变化？

**作品集动机**：这是一个能同时展示**全栈开发、API 集成、数据处理、AI 应用、数据可视化**的综合项目，且与 Linknest 项目共享底层架构，能体现工程复用能力。

### 2.2 市场上的类似产品

| 产品 | 特点 | Tubelens 的差异化 |
|---|---|---|
| YouTube Wrapped（非官方） | 年度回顾型，浅层统计 | 深度交互、长期追踪、AI 洞察 |
| Stats for YouTube（扩展） | Creator 视角 | 纯观众视角 |
| Wakatime / Last.fm | 其他数字足迹工具 | YouTube 专属、Takeout 集成 |

**核心差异化**：**订阅 vs 真实观看的错位分析** + **多维度交叉可视化** + **AI 个性化洞察**。

---

## 3. 用户故事（User Stories）

### 3.1 核心用户旅程

```
首次使用：
  打开 Tubelens 官网
    ↓
  查看 Demo（预填数据）
    ↓
  「这个看起来挺有意思」
    ↓
  按引导去 Google Takeout 导出 YouTube 数据
    ↓
  返回 Tubelens 上传 zip
    ↓
  等待分析（含 AI 富化）
    ↓
  看到自己的 Dashboard，"哇" 出声
    ↓
  分享部分图表到社交媒体

回访：
  每 2 个月 Takeout 自动导出（V2 功能）
    ↓
  Dashboard 显示「新数据已同步」
    ↓
  查看本期变化报告
```

### 3.2 用户故事清单

**作为重度 YouTube 用户**，

- **US-01**：我希望能上传 Google Takeout 的 zip 文件，让系统自动解析我的数据，这样我不用手动整理
- **US-02**：我希望看到我订阅频道按国家、分类、语言的分布饼图，这样我能理解自己的兴趣广度
- **US-03**：我希望看到一张时间热力图（类似 GitHub 贡献图），知道自己什么时段、什么日子看得最多
- **US-04**：我希望有一张桑基图，清晰展示"我订阅了 X 个频道，但 80% 时间花在 Y 个频道上"，这是最让我吃惊的发现
- **US-05**：我希望知道哪些订阅频道我已经几个月没看了，给我一份「建议取消订阅」清单
- **US-06**：我希望搜索某个频道或关键词，看我在这上面花了多少时间、看过多少视频
- **US-07**：我希望 AI 帮我生成一份"个人 YouTube 画像"报告，用人类语言描述我的观看特征
- **US-08**：我希望看到我的搜索历史词云，发现自己的潜在兴趣
- **US-09**：我希望能看到我的兴趣随时间的变化（比如去年看科技，今年转向历史）
- **US-10**：我希望系统能推荐我"可能错过的好频道"——基于我画像的相似频道
- **US-11**（V2）：我希望连接 Google Drive 后系统自动同步新的 Takeout 数据，我不需要手动操作
- **US-12**：我希望我的数据隐私安全，Demo 用脱敏数据，真实数据只有我自己能看

### 3.3 用户故事优先级矩阵

| 故事 | 价值 | 难度 | 优先级 | 阶段 |
|---|---|---|---|---|
| US-01 上传 zip | 高 | 中 | P0 | V1 |
| US-02 订阅分布 | 高 | 低 | P0 | V1 |
| US-03 时间热力图 | 高 | 中 | P0 | V1 |
| US-04 订阅 vs 观看 | 极高 | 中 | P0 | V1 |
| US-05 建议取消订阅 | 中 | 低 | P1 | V1 |
| US-06 搜索 | 中 | 中 | P1 | V1 |
| US-07 AI 画像 | 高 | 中 | P0 | V1 |
| US-08 搜索词云 | 中 | 低 | P1 | V1 |
| US-09 兴趣变迁 | 高 | 高 | P1 | V1 |
| US-10 推荐发现 | 中 | 高 | P2 | V2 |
| US-11 自动同步 | 中 | 高 | P2 | V2 |
| US-12 隐私 | 高 | 中 | P0 | V1 |

---

## 4. 功能规格

### 4.1 整体功能模块

```
Tubelens
├── 数据导入模块
│   ├── V1: 手动上传 Takeout zip
│   └── V2: Drive API 自动同步
├── 数据处理模块
│   ├── ZIP 解压与文件识别
│   ├── subscriptions.csv 解析
│   ├── watch-history.html 解析
│   ├── search-history.html 解析
│   ├── comments.csv / liked-videos.csv 解析
│   └── playlists/*.csv 解析
├── 数据富化模块
│   ├── YouTube Data API 调用（频道元数据）
│   └── Claude API 调用（分类、洞察、推荐）
├── 存储模块
│   └── PostgreSQL via Prisma
├── 可视化模块
│   ├── 总览 Dashboard
│   ├── 订阅分析页
│   ├── 观看分析页
│   ├── 搜索与互动分析页
│   ├── AI 洞察报告页
│   └── 频道详情页
└── 设置模块
    ├── 账号管理
    ├── 数据导入历史
    └── 隐私设置
```

### 4.2 详细功能规格

#### 4.2.1 数据导入（F-IMPORT）

**V1 手动上传**

| 功能 | 描述 |
|---|---|
| F-IMPORT-01 | 用户在 `/import` 页面拖拽或选择 Takeout zip 文件 |
| F-IMPORT-02 | 前端校验：必须是 zip 格式，最大 2GB |
| F-IMPORT-03 | 上传到 Vercel Blob / S3，避免占用 Function 内存 |
| F-IMPORT-04 | 后端异步处理：解压、识别文件、入库 |
| F-IMPORT-05 | 处理进度实时反馈（WebSocket 或 Polling） |
| F-IMPORT-06 | 处理完成后跳转到 Dashboard |

**V2 自动同步**

| 功能 | 描述 |
|---|---|
| F-IMPORT-07 | OAuth 流程：连接 Google Drive 账号 |
| F-IMPORT-08 | 引导用户去 Takeout 设置「每 2 个月自动导出 YouTube → Drive」 |
| F-IMPORT-09 | Vercel Cron 每天检查一次 Drive 是否有新 Takeout zip |
| F-IMPORT-10 | 检测到新文件 → 触发异步处理任务 |
| F-IMPORT-11 | 处理完成后通过邮件/站内通知告知用户 |
| F-IMPORT-12 | 处理失败时记录错误日志，支持手动重试 |

#### 4.2.2 数据解析（F-PARSE）

| 功能 | 描述 |
|---|---|
| F-PARSE-01 | 解析 `subscriptions.csv`：Channel ID、Channel URL、Channel Title |
| F-PARSE-02 | 解析 `watch-history.html`：视频标题、URL、频道、观看时间 |
| F-PARSE-03 | 解析 `search-history.html`：搜索词、搜索时间 |
| F-PARSE-04 | 解析 `comments.csv`：评论内容、视频、时间 |
| F-PARSE-05 | 解析 `liked videos.csv`：视频列表、点赞时间 |
| F-PARSE-06 | 解析 `playlists/*.csv`：播放列表名、视频列表、添加时间 |
| F-PARSE-07 | 支持中英文混合内容，UTF-8 编码 |
| F-PARSE-08 | 容错：单个文件解析失败不影响其他文件 |

#### 4.2.3 数据富化（F-ENRICH）

| 功能 | 描述 |
|---|---|
| F-ENRICH-01 | 调用 YouTube Data API v3 `channels.list`，获取频道元数据 |
| F-ENRICH-02 | 富化字段：国家、订阅数、视频总数、总观看数、描述、缩略图、主题分类 |
| F-ENRICH-03 | 批量调用：每次最多 50 个频道 ID，节省配额 |
| F-ENRICH-04 | 配额管理：每天 10,000 units，超出后排队到次日 |
| F-ENRICH-05 | 缓存：频道元数据 7 天内不重复调用 |
| F-ENRICH-06 | 失败重试：3 次指数退避 |

#### 4.2.4 AI 分析（F-AI）

| 功能 | 描述 |
|---|---|
| F-AI-01 | **频道分类**：Claude 给每个频道分配 1 个主分类 + 3-5 个标签 |
| F-AI-02 | **观众画像**：基于全量数据生成 200 字左右的"你的 YouTube 画像"段落 |
| F-AI-03 | **兴趣变迁报告**：对比近 6 个月 vs 之前的观看分布，生成变化叙事 |
| F-AI-04 | **取消订阅建议**：识别"已订阅超过 6 个月、观看记录 = 0"的频道 |
| F-AI-05 | **相似频道推荐**：基于画像向量，从用户已订阅频道中聚类，推荐"被忽略的相似频道" |
| F-AI-06 | **本期总结**（V2）：每次新数据导入后生成"本期变化"报告 |
| F-AI-07 | 使用 Claude Haiku（成本优化），1000 频道 ≈ $1 |
| F-AI-08 | 结果缓存：相同内容不重复调用 |

#### 4.2.5 可视化（F-VIZ）

| 功能 | 描述 | 推荐图表库 |
|---|---|---|
| F-VIZ-01 | 总览 KPI 卡片：总订阅数、总观看数、总观看时长、活跃天数 | 自定义 |
| F-VIZ-02 | 订阅国家分布世界地图 | react-simple-maps |
| F-VIZ-03 | 订阅分类饼图 | Recharts PieChart |
| F-VIZ-04 | 订阅者规模直方图 | Recharts BarChart |
| F-VIZ-05 | 观看热力图（按日历日 × 时段） | nivo Calendar / 自定义 D3 |
| F-VIZ-06 | 订阅 vs 观看桑基图 | nivo Sankey |
| F-VIZ-07 | 时间序列：每月观看趋势 | Recharts AreaChart |
| F-VIZ-08 | 频道排行榜（观看时长 Top 20） | 自定义表格 |
| F-VIZ-09 | 搜索词云 | react-wordcloud |
| F-VIZ-10 | 兴趣变迁桑基图（分类 × 时间） | nivo Sankey |
| F-VIZ-11 | 频道详情页：单频道的时间分布、关联视频 | Recharts 组合 |

#### 4.2.6 设置与管理（F-SETTINGS）

| 功能 | 描述 |
|---|---|
| F-SETTINGS-01 | 账号管理：登录、登出、删除账号 |
| F-SETTINGS-02 | 数据导入历史：列出所有上传过的 zip、处理状态、时间 |
| F-SETTINGS-03 | 数据清空：一键删除所有自己的数据 |
| F-SETTINGS-04 | 隐私设置：是否允许在 Demo 中展示脱敏后的数据 |
| F-SETTINGS-05 | Drive 连接管理（V2）：连接/断开 Google Drive |
| F-SETTINGS-06 | 通知设置（V2）：邮件 / 站内 |

---

## 5. 数据模型

### 5.1 核心实体关系图

```
User (1) ─┬─ (N) TakeoutFile
          ├─ (N) Subscription ─── (N→1) Channel
          ├─ (N) WatchEvent ───── (N→1) Channel
          ├─ (N) SearchEvent
          ├─ (N) Comment ──────── (N→1) Video
          ├─ (N) LikedVideo ───── (N→1) Video
          ├─ (N) Playlist ────── (N) PlaylistItem
          └─ (1) Insight (AI 生成)

Channel (1) ─── (N) Video
```

### 5.2 Prisma Schema 草案

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  createdAt       DateTime @default(now())
  driveConnected  Boolean  @default(false)
  driveRefreshToken String?

  takeoutFiles    TakeoutFile[]
  subscriptions   Subscription[]
  watchEvents     WatchEvent[]
  searchEvents    SearchEvent[]
  comments        Comment[]
  likedVideos     LikedVideo[]
  playlists       Playlist[]
  insights        Insight[]
}

model TakeoutFile {
  id            String   @id @default(cuid())
  userId        String
  source        String   // 'manual_upload' | 'drive_sync'
  driveFileId   String?  // Drive 文件 ID（V2）
  fileName      String
  fileSize      BigInt
  uploadedAt    DateTime @default(now())
  processedAt   DateTime?
  status        String   // 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage  String?

  user          User     @relation(fields: [userId], references: [id])

  @@index([userId, status])
}

model Channel {
  id            String   @id  // YouTube Channel ID (UCxxxxxx)
  title         String
  description   String?
  country       String?  // ISO 3166 code
  customUrl     String?
  thumbnailUrl  String?
  subscriberCount BigInt?
  videoCount    Int?
  viewCount     BigInt?
  publishedAt   DateTime?
  topicCategories String[] // YouTube 主题 ID 列表
  enrichedAt    DateTime?

  // AI 富化字段
  aiCategory    String?   // 主分类
  aiTags        String[]  // 标签数组

  subscriptions Subscription[]
  watchEvents   WatchEvent[]
  videos        Video[]

  @@index([country])
  @@index([aiCategory])
}

model Subscription {
  id          String   @id @default(cuid())
  userId      String
  channelId   String
  subscribedAt DateTime?  // 来自 CSV（如果有）

  user        User     @relation(fields: [userId], references: [id])
  channel     Channel  @relation(fields: [channelId], references: [id])

  @@unique([userId, channelId])
  @@index([userId])
}

model Video {
  id            String   @id  // YouTube Video ID
  title         String
  channelId     String?
  durationSeconds Int?
  publishedAt   DateTime?
  thumbnailUrl  String?

  channel       Channel? @relation(fields: [channelId], references: [id])
  watchEvents   WatchEvent[]
  comments      Comment[]
  likedVideos   LikedVideo[]

  @@index([channelId])
}

model WatchEvent {
  id          String   @id @default(cuid())
  userId      String
  videoId     String?
  channelId   String?
  videoTitle  String   // 冗余，因为 video 可能已删除
  watchedAt   DateTime

  user        User     @relation(fields: [userId], references: [id])
  video       Video?   @relation(fields: [videoId], references: [id])
  channel     Channel? @relation(fields: [channelId], references: [id])

  @@index([userId, watchedAt])
  @@index([userId, channelId])
}

model SearchEvent {
  id          String   @id @default(cuid())
  userId      String
  query       String
  searchedAt  DateTime

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, searchedAt])
}

model Comment {
  id          String   @id @default(cuid())
  userId      String
  videoId     String?
  content     String
  commentedAt DateTime

  user        User     @relation(fields: [userId], references: [id])
  video       Video?   @relation(fields: [videoId], references: [id])

  @@index([userId])
}

model LikedVideo {
  id          String   @id @default(cuid())
  userId      String
  videoId     String
  likedAt     DateTime

  user        User     @relation(fields: [userId], references: [id])
  video       Video    @relation(fields: [videoId], references: [id])

  @@unique([userId, videoId])
}

model Playlist {
  id          String   @id @default(cuid())
  userId      String
  name        String
  createdAt   DateTime

  user        User     @relation(fields: [userId], references: [id])
  items       PlaylistItem[]
}

model PlaylistItem {
  id          String   @id @default(cuid())
  playlistId  String
  videoId     String?
  videoTitle  String
  addedAt     DateTime

  playlist    Playlist @relation(fields: [playlistId], references: [id])
}

model Insight {
  id          String   @id @default(cuid())
  userId      String
  type        String   // 'viewer_profile' | 'interest_shift' | 'unsubscribe_suggestion' | 'period_summary'
  content     String   // 长文本
  metadata    Json?    // 附加结构化数据
  generatedAt DateTime @default(now())
  validUntil  DateTime?

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, type])
}
```

### 5.3 关键设计决策

| 决策 | 理由 |
|---|---|
| Channel 单独成表 | 频道数据可被多用户共享，避免重复存储 + 重复 API 调用 |
| WatchEvent 不强制关联 Video | 视频可能已被删除，但观看记录仍要保留 |
| 用 `aiCategory` 而非 `category` | 标记这是 AI 生成的，可重新生成 |
| Insight 表存长文本 | AI 输出的报告作为快照保存，避免每次重新生成 |
| 索引覆盖 `(userId, watchedAt)` | 时间序列查询是热点 |

---

## 6. 技术架构

### 6.1 整体架构图

```
┌────────────────────────────────────────────────────┐
│                  用户浏览器                          │
│            (Next.js 前端 - Dashboard)                │
└──────────┬─────────────────────────────────────────┘
           │ HTTPS
           ▼
┌────────────────────────────────────────────────────┐
│                  Vercel 部署                         │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │       Next.js App Router (Frontend)          │  │
│  │   /                  → 首页 / Demo            │  │
│  │   /dashboard         → 总览                  │  │
│  │   /subscriptions     → 订阅分析              │  │
│  │   /watching          → 观看分析              │  │
│  │   /insights          → AI 洞察               │  │
│  │   /import            → 数据导入              │  │
│  │   /settings          → 设置                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │      Serverless Functions (Backend API)      │  │
│  │   POST /api/upload                            │  │
│  │   POST /api/process-takeout                   │  │
│  │   GET  /api/dashboard/overview                │  │
│  │   GET  /api/channels                          │  │
│  │   GET  /api/insights                          │  │
│  │   POST /api/insights/generate                 │  │
│  │   POST /api/enrich/channels                   │  │
│  │   GET  /api/cron/check-takeout (Cron, V2)     │  │
│  └──────────────────────────────────────────────┘  │
└────────┬────────────────┬─────────────────┬────────┘
         │                │                 │
         ▼                ▼                 ▼
┌─────────────────┐  ┌─────────────┐  ┌──────────────┐
│ Neon Postgres   │  │ Vercel Blob │  │ External APIs│
│ (Prisma ORM)    │  │ (zip 存储)  │  │              │
│                 │  │             │  │ • YouTube    │
│ • Users         │  │             │  │ • Claude     │
│ • Channels      │  │             │  │ • Drive (V2) │
│ • WatchEvents   │  │             │  │              │
│ • Insights      │  │             │  │              │
└─────────────────┘  └─────────────┘  └──────────────┘
                                          │
                              ┌───────────┴──────────┐
                              │ Inngest / QStash      │
                              │ (长任务异步队列, V2)  │
                              └──────────────────────┘
```

### 6.2 技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | Next.js 14 (App Router) | SSR + SSG + Serverless 一体，Vercel 原生支持 |
| UI 组件库 | shadcn/ui + Tailwind CSS | 美观、可定制、零运行时开销 |
| 图表库 | Recharts + nivo + react-simple-maps | Recharts 简单图表，nivo 高级图表，地图独立库 |
| 状态管理 | React Server Components + SWR | 服务端组件优先，客户端用 SWR 处理交互数据 |
| 数据库 | Neon Postgres | Serverless 友好、慷慨免费额度 |
| ORM | Prisma | 类型安全、Schema 即文档 |
| 文件存储 | Vercel Blob | 与 Vercel 深度集成，简单可靠 |
| 身份认证 | NextAuth (Google Provider) | 标准方案、与 Drive OAuth 复用 |
| 长任务队列 | Inngest（V2） | 免费额度友好、专为 Serverless 设计 |
| AI 服务 | Claude API (Haiku) | 成本低、质量好、Anthropic 官方 SDK |
| YouTube 数据 | YouTube Data API v3 | 唯一官方选项 |
| 部署 | Vercel | 与全栈架构契合 |
| 监控 | Vercel Analytics + Sentry | 性能 + 错误监控 |

### 6.3 关键技术挑战与方案

#### 挑战 1：Vercel Hobby 版函数超时（10 秒）

| 任务 | 预估耗时 | 解决方案 |
|---|---|---|
| 上传 zip（500MB） | 30-60s | 直传 Vercel Blob，不经过 Function |
| 解压 + 解析 | 10-30s | 拆成多个独立 API：上传完成后触发 `/api/process-takeout`，里面再拆 |
| YouTube API 富化（500 频道） | 60s | 分批调用：50 个一组，触发独立函数；或 Inngest 队列 |
| AI 分类（500 频道） | 5+ 分钟 | Inngest 队列异步处理，状态可查 |

**核心模式**：**上传 → 排队 → 异步处理 → 状态轮询**

#### 挑战 2：YouTube API 配额管理

- 每天 10,000 units 配额
- `channels.list` 每次调用约 7 units
- 单次最多 50 个频道 ID
- 理论上每天可富化 ~70,000 个频道（远超个人需求）
- **风险**：富化过程中失败导致重试浪费配额

**方案**：
- 富化前先查数据库，跳过 7 天内已富化的
- 失败重试用指数退避（1s, 4s, 16s）
- 记录每日配额使用，达到 8000 units 时停止

#### 挑战 3：观看历史可能上万条

- 一个重度用户 1 年观看历史 ~10,000-50,000 条
- 全部解析 + 入库可能耗时数十秒
- 前端展示也需要分页 + 虚拟滚动

**方案**：
- 解析时分批入库（每批 500 条）
- 数据库索引 `(userId, watchedAt)` 必备
- 前端用 TanStack Virtual 做虚拟滚动

#### 挑战 4：隐私安全

- 真实观看历史是高度敏感数据
- Demo 页面不能展示任何真实数据
- 多用户场景下严格隔离

**方案**：
- 所有 API 强制鉴权 + userId 过滤
- Demo 页面用独立的 `demo_user`，预填脱敏假数据
- 数据库行级隔离（不可跨 userId 查询）
- 部署时所有 ENV 走 Vercel 加密存储
- 提供"一键清空所有数据"

### 6.4 V1 vs V2 架构差异

```
V1 (手动上传):
  用户 → 上传 zip → Vercel Blob → 触发处理 → 入库 → 看 Dashboard

V2 (自动同步):
  Google → 每 2 月生成 zip → Drive
                                ↓
  Vercel Cron 每天检查 → 发现新 zip → 下载 → 处理 → 入库 → 通知用户
```

V2 在 V1 基础上**新增**：
- Google OAuth + Drive API 集成
- `/api/cron/check-takeout` Cron 路由
- Drive 文件去重逻辑（`TakeoutFile.driveFileId`）
- 邮件通知系统

V1 代码完全可复用，V2 只是多了一条"数据源"路径。

---

## 7. UI / UX 设计

### 7.1 页面结构

```
/
├── 首页（Marketing + Demo 入口）
├── /demo                    Demo 模式（无需登录，假数据）
├── /login                   登录
├── /import                  数据导入
├── /dashboard               总览
├── /subscriptions           订阅分析
│   └── /subscriptions/[id]  频道详情
├── /watching                观看分析
├── /search                  搜索与互动
├── /insights                AI 洞察报告
└── /settings                设置
    ├── /settings/account
    ├── /settings/imports
    ├── /settings/privacy
    └── /settings/drive      (V2)
```

### 7.2 关键页面信息架构

#### 首页 `/`
- Hero：标题 + 副标题 + "查看 Demo" CTA
- 价值演示：3 张精美截图（订阅地图 / 观看热力图 / 桑基图）
- 工作原理：3 步流程图
- 隐私承诺：突出展示
- Footer

#### Dashboard `/dashboard`
- 顶部 KPI 卡片：总订阅 / 总观看 / 总时长 / 活跃天数
- 中部：观看趋势曲线（最近 12 个月）
- 中部：观看热力图（最近 1 年）
- 底部：Top 10 频道 + 国家分布地图

#### 订阅分析 `/subscriptions`
- 筛选器：国家、分类、订阅时间
- 国家地图
- 分类饼图 + 标签词云
- 订阅者规模直方图
- 频道列表（含「已订阅但从未观看」标识）

#### 观看分析 `/watching`
- 时段热力图（24 小时 × 7 天）
- 月度日历热力图
- 频道观看 Top 20 排行
- 视频时长分布
- 单频道下钻视图

#### AI 洞察 `/insights`
- 我的 YouTube 画像（长段落 + 标签）
- 兴趣变迁报告
- 取消订阅建议清单
- 相似频道推荐
- "重新生成"按钮

### 7.3 设计语言

- **风格**：现代、数据驱动、暗色优先
- **色板**：YouTube 红作为强调色，整体偏冷色调（暗灰 + 数据彩虹色）
- **字体**：Inter（UI）+ JetBrains Mono（数字）
- **响应式**：桌面优先，移动端可用但不优化

---

## 8. 非功能性需求

### 8.1 性能

| 指标 | 目标 |
|---|---|
| 首页 LCP | < 2.5s |
| Dashboard 首屏 | < 3s |
| API 响应（读） | P95 < 500ms |
| API 响应（写） | P95 < 2s |
| 上传 500MB zip 处理完成 | < 5 分钟 |

### 8.2 可靠性

- 处理失败有清晰错误提示 + 重试机制
- 数据库每日自动备份（Neon 内置）
- 关键操作（删除数据）有二次确认

### 8.3 安全

- 所有 API 强制鉴权
- 敏感数据加密存储（refresh_token）
- HTTPS 强制
- CSP / CORS 策略严格
- 不在客户端暴露 API Key

### 8.4 可观测性

- Vercel Analytics（前端性能）
- Sentry（错误监控）
- 自建 `/api/health` 健康检查
- 关键操作打日志：上传、处理失败、AI 调用

### 8.5 成本控制

| 项 | 预估月成本（个人作品集） |
|---|---|
| Vercel Hobby | $0 |
| Neon 免费版 | $0（500MB 存储） |
| Vercel Blob | $0（1GB 内） |
| YouTube API | $0 |
| Claude API | < $5（每月一次全量分析） |
| **合计** | **< $5/月** |

---

## 9. 里程碑与时间线

### 9.1 V1 里程碑（4 周）

| 周 | 阶段 | 目标 |
|---|---|---|
| Week 1 | 基础设施 | 项目脚手架 + 数据库 + 部署流水线 + 鉴权 |
| Week 2 | 数据管道 | 上传 + 解析 + 入库 + YouTube API 富化 |
| Week 3 | 可视化 | Dashboard 主要页面 + 核心图表 |
| Week 4 | AI 与打磨 | AI 洞察 + Demo 页 + Polish + 上线 |

### 9.2 V2 里程碑（额外 4 周）

| 周 | 阶段 | 目标 |
|---|---|---|
| Week 5 | OAuth | Google OAuth + Drive API 集成 |
| Week 6 | Cron | Vercel Cron + 异步队列 |
| Week 7 | 通知 | 邮件通知 + 状态追踪 |
| Week 8 | 打磨 | 端到端测试 + 文档 + 作品集页面 |

---

## 10. 风险与缓解

| 风险 | 影响 | 概率 | 缓解 |
|---|---|---|---|
| YouTube API 配额耗尽 | 中 | 低 | 缓存 + 限速 + 监控 |
| Takeout 格式变化 | 高 | 低 | 单元测试覆盖解析逻辑 + 错误兜底 |
| Vercel 超时 | 高 | 高 | 拆分函数 + 异步队列 |
| AI 成本失控 | 中 | 低 | 调用前校验 + 缓存结果 |
| 用户隐私事故 | 极高 | 极低 | 严格鉴权 + 数据隔离 + 审计日志 |
| 项目烂尾 | 高 | 中 | V1 范围严格控制 + 每周必须可见进展 |

---

## 11. 成功指标

### 11.1 作品集场景

- 完成度：所有 P0 功能上线
- 部署：可公开访问的 Live Demo
- 故事：README + Portfolio 页面文案完整
- 演示：30 秒视频 / GIF 展示核心流程
- 代码质量：CI 通过、关键路径有测试

### 11.2 产品场景（如果继续做）

- 自己使用次数：每月 ≥ 2 次
- "哇" 时刻：能从数据中发现自己不知道的事
- 数据完整性：覆盖订阅 + 观看 + 搜索三大维度

---

## 12. 开放问题

1. 是否支持 YouTube Music 数据？（默认 No，可作为未来扩展）
2. 是否要做"年度回顾"导出图片？（V2 后考虑）
3. 是否支持多账号合并分析？（V2 后考虑）
4. 是否需要导出 Dashboard 为 PDF？（V2 后考虑）

---

## 附录 A：参考链接

- [Google Takeout](https://takeout.google.com)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Google Drive API](https://developers.google.com/drive/api)
- [Claude API](https://docs.claude.com)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma](https://www.prisma.io/docs)
- [Neon](https://neon.tech)

## 附录 B：术语表

| 术语 | 说明 |
|---|---|
| Takeout | Google 的用户数据导出工具 |
| Channel | YouTube 频道 |
| Subscription | 用户订阅的频道 |
| WatchEvent | 一次视频观看记录 |
| Enrich | 通过 API 富化原始数据 |
| Insight | AI 生成的文字分析 |
| MVP | 最小可行产品 |

---

**End of PRD**
