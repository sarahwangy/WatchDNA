# Tubelens — Ticket 拆解文档

> 配套文档：`Tubelens_PRD.md`
> 本文档把整个项目拆解为 **Epic → Story → Ticket** 三层结构，便于执行追踪。

---

## 文档信息

| 项          | 内容                |
| ----------- | ------------------- |
| 项目代号    | Tubelens            |
| 文档版本    | v1.0                |
| 最后更新    | 2026-05-15          |
| Ticket 总数 | 60+                 |
| 估算总工时  | V1 ≈ 80h / V2 ≈ 40h |

---

## Ticket 编号规则

```
TUB-<Epic>-<编号>

Epic 代号：
  INFRA   基础设施
  AUTH    身份认证
  IMPORT  数据导入
  PARSE   数据解析
  ENRICH  数据富化
  AI      AI 功能
  VIZ     可视化
  PAGE    页面开发
  SET     设置
  V2      V2 自动化
  QA      测试与质量
  DEPLOY  部署与上线
```

**字段定义**：

- **Priority**: P0 (必须有) / P1 (重要) / P2 (Nice to have)
- **Estimate**: 工时估算（小时）
- **Phase**: V1 / V2
- **Status**: TODO / IN_PROGRESS / DONE / BLOCKED

---

# Epic 1: 基础设施 (INFRA)

> 目标：搭好项目骨架，让所有后续工作有"地基"可建。

## TUB-INFRA-001: 初始化 Next.js 项目

| 字段       | 值  |
| ---------- | --- |
| Priority   | P0  |
| Estimate   | 1h  |
| Phase      | V1  |
| Depends on | -   |

**描述**：用 Next.js 14 App Router 初始化项目，配置 TypeScript + Tailwind。

**Acceptance Criteria**：

- [ ] `npx create-next-app@latest tubelens --typescript --tailwind --app` 创建成功
- [ ] 本地 `npm run dev` 能跑起来
- [ ] 提交到 GitHub 仓库
- [ ] `.gitignore` 正确配置（含 `.env*`）

**Notes**：

- 用 pnpm 或 npm 都可以，统一即可
- 仓库设为 Public 方便作品集展示

---

## TUB-INFRA-002: 配置 ESLint + Prettier + Husky

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 1h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-001 |

**描述**：配置代码规范工具，确保代码质量。

**Acceptance Criteria**：

- [ ] ESLint 配置生效
- [ ] Prettier 配置生效
- [ ] Husky pre-commit hook 自动格式化
- [ ] `npm run lint` 通过

---

## TUB-INFRA-003: 安装 shadcn/ui

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 1h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-001 |

**描述**：安装并配置 shadcn/ui 组件库。

**Acceptance Criteria**：

- [ ] `npx shadcn-ui@latest init` 完成
- [ ] 安装基础组件：Button, Card, Input, Select, Dialog, Toast
- [ ] 主题色变量配置好（暗色为主）

---

## TUB-INFRA-004: 创建 Neon Postgres 数据库

| 字段       | 值   |
| ---------- | ---- |
| Priority   | P0   |
| Estimate   | 0.5h |
| Phase      | V1   |
| Depends on | -    |

**描述**：在 Neon 创建免费 Postgres 实例。

**Acceptance Criteria**：

- [ ] Neon 账号创建
- [ ] 项目 `tubelens-prod` 创建
- [ ] 拿到 `DATABASE_URL`
- [ ] 用 `psql` 或 Neon Console 连通测试

---

## TUB-INFRA-005: 安装 Prisma 并配置

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 1h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-004 |

**描述**：初始化 Prisma，连接 Neon。

**Acceptance Criteria**：

- [ ] `npm install @prisma/client prisma`
- [ ] `npx prisma init` 生成 schema 框架
- [ ] `lib/db.ts` 导出全局 Prisma Client
- [ ] 连接测试通过

---

## TUB-INFRA-006: 编写完整 Prisma Schema

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 3h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-005 |

**描述**：把 PRD 第 5.2 节的 Schema 完整落地到 `prisma/schema.prisma`。

**Acceptance Criteria**：

- [ ] 包含 User / TakeoutFile / Channel / Subscription / Video / WatchEvent / SearchEvent / Comment / LikedVideo / Playlist / PlaylistItem / Insight 共 12 张表
- [ ] 关系正确建立
- [ ] 必要的索引建立
- [ ] `npx prisma migrate dev --name init` 成功
- [ ] `npx prisma studio` 能可视化查看

---

## TUB-INFRA-007: 连接 GitHub → Vercel

| 字段       | 值                           |
| ---------- | ---------------------------- |
| Priority   | P0                           |
| Estimate   | 1h                           |
| Phase      | V1                           |
| Depends on | TUB-INFRA-001, TUB-INFRA-004 |

**描述**：把项目部署到 Vercel，建立 CI/CD 流水线。

**Acceptance Criteria**：

- [ ] Vercel 项目创建并关联 GitHub
- [ ] 环境变量 `DATABASE_URL` 配置到 Vercel
- [ ] Push 到 main 触发自动部署
- [ ] 部署 URL 可访问

---

## TUB-INFRA-008: 配置 Vercel Blob

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 0.5h          |
| Phase      | V1            |
| Depends on | TUB-INFRA-007 |

**描述**：启用 Vercel Blob 用于存储 Takeout zip。

**Acceptance Criteria**：

- [ ] Vercel Blob Store 创建
- [ ] `BLOB_READ_WRITE_TOKEN` 配置
- [ ] 测试上传一个文件成功

---

## TUB-INFRA-009: 设置 Sentry 错误监控

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 1h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-007 |

**描述**：集成 Sentry，捕获生产错误。

**Acceptance Criteria**：

- [ ] Sentry 账号 + 项目创建
- [ ] `npm install @sentry/nextjs`
- [ ] 配置 `sentry.client.config.ts` 和 `sentry.server.config.ts`
- [ ] 故意触发一个错误能在 Sentry 看到

