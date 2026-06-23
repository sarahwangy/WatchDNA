# 我把自己三年的 YouTube 观看历史喂给了 AI，它说我有"深夜信息焦虑症"

**副标题：用 Vibe Coding 工作流构建 WatchDNA——从 Google Takeout 的混乱 HTML 到 Claude Haiku 给我的灵魂审判**

---

每个人都知道自己"很喜欢看 YouTube"。但你知道自己到底看了什么吗？多少时间花在了真正有价值的内容上，多少是在无意识地刷视频？

我不知道。直到我做了 WatchDNA。

这篇文章记录了我构建这个项目的完整过程——技术选型、踩坑经历、和 Claude Code 一起 Vibe Coding 的工作流，以及 AI 洞察功能最终给我呈现的那个让我坐在屏幕前沉默了五分钟的结论。

---

## 1. WatchDNA 是什么

**WatchDNA**（项目代号 Tubelens）是一个 YouTube 观看行为分析工具。你把从 Google Takeout 下载的 `.zip` 文件上传进去，它会解析你完整的观看历史、搜索记录、订阅列表，然后用 Claude Haiku 分析你的观看模式，生成交互式仪表盘和 AI 洞察报告。

- **Live Demo**：https://watch-dna.vercel.app
- **GitHub**：https://github.com/sarahwangy/WatchDNA

### 完整数据管道

```
用户上传 .zip
        │
        ▼
Vercel Blob 存储原始文件
        │
        ▼
JSZip 解压 → 提取 watch-history.html / CSV 文件
        │
        ▼
Cheerio 解析 HTML → PapaParse 解析 CSV
        │
        ▼
数据清洗 + 标准化（时区、去重、格式化）
        │
        ▼
Prisma v7 批量写入 PostgreSQL（Neon）
  WatchEvent / Channel / Video /
  Subscription / SearchEvent /
  Comment / LikedVideo / Playlist
        │
        ▼
聚合统计计算（按日/频道/时段分组）
        │
        ▼
Claude Haiku API 分析聚合数据
  → 狂刷模式识别
  → 话题聚类
  → 时间段习惯分析
  → 订阅 vs 实际观看不匹配
        │
        ▼
Insight 记录写回数据库
        │
        ▼
前端渲染
  日历热力图 / KPI 卡片 /
  频道排行 / AI 洞察卡片
```

这条管道从上传到 AI 洞察生成，通常在 30-60 秒内完成（取决于文件大小）。我的三年历史约 12,000 条观看记录，处理耗时约 45 秒。

---

## 2. 我为什么做这个

说实话，最初的动机挺自私的——我想知道我到底把多少时间花在了 YouTube 上，具体是花在什么内容上。

我知道自己会刷技术视频、刷 vlog、偶尔刷一些完全没有营养的"解说"视频。但"知道"和"看到数据"是两回事。

2025 年底，我正在学 Next.js，需要一个"真实项目"来练手，不是 To-do App，不是博客——我想做一个我自己真的会用的东西。

然后我想到了 Google Takeout。

Google 允许任何用户导出自己的完整数据，其中包括 YouTube 的观看历史、搜索历史、点赞视频、评论、订阅列表。文件是一个 `.zip`，里面有 HTML 和 CSV。这些数据静静躺在 Google 的服务器里，大多数人从来不碰它。

我想把它变成一面镜子。

---

## 3. 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| **框架** | Next.js 14 App Router + TypeScript | 全栈框架，SSR + API Routes |
| **数据库** | PostgreSQL（Neon） via Prisma v7 | 存储所有解析后的观看数据 |
| **AI 分析** | Claude Haiku（Anthropic） | 模式识别、话题聚类、行为洞察 |
| **文件解析** | JSZip + PapaParse + Cheerio | 解压 .zip、解析 CSV、解析 HTML |
| **文件存储** | Vercel Blob | 存储用户上传的原始 .zip 文件 |
| **认证** | NextAuth v4（Google OAuth） | 用户登录，隔离不同用户的数据 |
| **图表** | Recharts | 日历热力图、频道排行榜 |
| **UI** | Tailwind CSS + shadcn/ui | 组件库和样式系统 |
| **部署** | Vercel | 一键部署，Edge Functions |