---

## TUB-INFRA-010: 编写 README 框架

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 1h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-001 |

**描述**：先写好 README 占位结构，后续填充。

**Acceptance Criteria**：

- [ ] 项目简介
- [ ] 功能特性占位
- [ ] 技术栈
- [ ] 本地开发指南
- [ ] 部署指南
- [ ] 截图占位

---

# Epic 2: 身份认证 (AUTH)

> 目标：实现用户登录，区分多用户数据。

## TUB-AUTH-001: 安装并配置 NextAuth

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 2h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-006 |

**描述**：用 NextAuth 实现 Google OAuth 登录。

**Acceptance Criteria**：

- [ ] `npm install next-auth @auth/prisma-adapter`
- [ ] Google Cloud Console 创建 OAuth 凭证
- [ ] `app/api/auth/[...nextauth]/route.ts` 配置
- [ ] 登录成功后用户写入 User 表
- [ ] Session 类型扩展 userId

---

## TUB-AUTH-002: 实现登录页 `/login`

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P0           |
| Estimate   | 1h           |
| Phase      | V1           |
| Depends on | TUB-AUTH-001 |

**描述**：登录页面 UI。

**Acceptance Criteria**：

- [ ] 简洁的登录页，含 "Continue with Google" 按钮
- [ ] 已登录用户访问自动跳转 `/dashboard`

---

## TUB-AUTH-003: 实现路由保护中间件

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P0           |
| Estimate   | 1h           |
| Phase      | V1           |
| Depends on | TUB-AUTH-001 |

**描述**：未登录用户访问 `/dashboard` 等私有页面时跳转登录。

**Acceptance Criteria**：

- [ ] `middleware.ts` 配置保护路径
- [ ] 公开路径：`/`, `/login`, `/demo`, `/api/auth/*`
- [ ] 私有路径：`/dashboard`, `/subscriptions`, `/watching`, `/insights`, `/settings`, `/import`

---

## TUB-AUTH-004: 实现 API 鉴权工具函数

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P0           |
| Estimate   | 1h           |
| Phase      | V1           |
| Depends on | TUB-AUTH-001 |

**描述**：所有 API 路由都要能拿到 userId 并强制鉴权。

**Acceptance Criteria**：

- [ ] `lib/auth.ts` 导出 `requireUser(req)` 函数
- [ ] 未登录返回 401
- [ ] 返回 userId

---

# Epic 3: 数据导入 (IMPORT) - V1 手动上传

> 目标：用户能上传 Takeout zip 文件并触发处理。

## TUB-IMPORT-001: 实现 `/import` 上传页 UI

| 字段       | 值                          |
| ---------- | --------------------------- |
| Priority   | P0                          |
| Estimate   | 3h                          |
| Phase      | V1                          |
| Depends on | TUB-AUTH-003, TUB-INFRA-003 |

**描述**：用户拖拽或选择 zip 文件的页面。

**Acceptance Criteria**：

- [ ] 拖拽区域 + 文件选择按钮
- [ ] 显示 Takeout 操作引导（截图 / 步骤）
- [ ] 文件类型校验：仅接受 zip
- [ ] 文件大小校验：< 2GB
- [ ] 上传进度条
- [ ] 上传完成跳转到处理状态页

---

## TUB-IMPORT-002: 实现直传 Vercel Blob API

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 2h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-008 |

**描述**：用户文件直传 Blob，不经过 Vercel Function（避免超时和内存限制）。

**Acceptance Criteria**：

- [ ] `POST /api/upload/presign` 返回上传 token
- [ ] 前端用 `@vercel/blob/client` 直传
- [ ] 上传完成后客户端通知服务端

---

## TUB-IMPORT-003: 创建 TakeoutFile 记录 API

| 字段       | 值                            |
| ---------- | ----------------------------- |
| Priority   | P0                            |
| Estimate   | 1h                            |
| Phase      | V1                            |
| Depends on | TUB-IMPORT-002, TUB-INFRA-006 |

**描述**：上传完成后在数据库创建处理任务。

**Acceptance Criteria**：

- [ ] `POST /api/import` 接收 blob URL + 文件元信息
- [ ] 创建 TakeoutFile 记录，status = 'pending'
- [ ] 触发 `/api/process-takeout`（不阻塞返回）
- [ ] 返回 taskId

---

## TUB-IMPORT-004: 实现处理状态查询 API

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P0             |
| Estimate   | 1h             |
| Phase      | V1             |
| Depends on | TUB-IMPORT-003 |

**描述**：前端轮询任务状态。

**Acceptance Criteria**：

- [ ] `GET /api/import/[taskId]/status` 返回任务状态
- [ ] 状态字段：pending / processing / completed / failed
- [ ] 含进度百分比（解析阶段、富化阶段）
- [ ] 含错误信息

---

## TUB-IMPORT-005: 实现处理状态页

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P0             |
| Estimate   | 2h             |
| Phase      | V1             |
| Depends on | TUB-IMPORT-004 |

**描述**：上传后用户看到的"正在处理"页面。

**Acceptance Criteria**：

- [ ] 显示当前阶段（解析 / 富化 / 完成）
- [ ] 轮询状态 API
- [ ] 完成后自动跳转 Dashboard
- [ ] 失败显示错误 + 重试按钮

---

# Epic 4: 数据解析 (PARSE)

> 目标：把 Takeout zip 里的各种文件解析成结构化数据存入数据库。

## TUB-PARSE-001: 实现 zip 下载与解压

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P0             |
| Estimate   | 2h             |
| Phase      | V1             |
| Depends on | TUB-IMPORT-003 |

**描述**：`/api/process-takeout` 第一步：从 Blob 下载 zip 并解压。

**Acceptance Criteria**：

- [ ] 从 Blob URL 下载到内存（不写磁盘）
- [ ] 用 JSZip 解压
- [ ] 遍历所有文件，识别关键文件路径
- [ ] 识别 YouTube 数据目录（Takeout/YouTube and YouTube Music/）

**关键代码骨架**：

```typescript
import JSZip from 'jszip';

async function loadTakeoutZip(blobUrl: string) {
  const res = await fetch(blobUrl);
  const buffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const files = {
    subscriptions: null,
    watchHistory: null,
    searchHistory: null,
    comments: null,
    likedVideos: null,
    playlists: [],
  };

  zip.forEach((path, file) => {
    if (path.endsWith('subscriptions.csv')) files.subscriptions = file;
    else if (path.endsWith('watch-history.html')) files.watchHistory = file;
    else if (path.endsWith('search-history.html')) files.searchHistory = file;
    else if (path.endsWith('comments.csv')) files.comments = file;
    else if (path.match(/liked videos\.csv$/i)) files.likedVideos = file;
    else if (path.includes('playlists/') && path.endsWith('.csv')) files.playlists.push(file);
  });

  return files;
}
```

---

## TUB-PARSE-002: 实现 subscriptions.csv 解析

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 2h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-001 |

**描述**：解析订阅列表 CSV。

**Acceptance Criteria**：

- [ ] 用 papaparse 解析 CSV
- [ ] 提取 Channel ID / URL / Title
- [ ] Upsert 到 Channel 表（基础字段）
- [ ] 创建/更新 Subscription 表（userId + channelId）
- [ ] 容错：跳过缺失 Channel ID 的行

---

## TUB-PARSE-003: 实现 watch-history.html 解析

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 4h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-001 |

**描述**：解析观看历史 HTML。

**Acceptance Criteria**：

- [ ] 用 cheerio 或正则解析 HTML
- [ ] 提取：视频标题、视频 URL、频道、观看时间
- [ ] 时间格式解析（含时区）
- [ ] 处理"广告"、"YouTube Music"等特殊条目
- [ ] 分批插入数据库（每批 500）
- [ ] 处理 1 万 + 条数据不卡死

**关键代码骨架**：

```typescript
import * as cheerio from 'cheerio';

function parseWatchHistory(html: string) {
  const $ = cheerio.load(html);
  const events = [];

  $('.content-cell').each((i, el) => {
    const cell = $(el);
    const links = cell.find('a');
    if (links.length < 2) return; // 跳过广告等

    const videoLink = links.eq(0);
    const channelLink = links.eq(1);
    const text = cell.text();
    const timeMatch = text.match(/(\w{3} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2})/);

    events.push({
      videoTitle: videoLink.text(),
      videoUrl: videoLink.attr('href'),
      channelTitle: channelLink.text(),
      channelUrl: channelLink.attr('href'),
      watchedAt: timeMatch ? new Date(timeMatch[1]) : null,
    });
  });

  return events;
}
```

---

## TUB-PARSE-004: 实现 search-history.html 解析

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 2h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-001 |

**描述**：解析搜索历史。

**Acceptance Criteria**：

- [ ] 提取搜索词 + 搜索时间
- [ ] 入 SearchEvent 表

---

## TUB-PARSE-005: 实现 comments.csv 解析

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 1.5h          |
| Phase      | V1            |
| Depends on | TUB-PARSE-001 |

**描述**：解析评论。

**Acceptance Criteria**：

- [ ] 提取评论内容、视频 ID、时间
- [ ] 入 Comment 表

---

## TUB-PARSE-006: 实现 liked videos.csv 解析

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 1h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-001 |

**描述**：解析点赞视频。

**Acceptance Criteria**：

- [ ] 提取 Video ID + 点赞时间
- [ ] 入 LikedVideo 表

---

## TUB-PARSE-007: 实现 playlists/\*.csv 解析

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 2h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-001 |

**描述**：解析所有播放列表 CSV。

**Acceptance Criteria**：

- [ ] 遍历 playlists/ 目录下所有 CSV
- [ ] 从文件名提取播放列表名
- [ ] 入 Playlist + PlaylistItem 表

---

## TUB-PARSE-008: 解析阶段单元测试

| 字段       | 值                           |
| ---------- | ---------------------------- |
| Priority   | P1                           |
| Estimate   | 3h                           |
| Phase      | V1                           |
| Depends on | TUB-PARSE-002, TUB-PARSE-003 |

**描述**：用脱敏的样本文件覆盖核心解析逻辑。

**Acceptance Criteria**：

- [ ] tests/fixtures 含样本文件
- [ ] subscriptions / watch / search 都有测试用例
- [ ] 边界情况：空文件、损坏文件、超大文件
- [ ] CI 通过

---

# Epic 5: 数据富化 (ENRICH)

> 目标：调 YouTube API 富化频道元数据。

## TUB-ENRICH-001: 申请 YouTube Data API Key

| 字段       | 值   |
| ---------- | ---- |
| Priority   | P0   |
| Estimate   | 0.5h |
| Phase      | V1   |
| Depends on | -    |

**描述**：在 Google Cloud Console 启用 YouTube Data API v3 并创建 API Key。

**Acceptance Criteria**：

- [ ] API Key 创建
- [ ] 配置到 Vercel 环境变量 `YOUTUBE_API_KEY`
- [ ] 配额监控页面收藏

---

## TUB-ENRICH-002: 实现 channels.list 调用封装

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P0             |
| Estimate   | 2h             |
| Phase      | V1             |
| Depends on | TUB-ENRICH-001 |

**描述**：封装批量查询频道详情的函数。

**Acceptance Criteria**：

- [ ] `lib/youtube.ts` 导出 `fetchChannels(ids: string[])`
- [ ] 自动分批（每次 ≤ 50 个 ID）
- [ ] 提取 snippet / statistics / topicDetails / brandingSettings
- [ ] 失败重试：3 次指数退避
- [ ] 返回结构化数据

---

## TUB-ENRICH-003: 实现富化任务路由

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P0             |
| Estimate   | 2h             |
| Phase      | V1             |
| Depends on | TUB-ENRICH-002 |

**描述**：`POST /api/enrich/channels` 触发批量富化。