选 Next.js 14 App Router 是因为它把前后端整合在一个项目里，API Routes 写起来很自然。选 Neon 是因为它是 Serverless PostgreSQL，和 Vercel 搭配完美，不用管服务器。Claude Haiku 是因为它速度快、成本低，适合处理大量聚合数据分析。

---

## 4. API 使用详解

### 4.1 Claude Haiku — 模式分析核心

模型：`claude-haiku-4-5`（Anthropic 最新 Haiku 版本）

我使用 Haiku 而不是 Sonnet 的原因很实际：洞察分析需要处理大量聚合数据，但任务本身是结构化的模式识别，Haiku 的速度和成本优势在这里非常明显。实测单次分析调用约 0.3-0.8 秒，成本控制在可接受范围内。

**调用方式**：批量聚合后单次调用，返回 JSON 结构化结果。

```typescript
// src/lib/ai/generate-insights.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateInsights(aggregatedData: AggregatedWatchData) {
  const prompt = `
你是一位专门分析 YouTube 观看行为的数据分析师。
请分析以下用户的观看数据，生成深度洞察。

## 观看数据摘要
- 总观看次数：${aggregatedData.totalWatches}
- 活跃天数：${aggregatedData.activeDays}
- 最常观看时段：${aggregatedData.peakHours.join(", ")}
- Top 10 频道：${aggregatedData.topChannels.map(c => `${c.name}(${c.count}次)`).join(", ")}
- 话题分布：${JSON.stringify(aggregatedData.topicDistribution)}
- 狂刷记录（单日>20条）：${aggregatedData.bingeDays.length} 天
- 订阅但从未看过的频道：${aggregatedData.subscribedNeverWatched.length} 个

## 请生成以下洞察（JSON 格式返回）：
{
  "binge_pattern": {
    "title": "狂刷模式分析",
    "description": "描述用户的狂刷行为模式",
    "severity": "low|medium|high",
    "insight": "具体的行为洞察"
  },
  "topic_clusters": {
    "title": "兴趣话题聚类",
    "clusters": [{"name": "话题名", "percentage": 数字, "description": "描述"}],
    "insight": "话题分布背后的行为特征"
  },
  "time_habits": {
    "title": "时间段习惯分析",
    "peak_description": "高峰时段描述",
    "insight": "时间习惯背后的生活方式洞察"
  },
  "subscription_gap": {
    "title": "订阅与观看不匹配",
    "count": 订阅但未看的频道数量,
    "insight": "这种不匹配说明了什么"
  }
}

请用中文回答，洞察要有深度，不要流于表面。`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  // 提取 JSON 内容
  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}
```

### 4.2 Vercel Blob — 原始文件存储

用户上传的 `.zip` 文件可能很大（我的三年历史约 50MB），不能直接放在 API Route 的内存里处理。Vercel Blob 提供了简洁的对象存储 API。

```typescript
// src/app/api/upload/route.ts（上传部分）
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // 上传到 Vercel Blob
  const blob = await put(`uploads/${userId}/${Date.now()}.zip`, file, {
    access: "private",
    contentType: "application/zip",
  });

  // 返回 blob URL，后续解析步骤使用
  return Response.json({ blobUrl: blob.url });
}
```

### 4.3 Prisma v7 + Neon PostgreSQL

Prisma v7 引入了更好的批量操作支持。我用 `createMany` 批量写入解析后的数据，在 12,000 条记录的情况下比逐条写入快了约 15 倍。

---

## 5. AI 技巧与实现

### 技巧 1：结构化 Prompt + JSON 强制输出

最大的坑是让 AI 输出可靠的 JSON。我踩过的错误方式：

- ❌ "请以 JSON 格式回答" — Claude 有时会在 JSON 前后加解释文字
- ✅ 在 prompt 里直接给出 JSON 模板，要求它填充内容

用正则 `/\{[\s\S]*\}/` 提取 JSON 块，再解析，比依赖 AI 输出纯 JSON 稳定得多。

### 技巧 2：聚合后再分析，不是原始数据喂给 AI

我最初的设计是把所有原始观看记录直接喂给 Claude。12,000 条记录……光 token 费用就能让我破产。

正确做法：先在数据库里聚合计算，只把**摘要数据**发给 AI。