**Acceptance Criteria**：

- [ ] 查询数据库中 `enrichedAt is null OR < now-7d` 的 Channel
- [ ] 调用 fetchChannels 富化
- [ ] 更新 Channel 表的字段
- [ ] 记录富化时间

---

## TUB-ENRICH-004: 实现配额管理

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P1             |
| Estimate   | 1.5h           |
| Phase      | V1             |
| Depends on | TUB-ENRICH-003 |

**描述**：避免单日超出 10,000 units 配额。

**Acceptance Criteria**：

- [ ] 数据库表 `ApiQuota` 记录每日使用量
- [ ] 每次调用前检查
- [ ] 超过 8000 单位时停止当日富化任务
- [ ] 次日自动恢复

---

## TUB-ENRICH-005: 集成到 Takeout 处理流程

| 字段       | 值                            |
| ---------- | ----------------------------- |
| Priority   | P0                            |
| Estimate   | 1h                            |
| Phase      | V1                            |
| Depends on | TUB-PARSE-002, TUB-ENRICH-003 |

**描述**：解析完成后自动触发富化。

**Acceptance Criteria**：

- [ ] 解析完成后异步触发 `/api/enrich/channels`
- [ ] 不阻塞用户进入 Dashboard
- [ ] 富化进行中 Dashboard 显示"AI 正在分析..."

---

# Epic 6: AI 功能 (AI)

> 目标：用 Claude 生成分类、洞察、推荐。

## TUB-AI-001: 集成 Claude API SDK

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 1h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-007 |

**描述**：安装 Anthropic SDK 并封装客户端。

**Acceptance Criteria**：

- [ ] `npm install @anthropic-ai/sdk`
- [ ] `lib/claude.ts` 导出 client
- [ ] 环境变量 `ANTHROPIC_API_KEY`
- [ ] 测试 hello world 调用

---

## TUB-AI-002: 实现频道分类与打标签

| 字段       | 值                         |
| ---------- | -------------------------- |
| Priority   | P0                         |
| Estimate   | 3h                         |
| Phase      | V1                         |
| Depends on | TUB-AI-001, TUB-ENRICH-005 |

**描述**：调用 Claude Haiku 给每个频道生成 1 个主分类 + 3-5 个标签。

**Acceptance Criteria**：

- [ ] 输入：频道标题 + 描述 + 已有 topicCategories
- [ ] 输出 JSON：`{ category, tags: [] }`
- [ ] 分类候选集稳定（Tech / Music / Gaming / Education / News / Entertainment / Lifestyle / Sports / Science / Art / Other）
- [ ] 批量处理（每次 10 个频道一个 prompt）
- [ ] 结果存入 Channel.aiCategory + aiTags
- [ ] 跳过已有结果的频道

---

## TUB-AI-003: 实现观众画像生成

| 字段       | 值                        |
| ---------- | ------------------------- |
| Priority   | P0                        |
| Estimate   | 3h                        |
| Phase      | V1                        |
| Depends on | TUB-AI-002, TUB-PARSE-003 |

**描述**：基于用户全部数据生成"你的 YouTube 画像"。

**Acceptance Criteria**：

- [ ] 输入：聚合统计（Top 频道、分类分布、时段偏好、平均时长）
- [ ] 输出：200-300 字的人性化叙述 + 3-5 个标签
- [ ] 存入 Insight 表（type='viewer_profile'）
- [ ] 缓存 30 天

---

## TUB-AI-004: 实现兴趣变迁分析

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P1         |
| Estimate   | 3h         |
| Phase      | V1         |
| Depends on | TUB-AI-002 |

**描述**：对比近 6 个月 vs 之前的观看分类分布，生成变化叙事。

**Acceptance Criteria**：

- [ ] 计算两个时间段的分类分布
- [ ] 提取显著变化（>10% 的类别变动）
- [ ] Claude 生成 150 字叙述
- [ ] 存入 Insight 表（type='interest_shift'）

---

## TUB-AI-005: 实现取消订阅建议

| 字段       | 值                           |
| ---------- | ---------------------------- |
| Priority   | P1                           |
| Estimate   | 2h                           |
| Phase      | V1                           |
| Depends on | TUB-PARSE-002, TUB-PARSE-003 |

**描述**：识别"已订阅但 6 个月内零观看"的频道。

**Acceptance Criteria**：

- [ ] SQL 查询出候选清单
- [ ] 按订阅时长排序
- [ ] 不需要 AI，纯逻辑
- [ ] API: `GET /api/insights/unsubscribe-suggestions`

---

## TUB-AI-006: 实现相似频道推荐

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P2         |
| Estimate   | 4h         |
| Phase      | V1         |
| Depends on | TUB-AI-002 |

**描述**：基于用户画像，从已订阅频道中找出"被忽略的相似频道"。

**Acceptance Criteria**：

- [ ] 计算用户 Top 观看频道的"分类+标签"特征
- [ ] 找出已订阅但低观看的频道中特征相似的
- [ ] 返回 Top 5 推荐
- [ ] API: `GET /api/insights/recommendations`

---

## TUB-AI-007: AI 调用成本监控

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P1         |
| Estimate   | 1h         |
| Phase      | V1         |
| Depends on | TUB-AI-001 |

**描述**：记录每次 AI 调用的 token 使用量。

**Acceptance Criteria**：

- [ ] 数据库表 `AiUsage` 记录 (userId, model, inputTokens, outputTokens, cost, timestamp)
- [ ] 每次调用后写入
- [ ] 单用户单日成本超 $1 时告警

---

# Epic 7: 可视化 (VIZ)

> 目标：把数据变成会让人"哇"的图表。

## TUB-VIZ-001: 选型并安装图表库

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 1h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-003 |

**描述**：安装 Recharts + nivo + react-simple-maps。

**Acceptance Criteria**：

- [ ] `npm install recharts @nivo/core @nivo/sankey @nivo/calendar react-simple-maps`
- [ ] 各跑一个 hello world

---

## TUB-VIZ-002: 总览 KPI 卡片组件

| 字段       | 值          |
| ---------- | ----------- |
| Priority   | P0          |
| Estimate   | 2h          |
| Phase      | V1          |
| Depends on | TUB-VIZ-001 |

**描述**：4 个核心数字卡片：总订阅 / 总观看 / 总时长 / 活跃天数。

**Acceptance Criteria**：

- [ ] 复用 shadcn Card 组件
- [ ] 数字带千分位
- [ ] 含对比同比（本月 vs 上月）

---

## TUB-VIZ-003: 订阅国家分布世界地图

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P0             |
| Estimate   | 4h             |
| Phase      | V1             |
| Depends on | TUB-ENRICH-005 |

**描述**：用 react-simple-maps 渲染世界地图，国家颜色深度 = 频道数。

**Acceptance Criteria**：

- [ ] 国家颜色按订阅频道数加深
- [ ] hover 显示国家名 + 频道数
- [ ] 点击国家跳转该国家的频道列表

---

## TUB-VIZ-004: 订阅分类饼图

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P0         |
| Estimate   | 1.5h       |
| Phase      | V1         |
| Depends on | TUB-AI-002 |

**描述**：用 Recharts PieChart 展示 aiCategory 分布。

**Acceptance Criteria**：

- [ ] 各分类占比清晰展示
- [ ] hover 显示具体数字
- [ ] 点击分类筛选频道列表

---

## TUB-VIZ-005: 观看热力图（GitHub 风格）

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 3h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-003 |

**描述**：日历热力图，每天观看数。

**Acceptance Criteria**：

- [ ] 用 nivo Calendar 或自定义 D3
- [ ] 最近 365 天
- [ ] 颜色深度 = 观看数
- [ ] hover 显示日期 + 数量

---

## TUB-VIZ-006: 时段热力图（24h × 7d）

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 3h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-003 |

**描述**：一周 × 24 小时的观看分布热力图。

**Acceptance Criteria**：

- [ ] 7 行 × 24 列的网格
- [ ] 颜色深度 = 观看数
- [ ] 揭示"夜猫子还是早起鸟"

---

## TUB-VIZ-007: 订阅 vs 观看桑基图

| 字段       | 值                           |
| ---------- | ---------------------------- |
| Priority   | P0                           |
| Estimate   | 4h                           |
| Phase      | V1                           |
| Depends on | TUB-PARSE-002, TUB-PARSE-003 |

**描述**：金句洞察图——展示订阅频道中真正被观看的占比。

**Acceptance Criteria**：

- [ ] 左侧：所有订阅频道（按订阅时间排序）
- [ ] 右侧：观看时长 Top 20 频道
- [ ] 连线粗细 = 观看时长
- [ ] 突出"订阅了从未观看"的频道

---

## TUB-VIZ-008: 月度观看趋势曲线

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 2h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-003 |

**描述**：折线图：每月观看视频数。

**Acceptance Criteria**：

- [ ] Recharts AreaChart
- [ ] 最近 24 个月
- [ ] 含趋势线

---

## TUB-VIZ-009: Top N 频道排行榜

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 2h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-003 |

**描述**：表格 + 横向条形图组合。

**Acceptance Criteria**：

- [ ] Top 20 观看时长频道
- [ ] 含缩略图、频道名、观看数、占比
- [ ] 点击进入频道详情页

---

## TUB-VIZ-010: 搜索词云

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 2h            |
| Phase      | V1            |
| Depends on | TUB-PARSE-004 |

**描述**：用 react-wordcloud 展示搜索关键词。

**Acceptance Criteria**：

- [ ] 词频统计
- [ ] 字体大小映射频次
- [ ] 过滤停用词

---

## TUB-VIZ-011: 兴趣变迁桑基图

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P1         |
| Estimate   | 3h         |
| Phase      | V1         |
| Depends on | TUB-AI-004 |

**描述**：展示分类在不同时间段的流向变化。

**Acceptance Criteria**：

- [ ] 左侧：去年分类分布
- [ ] 右侧：今年分类分布
- [ ] 连线展示用户从某个类别"流向"另一个

---

# Epic 8: 页面开发 (PAGE)

> 目标：把组件组装成完整页面。

## TUB-PAGE-001: 首页 `/`

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 4h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-003 |

**描述**：项目门面。

**Acceptance Criteria**：

- [ ] Hero：标题 + 副标题 + 双 CTA（试 Demo / 上传数据）
- [ ] 3 张精美截图
- [ ] 工作原理 3 步
- [ ] 隐私承诺
- [ ] Footer 含 GitHub 链接

---

## TUB-PAGE-002: Demo 页 `/demo`

| 字段       | 值          |
| ---------- | ----------- |
| Priority   | P0          |
| Estimate   | 3h          |
| Phase      | V1          |
| Depends on | TUB-VIZ-002 |

**描述**：用脱敏的演示数据展示完整 Dashboard，无需登录。

**Acceptance Criteria**：

- [ ] 数据库种子脚本：预填 demo_user 的所有数据
- [ ] `/demo` 路由直接读 demo_user 数据
- [ ] 不可写操作
- [ ] 顶部 Banner："This is demo data. Sign in to analyze your own."

---

## TUB-PAGE-003: Dashboard 总览 `/dashboard`

| 字段       | 值                                    |
| ---------- | ------------------------------------- |
| Priority   | P0                                    |
| Estimate   | 4h                                    |
| Phase      | V1                                    |
| Depends on | TUB-VIZ-002, TUB-VIZ-003, TUB-VIZ-005 |

**描述**：登录用户的主页。

**Acceptance Criteria**：

- [ ] 4 个 KPI 卡片
- [ ] 国家分布地图
- [ ] 观看热力图
- [ ] Top 5 频道
- [ ] 跳转其他详细分析的导航

---

## TUB-PAGE-004: 订阅分析页 `/subscriptions`