```typescript
// 先聚合，再调用 AI
const aggregated = await db.$queryRaw`
  SELECT
    COUNT(*) as total_watches,
    COUNT(DISTINCT DATE(watched_at)) as active_days,
    EXTRACT(HOUR FROM watched_at) as hour,
    COUNT(*) as hour_count
  FROM watch_events
  WHERE user_id = ${userId}
  GROUP BY EXTRACT(HOUR FROM watched_at)
  ORDER BY hour_count DESC
  LIMIT 5
`;
// 把 aggregated 传给 AI，而不是 12000 条原始记录
```

这个改动让每次 AI 调用的 token 数从约 50,000 降到约 2,000。

### 技巧 3：Cheerio 解析 Google 的混乱 HTML

Google Takeout 的 `watch-history.html` 格式……怎么说，很有年代感。它不是机器友好的数据格式，它是给人类在浏览器里看的 HTML，每条记录是一个 `<div class="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1">`。

```typescript
// src/lib/parsers/watch-history-parser.ts
import * as cheerio from "cheerio";

export function parseWatchHistory(html: string): ParsedWatchEvent[] {
  const $ = cheerio.load(html);
  const events: ParsedWatchEvent[] = [];

  // Google Takeout HTML 的固定结构
  $(".content-cell.mdl-cell--6-col").each((_, element) => {
    const cell = $(element);

    // 视频链接在第一个 <a> 标签
    const videoLink = cell.find("a").first();
    const videoUrl = videoLink.attr("href") || "";
    const videoTitle = videoLink.text().trim();

    // 频道链接在第二个 <a> 标签
    const channelLink = cell.find("a").eq(1);
    const channelName = channelLink.text().trim();
    const channelUrl = channelLink.attr("href") || "";

    // 时间戳是 cell 里最后一段文本
    // 格式类似：2024年3月15日 上午11:42:30 UTC+8
    const cellText = cell.text();
    const timeMatch = cellText.match(
      /(\d{4}年\d{1,2}月\d{1,2}日\s+[上下]午\d{1,2}:\d{2}:\d{2}.*)/
    );

    if (!videoUrl.includes("youtube.com/watch")) return;

    const videoId = new URL(videoUrl).searchParams.get("v") || "";

    events.push({
      videoId,
      videoTitle,
      videoUrl,
      channelName,
      channelUrl,
      watchedAt: timeMatch ? parseChineseDate(timeMatch[1]) : new Date(),
    });
  });

  return events;
}
```

写这段代码的时候我心里有点崩溃。Google 用中文日期格式（"2024年3月15日 上午11:42:30"）存时间戳，然后还夹杂了 UTC 偏移量。我专门写了一个 `parseChineseDate` 函数来处理各种时区和格式变体。这大概是我在这个项目里写过的最繁琐的函数。

### 技巧 4：Promise.all 并行数据获取

仪表盘页需要同时加载 KPI 卡片、热力图数据、频道排行、最近活跃——四个独立查询。串行执行的话用户要等 4 次数据库往返。

```typescript
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // 四个查询并行执行，总耗时 = 最慢的那个，而不是四个之和
  const [kpiData, heatmapData, channelRanking, recentActivity] =
    await Promise.all([
      getKPIStats(session.user.id),
      getHeatmapData(session.user.id),
      getTopChannels(session.user.id, 10),
      getRecentActivity(session.user.id, 7),
    ]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <KPICards data={kpiData} />
      <CalendarHeatmap data={heatmapData} />
      <ChannelRanking data={channelRanking} />
      <RecentActivity data={recentActivity} />
    </div>
  );
}
```

这个模式在我的实测里把仪表盘首屏加载从约 1.2 秒降到约 0.4 秒。

### 技巧 5：Prisma Schema 设计——每个数据源对应一个 Model

Google Takeout 包含很多不同类型的数据，我给每种数据建了独立的 Model。