| 字段       | 值                       |
| ---------- | ------------------------ |
| Priority   | P0                       |
| Estimate   | 4h                       |
| Phase      | V1                       |
| Depends on | TUB-VIZ-003, TUB-VIZ-004 |

**描述**：深入查看订阅维度。

**Acceptance Criteria**：

- [ ] 筛选器：国家、分类、订阅时间
- [ ] 国家地图（大图）
- [ ] 分类饼图
- [ ] 订阅者规模直方图
- [ ] 频道列表（分页 + 排序）

---

## TUB-PAGE-005: 观看分析页 `/watching`

| 字段       | 值                                    |
| ---------- | ------------------------------------- |
| Priority   | P0                                    |
| Estimate   | 4h                                    |
| Phase      | V1                                    |
| Depends on | TUB-VIZ-005, TUB-VIZ-006, TUB-VIZ-007 |

**描述**：观看习惯深度分析。

**Acceptance Criteria**：

- [ ] 时段热力图
- [ ] 日历热力图
- [ ] 订阅 vs 观看桑基图
- [ ] Top 20 频道排行
- [ ] 视频时长分布

---

## TUB-PAGE-006: 频道详情页 `/subscriptions/[id]`

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P1           |
| Estimate   | 3h           |
| Phase      | V1           |
| Depends on | TUB-PAGE-004 |

**描述**：单个频道的深度视图。

**Acceptance Criteria**：

- [ ] 频道元数据（头像、订阅数、描述）
- [ ] 我在这个频道的观看历史
- [ ] 观看时间分布
- [ ] 我的所有评论 / 点赞 / 播放列表中的视频

---

## TUB-PAGE-007: 搜索与互动页 `/search`

| 字段       | 值          |
| ---------- | ----------- |
| Priority   | P1          |
| Estimate   | 3h          |
| Phase      | V1          |
| Depends on | TUB-VIZ-010 |

**描述**：搜索 + 评论 + 点赞综合。

**Acceptance Criteria**：

- [ ] 搜索词云
- [ ] 搜索频次时间线
- [ ] 评论列表（最新 50 条）
- [ ] 点赞视频列表

---

## TUB-PAGE-008: AI 洞察页 `/insights`

| 字段       | 值                                 |
| ---------- | ---------------------------------- |
| Priority   | P0                                 |
| Estimate   | 4h                                 |
| Phase      | V1                                 |
| Depends on | TUB-AI-003, TUB-AI-004, TUB-AI-005 |

**描述**：AI 生成的各类报告集合。

**Acceptance Criteria**：

- [ ] "你的 YouTube 画像"（卡片，长文）
- [ ] "兴趣变迁"（卡片）
- [ ] "建议取消订阅"清单（可勾选 + 链接到 YouTube）
- [ ] "你可能错过的相似频道"
- [ ] "重新生成"按钮

---

## TUB-PAGE-009: 全局站点导航

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P0           |
| Estimate   | 2h           |
| Phase      | V1           |
| Depends on | TUB-PAGE-003 |

**描述**：登录后所有页面共用的侧边栏 / 顶栏。

**Acceptance Criteria**：

- [ ] 侧边栏：Dashboard / Subscriptions / Watching / Search / Insights / Settings
- [ ] 顶部：搜索框、用户头像、退出
- [ ] 响应式（移动端折叠）

---

# Epic 9: 设置 (SET)

## TUB-SET-001: 账号管理页 `/settings/account`

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P0           |
| Estimate   | 2h           |
| Phase      | V1           |
| Depends on | TUB-AUTH-001 |

**描述**：用户基本信息 + 删除账号。

**Acceptance Criteria**：

- [ ] 显示头像、邮箱、注册时间
- [ ] "删除账号"按钮（二次确认）

---

## TUB-SET-002: 导入历史页 `/settings/imports`

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P1             |
| Estimate   | 2h             |
| Phase      | V1             |
| Depends on | TUB-IMPORT-003 |

**描述**：查看所有上传记录。

**Acceptance Criteria**：

- [ ] 列表展示：文件名、时间、状态、大小
- [ ] 失败任务支持重试

---

## TUB-SET-003: 隐私设置页 `/settings/privacy`

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P0           |
| Estimate   | 2h           |
| Phase      | V1           |
| Depends on | TUB-AUTH-001 |

**描述**：数据控制选项。

**Acceptance Criteria**：

- [ ] "一键清空所有数据"按钮（二次确认）
- [ ] "导出我的数据"（JSON）
- [ ] 数据保留政策说明

---

# Epic 10: V2 - Drive 自动同步 (V2)

> 目标：实现完全自动化的数据同步。

## TUB-V2-001: 扩展 Google OAuth Scope

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P0           |
| Estimate   | 2h           |
| Phase      | V2           |
| Depends on | TUB-AUTH-001 |

**描述**：在登录时申请 Drive 只读权限。

**Acceptance Criteria**：

- [ ] OAuth scope 增加 `drive.readonly`
- [ ] 用户首次连接 Drive 时单独确认
- [ ] 存储 refresh_token 到 User 表

---

## TUB-V2-002: 实现 Drive 连接页 `/settings/drive`

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P0         |
| Estimate   | 2h         |
| Phase      | V2         |
| Depends on | TUB-V2-001 |

**描述**：用户连接/断开 Drive 的界面。

**Acceptance Criteria**：

- [ ] 显示连接状态
- [ ] "Connect Google Drive" 按钮
- [ ] "Disconnect" 按钮（删除 refresh_token）
- [ ] 引导步骤：去 Takeout 设置自动导出

---

## TUB-V2-003: 实现 Drive API 客户端

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P0         |
| Estimate   | 2h         |
| Phase      | V2         |
| Depends on | TUB-V2-001 |

**描述**：封装 Drive API 调用。

**Acceptance Criteria**：

- [ ] `lib/drive.ts` 导出 `listTakeoutFiles(userId)`
- [ ] 用 refresh_token 自动刷新 access_token
- [ ] 查询条件：文件名含 'takeout' + mimeType=zip
- [ ] 失败重试

---

## TUB-V2-004: 实现 Cron 路由 `/api/cron/check-takeout`

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P0         |
| Estimate   | 2h         |
| Phase      | V2         |
| Depends on | TUB-V2-003 |

**描述**：每天检查所有用户的 Drive 是否有新 Takeout。

**Acceptance Criteria**：

- [ ] 验证 Authorization header（Vercel Cron Secret）
- [ ] 遍历所有 driveConnected=true 的用户
- [ ] 对每个用户调用 listTakeoutFiles
- [ ] 对比 TakeoutFile 表，找出新文件
- [ ] 触发 `/api/process-takeout` 处理新文件
- [ ] 函数总耗时 < 10 秒

---

## TUB-V2-005: 配置 vercel.json Cron 声明

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P0         |
| Estimate   | 0.5h       |
| Phase      | V2         |
| Depends on | TUB-V2-004 |

**描述**：声明 Vercel Cron Job。

**Acceptance Criteria**：

- [ ] `vercel.json` 含 cron 配置
- [ ] Schedule: `0 8 * * *`（UTC，对应北京 16:00）
- [ ] 部署后 Vercel Dashboard 显示 Cron 任务

---

## TUB-V2-006: 集成 Inngest 处理长任务

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P0         |
| Estimate   | 4h         |
| Phase      | V2         |
| Depends on | TUB-V2-004 |

**描述**：把"下载 zip + 解析 + 富化"放到 Inngest 队列。

**Acceptance Criteria**：

- [ ] 注册 Inngest 账号
- [ ] `npm install inngest`
- [ ] 定义 event: `takeout.received`
- [ ] 定义 function：处理整个 takeout 流程，支持长时间运行
- [ ] Cron 路由只发送 event，不阻塞

---

## TUB-V2-007: 实现处理完成邮件通知

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P1         |
| Estimate   | 2h         |
| Phase      | V2         |
| Depends on | TUB-V2-006 |

**描述**：自动同步完成后发邮件。

**Acceptance Criteria**：

- [ ] 集成 Resend
- [ ] 模板：包含新增数据统计 + Dashboard 链接
- [ ] 用户可在设置中开关邮件通知

---

## TUB-V2-008: 站内通知中心

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P2         |
| Estimate   | 3h         |
| Phase      | V2         |
| Depends on | TUB-V2-007 |

**描述**：顶部铃铛图标 + 通知列表。

**Acceptance Criteria**：

- [ ] 数据库表 Notification
- [ ] 顶部铃铛带未读数
- [ ] 点击展开列表

---

# Epic 11: 测试与质量 (QA)

## TUB-QA-001: 配置 Vitest

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P1            |
| Estimate   | 1h            |
| Phase      | V1            |
| Depends on | TUB-INFRA-001 |

**描述**：单元测试框架。

**Acceptance Criteria**：

- [ ] `npm install -D vitest @testing-library/react`
- [ ] vite.config.ts 配置
- [ ] `npm run test` 跑通

---

## TUB-QA-002: 关键解析逻辑测试

| 字段       | 值                        |
| ---------- | ------------------------- |
| Priority   | P1                        |
| Estimate   | 3h                        |
| Phase      | V1                        |
| Depends on | TUB-QA-001, TUB-PARSE-003 |

**描述**：覆盖 subscriptions / watch / search 解析。

**Acceptance Criteria**：

- [ ] 测试覆盖率 > 80%（解析模块）
- [ ] CI 跑测试

---

## TUB-QA-003: 端到端测试（Playwright）

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P2           |
| Estimate   | 4h           |
| Phase      | V1           |
| Depends on | TUB-PAGE-003 |

**描述**：核心流程 E2E。

**Acceptance Criteria**：

- [ ] 登录 → 上传 → 看 Dashboard 流程
- [ ] CI 集成

---

## TUB-QA-004: GitHub Actions CI 流水线

| 字段       | 值         |
| ---------- | ---------- |
| Priority   | P1         |
| Estimate   | 1h         |
| Phase      | V1         |
| Depends on | TUB-QA-001 |

**描述**：PR 自动跑 lint + test。

**Acceptance Criteria**：

- [ ] `.github/workflows/ci.yml`
- [ ] 跑 lint / typecheck / test
- [ ] PR 状态显示

---

# Epic 12: 部署与上线 (DEPLOY)

## TUB-DEPLOY-001: 配置生产环境变量

| 字段       | 值            |
| ---------- | ------------- |
| Priority   | P0            |
| Estimate   | 0.5h          |
| Phase      | V1            |
| Depends on | TUB-INFRA-007 |

**描述**：Vercel 配置所有 ENV。

**Acceptance Criteria**：

- [ ] DATABASE_URL
- [ ] NEXTAUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- [ ] BLOB_READ_WRITE_TOKEN
- [ ] YOUTUBE_API_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] SENTRY_DSN
- [ ] CRON_SECRET（V2）

---

## TUB-DEPLOY-002: 域名绑定

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P1             |
| Estimate   | 0.5h           |
| Phase      | V1             |
| Depends on | TUB-DEPLOY-001 |

**描述**：自定义域名（可选）。

**Acceptance Criteria**：

- [ ] 域名解析到 Vercel
- [ ] HTTPS 证书自动生成

---

## TUB-DEPLOY-003: 写完整 README

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P0           |
| Estimate   | 2h           |
| Phase      | V1           |
| Depends on | TUB-PAGE-003 |

**描述**：项目门面文档。

**Acceptance Criteria**：

- [ ] 项目截图（3+ 张）
- [ ] Features 列表
- [ ] 技术栈
- [ ] Live Demo 链接
- [ ] 本地开发指南
- [ ] 架构图
- [ ] 隐私说明

---

## TUB-DEPLOY-004: 录制 Demo 视频

| 字段       | 值           |
| ---------- | ------------ |
| Priority   | P1           |
| Estimate   | 2h           |
| Phase      | V1           |
| Depends on | TUB-PAGE-002 |