```prisma
// prisma/schema.prisma（核心 models）

model WatchEvent {
  id          String   @id @default(cuid())
  userId      String
  videoId     String
  videoTitle  String
  videoUrl    String
  channelName String
  channelUrl  String
  watchedAt   DateTime
  createdAt   DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  channel Channel? @relation(fields: [channelName], references: [name])

  @@index([userId, watchedAt])
  @@index([userId, channelName])
}

model Insight {
  id          String   @id @default(cuid())
  userId      String
  type        String   // "binge_pattern" | "topic_clusters" | "time_habits" | "subscription_gap"
  title       String
  description String
  severity    String?  // "low" | "medium" | "high"
  data        Json     // 存储完整的 AI 分析结果
  generatedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, type])
}

model Channel {
  id          String  @id @default(cuid())
  userId      String
  name        String
  url         String
  watchCount  Int     @default(0)
  isSubscribed Boolean @default(false)

  watchEvents WatchEvent[]

  @@unique([userId, name])
}
```

`@@index` 是个细节但很重要——按 `userId + watchedAt` 建复合索引，让按时间范围筛选的查询快了大约 10 倍。

### 技巧 6：进度追踪——SSE 实时推送解析状态

文件解析需要 30-60 秒，如果用户看着空白页等，体验很差。我用 Server-Sent Events 实时推送进度。

```typescript
// src/app/api/parse/route.ts（简化版）
export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      send({ stage: "unzipping", progress: 10, message: "正在解压文件..." });
      await unzipFile(blobUrl);

      send({ stage: "parsing", progress: 30, message: "解析观看历史..." });
      const events = await parseWatchHistory(htmlContent);

      send({ stage: "saving", progress: 60, message: `写入 ${events.length} 条记录...` });
      await saveToDatabase(events, userId);

      send({ stage: "analyzing", progress: 85, message: "Claude 正在分析..." });
      await generateInsights(userId);

      send({ stage: "done", progress: 100, message: "分析完成！" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

---

## 6. Vibe Coding 过程——和 Claude Code 一起构建

这个项目我全程用了 Claude Code 的 Vibe Coding 工作流，说说具体是怎么工作的。

### 6.1 `superpowers:brainstorming` — 开始前先想清楚

每个新功能开始之前，我不直接写代码，而是先用 `brainstorming` skill 和 Claude 讨论：这个功能的核心是什么？用户真正需要什么？有哪些实现方式？各有什么取舍？

比如在设计 AI 洞察功能时，我们讨论了：
- 是每次用户访问都调用 Claude，还是缓存结果？
- 缓存的话，什么时候触发重新分析？
- 洞察结果要存在数据库里还是每次动态生成？

这 15 分钟的讨论避免了我后来可能花数小时重构的架构决策失误。

### 6.2 `superpowers:writing-plans` — 带文件路径的实现计划

每个功能我都让 Claude 生成一份实现计划，格式是具体到文件路径的步骤列表：

```
## AI 洞察功能实现计划

1. 创建 `src/lib/ai/aggregate-data.ts`
   - 函数：getAggregatedWatchData(userId)
   - 从 DB 聚合 top channels、hour distribution、binge days

2. 创建 `src/lib/ai/generate-insights.ts`
   - 函数：generateInsights(aggregatedData)
   - 调用 Claude Haiku API
   - 返回结构化 Insight 数组

3. 修改 `prisma/schema.prisma`
   - 添加 Insight model

4. 创建 `src/app/api/insights/generate/route.ts`
   - POST endpoint
   - 检查是否已有缓存 insight（24小时内）
   - 没有则调用 generateInsights

5. 创建 `src/app/insights/page.tsx`
   - 展示 InsightCard 组件
```

这个计划让我知道每一步改什么文件，不会写到一半迷路。

### 6.3 `superpowers:subagent-driven-development` — 独立任务交给独立 Agent

比较独立的功能——比如 Cheerio 解析器、Prisma schema 设计、Recharts 热力图组件——我会作为独立任务交给 subagent 处理。每个 subagent 专注一件事，完成后我审查质量再合并。

这个工作流最大的好处是：每个任务的 context 干净，AI 不会被前一个任务的细节干扰。

### 6.4 `superpowers:systematic-debugging` — 根因分析而不是乱试

Cheerio 解析器上线后，我发现有约 3% 的记录时间戳解析失败。传统 debug 可能是直接改正则，但 `systematic-debugging` skill 引导我先找根因：

1. 收集失败案例样本
2. 分析失败模式（发现是英文日期格式 vs 中文日期格式的问题）
3. 确认根因（Google Takeout 对不同地区账号输出不同语言的日期格式）
4. 才写修复方案

最终修复是支持多语言日期格式，而不是修那个正则——更根本的解决方案。

### 6.5 `superpowers:verification-before-completion` — 完成前真正验证

这个 skill 让我在认为功能"写完了"之前，用真实数据做端到端验证。

最典型的例子：我的进度条组件在本地跑了十几秒，我以为这是正常的网络延迟。`verification` 检查发现进度推送到 `60%` 就卡住了——原来是批量写入 12,000 条记录时，单次 `createMany` 超过了 Neon Serverless 的连接超时。

修复：把批量写入改成 500 条一批的分批处理。

---

## 7. 页面功能介绍

### 导入页

上传 `.zip` 文件的入口。拖拽或点击上传，文件上传后立即开始解析，SSE 实时显示进度（解压 → 解析 → 写入数据库 → AI 分析 → 完成）。支持查看解析统计：共解析到多少条观看记录、多少个频道、数据时间跨度。

### 仪表盘

主视图。顶部四个 KPI 卡片：总观看次数、活跃天数、最爱频道、高峰观看时段。中间是日历热力图——每天的观看密度用颜色深浅表示，一眼就能看出哪些时期"重度使用"。右侧是频道排行榜 Top 10。

看到热力图的第一眼我愣了一下。2024 年 1 月有一片非常深的红色——那是我失业的那个月，每天看十几个小时 YouTube。数据不会骗人。

### 洞察页

AI 分析结果的展示。四种洞察类型以卡片形式排列：狂刷模式分析、兴趣话题聚类、时间段习惯分析、订阅与观看不匹配。每张卡片有标题、描述、严重程度标签（低/中/高），以及 Claude 生成的具体洞察文字。

### 探索器

浏览所有视频和频道的界面。支持按频道筛选、按时间范围筛选、关键词搜索。可以翻看自己某个时期到底看了什么——有点像在翻旧日记。

### 设置

管理账号、删除数据、重新触发 AI 分析。如果数据库里已有洞察记录，设置页会显示上次分析时间，允许手动刷新（比如上传了更多数据之后）。

---

## 8. AI 洞察功能如何运作——逐步拆解

这是整个项目里我最骄傲的功能，也是最花时间设计的部分。让我一步步拆解它。

### Step 1：触发时机

用户上传文件解析完成后，系统自动触发一次 AI 分析。用户也可以在设置页手动重新触发。分析结果缓存 24 小时，避免重复计费。

### Step 2：数据聚合

在调用 Claude 之前，我先在数据库里做好聚合计算：

```typescript
async function getAggregatedWatchData(userId: string): Promise<AggregatedData> {
  const [totalCount, channelStats, hourDistribution, bingeDays, subGap] =
    await Promise.all([
      // 总观看次数
      db.watchEvent.count({ where: { userId } }),

      // 频道观看次数 Top 20
      db.watchEvent.groupBy({
        by: ["channelName"],
        where: { userId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 20,
      }),

      // 按小时分布
      db.$queryRaw<{ hour: number; count: number }[]>`
        SELECT EXTRACT(HOUR FROM watched_at)::int as hour,
               COUNT(*)::int as count
        FROM watch_events
        WHERE user_id = ${userId}
        GROUP BY hour
        ORDER BY count DESC
      `,

      // 狂刷日（单日观看 > 20 条）
      db.$queryRaw<{ date: string; count: number }[]>`
        SELECT DATE(watched_at) as date,
               COUNT(*)::int as count
        FROM watch_events
        WHERE user_id = ${userId}
        GROUP BY date
        HAVING COUNT(*) > 20
        ORDER BY count DESC
      `,

      // 订阅但从未观看的频道
      db.channel.findMany({
        where: { userId, isSubscribed: true, watchCount: 0 },
      }),
    ]);

  return { totalCount, channelStats, hourDistribution, bingeDays, subGap };
}
```

### Step 3：构建 Prompt

把聚合数据格式化成 Claude 能够理解的文字描述，然后明确告诉它要分析什么、输出什么格式（见上面技巧 1 的代码）。

### Step 4：解析 AI 输出并写入数据库

```typescript
async function saveInsights(userId: string, aiResult: AIInsightResult) {
  // 删除旧的洞察记录
  await db.insight.deleteMany({ where: { userId } });

  // 写入新的洞察记录
  const insights = Object.entries(aiResult).map(([type, data]) => ({
    userId,
    type,
    title: data.title,
    description: data.description || data.insight,
    severity: data.severity || null,
    data: data as unknown as Prisma.JsonObject,
  }));

  await db.insight.createMany({ data: insights });
}
```

### Step 5：真实的分析结果

以我自己的数据为例，Claude 给出的洞察包括：

**狂刷模式**（严重程度：高）
> "在过去三年中检测到 47 个狂刷日，其中 2024 年 1 月集中出现 12 次。单日最高观看量为 89 条视频。这种集中式高强度观看通常与情绪调节行为相关——内容本身可能并非首要目的。"

**时间段习惯**
> "高峰观看集中在晚上 11 点到凌晨 1 点（占总观看量的 31%）。结合话题分布（科技/教程类在下午高峰，娱乐/解说类在深夜高峰），观察到典型的'深夜放松补偿'模式。"

**订阅与观看不匹配**
> "共有 34 个频道被订阅但从未实际观看。这表明存在'信息焦虑性订阅'——订阅的目的可能更多是标记'我应该看'而不是真正的兴趣。"

"信息焦虑性订阅"——我盯着这四个字看了很久。

我没有告诉 Claude 这个词，它自己造了这个概念来描述我的行为，而且……准确得让人不舒服。

这就是我坐在屏幕前沉默了五分钟的那个时刻。

---

## 9. 我学到了什么

### 技术层面

**数据管道比 AI 更难**。我以为这个项目最难的部分是 AI 集成，但实际上最费时间的是 Cheerio 解析和数据清洗。Google 的 HTML 格式在不同时期的导出版本有细微差别，时区处理、编码问题、重复记录……这些"脏活"占了整个项目 40% 的开发时间。

**Promise.all 是习惯问题，不是优化问题**。并行数据获取不应该是"优化"，而应该是默认写法。在写每个需要多个数据源的页面时，先想"这些查询有没有依赖关系"，没有依赖就并行。

**AI Prompt 要给模板，不要给指令**。最稳定的 AI 输出方式是给它一个填空题，而不是让它自由发挥格式。结构化 JSON 模板 + 正则提取，比依赖 AI 自律输出纯 JSON 稳定得多。

**聚合 > 原始数据**。永远不要把原始数据喂给 AI。先聚合，提取关键特征，再分析。这既省钱，输出质量往往也更好——AI 能专注在模式上，而不是被数据量淹没。

### 工程层面

**Vibe Coding 工作流真的有效**。`brainstorming → writing-plans → subagent-driven-development → verification` 这个链条，让我在相对不熟悉的技术栈（Next.js App Router 是我第一次用）里，以比我预期快 2 倍的速度完成了这个项目。

关键不是 AI 替你写代码，而是 AI 帮你在开始写代码之前想清楚要写什么，帮你在认为写完之后真正验证它能不能跑。

**SSE 比轮询优雅得多**。进度追踪这个功能我一开始打算用轮询，每 2 秒请求一次解析状态。`writing-plans` 阶段 Claude 建议改用 SSE，实现不复杂，用户体验好很多——进度是流式推送的，而不是跳跃的。

### 个人层面

做这个项目最意外的收获，不是技术上学到了什么，而是真的改变了我用 YouTube 的方式。

看到热力图上 2024 年 1 月那片红色，看到 AI 说"信息焦虑性订阅"，看到我 31% 的观看量集中在深夜……这些数据让我第一次真正意识到，我和 YouTube 的关系里有多少是"选择"，有多少是"逃避"。

数据可以是一面很诚实的镜子。

---

**如果你想试试 WatchDNA：**
- Live Demo：https://watch-dna.vercel.app
- 你的 Google Takeout 数据可以在 takeout.google.com 申请，选择 YouTube 数据导出即可
- GitHub（如果你想看代码或 star）：https://github.com/sarahwangy/WatchDNA

如果你跑完分析，欢迎在评论区告诉我 Claude 给你的洞察里有没有让你沉默的那一句。

---

*这篇文章是我 Vibe Coding 系列的一部分，记录用 Claude Code 工作流构建真实项目的经历。下一篇我会写如何用 AI 分析 Spotify 历史——同样是"把自己的数据喂给镜子"的故事。*