**描述**：30-60 秒展示核心流程。

**Acceptance Criteria**：

- [ ] GIF 或 MP4
- [ ] 嵌入到 README 顶部
- [ ] 关键画面：上传、Dashboard、AI 洞察

---

## TUB-DEPLOY-005: 写作品集页面文案

| 字段       | 值             |
| ---------- | -------------- |
| Priority   | P1             |
| Estimate   | 2h             |
| Phase      | V1             |
| Depends on | TUB-DEPLOY-003 |

**描述**：portfolio 网站上的项目介绍。

**Acceptance Criteria**：

- [ ] 中英文版本
- [ ] 突出技术亮点（Takeout 处理、AI、可视化）
- [ ] 链接到 Live Demo + GitHub

---

# 全部 Ticket 汇总表

## V1 阶段（P0 + P1 优先）

| Epic        | P0     | P1     | P2    | 小计   |
| ----------- | ------ | ------ | ----- | ------ |
| INFRA       | 7      | 3      | 0     | 10     |
| AUTH        | 4      | 0      | 0     | 4      |
| IMPORT      | 5      | 0      | 0     | 5      |
| PARSE       | 4      | 4      | 0     | 8      |
| ENRICH      | 3      | 2      | 0     | 5      |
| AI          | 3      | 3      | 1     | 7      |
| VIZ         | 7      | 4      | 0     | 11     |
| PAGE        | 5      | 4      | 0     | 9      |
| SET         | 2      | 1      | 0     | 3      |
| QA          | 0      | 3      | 1     | 4      |
| DEPLOY      | 2      | 3      | 0     | 5      |
| **V1 合计** | **42** | **27** | **2** | **71** |

## V2 阶段

| Epic | P0  | P1  | P2  | 小计 |
| ---- | --- | --- | --- | ---- |
| V2   | 5   | 2   | 1   | 8    |

---

# 4 周 V1 冲刺计划

## Week 1：基础设施（20h）

| 日   | Ticket                     | 备注               |
| ---- | -------------------------- | ------------------ |
| 周一 | INFRA-001 ~ 003            | 项目初始化 + UI    |
| 周二 | INFRA-004 ~ 006            | 数据库 + Schema    |
| 周三 | INFRA-007 ~ 010 + AUTH-001 | 部署 + 监控 + 登录 |
| 周四 | AUTH-002 ~ 004             | 登录页 + 鉴权      |
| 周五 | IMPORT-001 ~ 005           | 上传管道           |

**周末检查点**：用户能登录并上传文件，文件在数据库有记录。

## Week 2：数据管道（20h）

| 日   | Ticket                       | 备注                     |
| ---- | ---------------------------- | ------------------------ |
| 周一 | PARSE-001 ~ 002              | zip 解析 + subscriptions |
| 周二 | PARSE-003                    | watch-history（最复杂）  |
| 周三 | PARSE-004 ~ 007              | 其他文件解析             |
| 周四 | ENRICH-001 ~ 003             | YouTube API              |
| 周五 | ENRICH-004 ~ 005 + PARSE-008 | 配额管理 + 测试          |

**周末检查点**：上传 zip 后数据完全入库并富化。

## Week 3：可视化（20h）

| 日   | Ticket                   | 备注                         |
| ---- | ------------------------ | ---------------------------- |
| 周一 | VIZ-001 ~ 002 + PAGE-009 | 基础组件 + 导航              |
| 周二 | VIZ-003 ~ 004 + PAGE-003 | 地图 + 饼图 + Dashboard 主页 |
| 周三 | VIZ-005 ~ 006            | 热力图                       |
| 周四 | VIZ-007 + PAGE-005       | 桑基图 + 观看分析页          |
| 周五 | VIZ-008 ~ 010 + PAGE-004 | 其他图表 + 订阅页            |

**周末检查点**：所有核心图表能用真实数据渲染。

## Week 4：AI + 打磨 + 上线（20h）

| 日   | Ticket                         | 备注                      |
| ---- | ------------------------------ | ------------------------- |
| 周一 | AI-001 ~ 002                   | Claude 集成 + 频道分类    |
| 周二 | AI-003 ~ 005 + PAGE-008        | 画像 + 兴趣变迁 + 洞察页  |
| 周三 | PAGE-001 ~ 002 + SET-001 ~ 003 | 首页 + Demo + 设置        |
| 周四 | QA-001 ~ 004                   | 测试 + CI                 |
| 周五 | DEPLOY-001 ~ 005               | 上线 + README + Demo 视频 |

**周末检查点**：V1 正式上线，README + Live Demo 完成。

---

# V2 冲刺计划（4 周）

| 周     | 任务                                    |
| ------ | --------------------------------------- |
| Week 5 | V2-001 ~ 003：OAuth 扩展 + Drive 客户端 |
| Week 6 | V2-004 ~ 006：Cron + Inngest            |
| Week 7 | V2-007 ~ 008：通知系统                  |
| Week 8 | Polish + 文档 + 作品集页面更新          |

---

# 风险 Ticket（备用）

这些不是必需，但出问题时可能要单独开 ticket：

- TUB-RISK-001：watch-history 超过 10 万条时的性能优化
- TUB-RISK-002：Vercel 函数超时的备用方案（迁移到 Inngest）
- TUB-RISK-003：YouTube API 配额超限的降级策略
- TUB-RISK-004：AI 输出格式不稳定的兜底解析

---

# Ticket 模板（新增时使用）

```markdown
## TUB-<EPIC>-<NUM>: <标题>

| 字段       | 值                    |
| ---------- | --------------------- |
| Priority   | P0/P1/P2              |
| Estimate   | Xh                    |
| Phase      | V1/V2                 |
| Depends on | TUB-XXX               |
| Status     | TODO/IN_PROGRESS/DONE |

**描述**：

**Acceptance Criteria**：

- [ ]
- [ ]

**技术备注**：

**风险**：
```

---

**End of Ticket Document**
