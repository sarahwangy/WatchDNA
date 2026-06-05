# Week 4 AI + 上线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 集成 Claude API 生成 AI 洞察、构建 AI 洞察页、首页、Demo 页和设置页，完成 V1 上线。

**Architecture:** Claude Haiku 处理频道分类和观众画像生成，结果缓存在 Insight/Channel 表避免重复调用。首页是纯静态 Landing Page，Demo 页读取预置的假数据用户。设置页提供账号管理和数据清空功能。

**Tech Stack:** `@anthropic-ai/sdk`（Claude API）、Next.js Server Components、Prisma、shadcn/ui

---

## 文件结构

```
src/
├── app/
│   ├── page.tsx                    ← 首页（Landing Page）
│   ├── insights/page.tsx           ← AI 洞察页
│   ├── settings/
│   │   ├── page.tsx                ← 设置主页（重定向到 account）
│   │   └── account/page.tsx        ← 账号管理
│   └── api/
│       └── insights/
│           ├── generate/route.ts   ← 触发 AI 生成
│           └── route.ts            ← 查询已有洞察
├── lib/
│   ├── claude.ts                   ← Claude API 客户端封装
│   └── ai/
│       ├── classify-channels.ts    ← 频道分类逻辑
│       └── generate-insights.ts    ← 观众画像/兴趣变迁生成
└── components/
    └── insights/
        ├── viewer-profile.tsx      ← 观众画像卡片
        └── unsubscribe-list.tsx    ← 建议取消订阅列表
```

---

## Task 1：集成 Claude API SDK（TUB-AI-001）

**Files:**

- Create: `src/lib/claude.ts`

- [ ] **Step 1: 安装 SDK**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npm install @anthropic-ai/sdk
```

- [ ] **Step 2: 创建 Claude 客户端**

创建 `src/lib/claude.ts`：

```typescript
// Anthropic SDK 封装，使用单例模式避免重复创建客户端
import Anthropic from '@anthropic-ai/sdk';

// 行业标准：全局单例，防止每次请求都创建新客户端
const globalForClaude = global as unknown as { claude: Anthropic };

export const claude =
  globalForClaude.claude ||
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

if (process.env.NODE_ENV !== 'production') globalForClaude.claude = claude;

// 便捷函数：调用 Claude Haiku（最便宜的模型）生成文本
// Haiku 定价约 $0.25/百万 tokens，适合批量分类任务
export async function askClaude(prompt: string): Promise<string> {
  const message = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  return content.text;
}
```

- [ ] **Step 3: 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -5
```

Expected: 零错误

- [ ] **Step 4: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/lib/claude.ts tubelens/package.json tubelens/package-lock.json
git commit -m "feat: add Claude API SDK client singleton (TUB-AI-001)"
git push
```

---

## Task 2：频道分类逻辑（TUB-AI-002）

**Files:**

- Create: `src/lib/ai/classify-channels.ts`
- Create: `src/app/api/ai/classify/route.ts`

- [ ] **Step 1: 创建频道分类函数**

创建 `src/lib/ai/classify-channels.ts`：

```typescript
// 用 Claude Haiku 给频道分配分类和标签
// 每次发送 10 个频道，一次 prompt 批量处理，节省 token
import { askClaude } from '@/lib/claude';
import { db } from '@/lib/db';

const VALID_CATEGORIES = [
  'Tech',
  'Music',
  'Gaming',
  'Education',
  'News',
  'Entertainment',
  'Lifestyle',
  'Sports',
  'Science',
  'Art',
  'Other',
];

interface ChannelToClassify {
  id: string;
  title: string;
  description: string | null;
}

interface ClassifyResult {
  channelId: string;
  category: string;
  tags: string[];
}

export async function classifyChannels(channels: ChannelToClassify[]): Promise<ClassifyResult[]> {
  if (channels.length === 0) return [];

  // 把多个频道打包进一个 prompt，减少 API 调用次数
  const channelList = channels
    .map(
      (c, i) =>
        `${i + 1}. Title: "${c.title}" | Description: "${(c.description || '').slice(0, 100)}"`
    )
    .join('\n');

  const prompt = `Classify these YouTube channels. For each channel, provide:
1. One main category (must be exactly one of: ${VALID_CATEGORIES.join(', ')})
2. 3-5 tags (lowercase, comma-separated)

Channels:
${channelList}

Respond in JSON format only, no explanation:
[{"index": 1, "category": "Tech", "tags": ["programming", "tutorials"]}, ...]`;

  const response = await askClaude(prompt);

  // 解析 JSON，提取分类结果
  // 用正则匹配 JSON 数组，防止 Claude 在 JSON 前后加了文字说明
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid AI response format');

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    index: number;
    category: string;
    tags: string[];
  }>;

  return parsed.map((item) => {
    const channel = channels[item.index - 1];
    const category = VALID_CATEGORIES.includes(item.category) ? item.category : 'Other';
    return {
      channelId: channel.id,
      category,
      tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : [],
    };
  });
}

export async function classifyUserChannels(userId: string): Promise<number> {
  // 找出还没有 AI 分类的频道
  const channels = await db.channel.findMany({
    where: {
      subscriptions: { some: { userId } },
      aiCategory: null,
      title: { not: '' },
    },
    select: { id: true, title: true, description: true },
    take: 100, // 单次处理上限
  });

  if (channels.length === 0) return 0;

  let classified = 0;
  // 每批 10 个频道
  for (let i = 0; i < channels.length; i += 10) {
    const batch = channels.slice(i, i + 10);
    try {
      const results = await classifyChannels(batch);
      // 批量更新数据库
      await db.$transaction(
        results.map((r) =>
          db.channel.update({
            where: { id: r.channelId },
            data: { aiCategory: r.category, aiTags: r.tags },
          })
        )
      );
      classified += results.length;
    } catch (err) {
      console.error('Classification batch failed:', err);
      // 单批失败不影响其他批次
    }
  }

  return classified;
}
```

- [ ] **Step 2: 创建分类触发 API**

创建 `src/app/api/ai/classify/route.ts`：

```typescript
import { requireUser } from '@/lib/auth';
import { classifyUserChannels } from '@/lib/ai/classify-channels';

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  const classified = await classifyUserChannels(user!.id);
  return Response.json({ classified });
}
```

- [ ] **Step 3: 验证**

```bash
npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 4: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/lib/ai/ tubelens/src/app/api/ai/
git commit -m "feat: add channel classification with Claude Haiku (TUB-AI-002)"
git push
```

---

## Task 3：观众画像 + 兴趣变迁 + 取消订阅建议（TUB-AI-003,004,005）

**Files:**

- Create: `src/lib/ai/generate-insights.ts`
- Create: `src/app/api/insights/generate/route.ts`
- Create: `src/app/api/insights/route.ts`

- [ ] **Step 1: 创建 AI 洞察生成逻辑**

创建 `src/lib/ai/generate-insights.ts`：

```typescript
import { askClaude } from '@/lib/claude';
import { db } from '@/lib/db';

// ——— 观众画像 ———

export async function generateViewerProfile(userId: string): Promise<string> {
  // 收集用户数据摘要作为 prompt 输入
  const [subCount, watchCount, topChannels, categories] = await Promise.all([
    db.subscription.count({ where: { userId } }),
    db.watchEvent.count({ where: { userId } }),
    db.watchEvent.groupBy({
      by: ['channelId'],
      where: { userId, channelId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    db.channel.groupBy({
      by: ['aiCategory'],
      where: {
        subscriptions: { some: { userId } },
        aiCategory: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const topChannelIds = topChannels.map((c) => c.channelId!).filter(Boolean);
  const channelNames = await db.channel.findMany({
    where: { id: { in: topChannelIds } },
    select: { id: true, title: true },
  });
  const nameMap = new Map(channelNames.map((c) => [c.id, c.title]));

  const topChannelStr = topChannels
    .map((c) => `${nameMap.get(c.channelId!) || 'Unknown'} (${c._count.id} views)`)
    .join(', ');

  const categoryStr = categories.map((c) => `${c.aiCategory} (${c._count.id} channels)`).join(', ');

  const prompt = `You are analyzing a YouTube viewer's habits. Generate a 150-200 word personal profile in Chinese that feels insightful and personal.

Data:
- Total subscriptions: ${subCount} channels
- Total watch events: ${watchCount}
- Top channels: ${topChannelStr || 'No data yet'}
- Content categories: ${categoryStr || 'No data yet'}

Write a profile that:
1. Describes their viewing personality (e.g., "深夜型科技爱好者")
2. Notes their top interests and content preferences
3. Highlights any interesting patterns
4. Ends with 3-5 personality tags like #标签

Be specific and insightful, not generic. Write in Chinese.`;

  return askClaude(prompt);
}

// ——— 兴趣变迁 ———

export async function generateInterestShift(userId: string): Promise<string> {
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const [recentCategories, olderCategories] = await Promise.all([
    // 近 6 个月
    db.watchEvent.findMany({
      where: { userId, watchedAt: { gte: sixMonthsAgo } },
      include: { channel: { select: { aiCategory: true } } },
    }),
    // 6 个月前
    db.watchEvent.findMany({
      where: { userId, watchedAt: { lt: sixMonthsAgo } },
      include: { channel: { select: { aiCategory: true } } },
    }),
  ]);

  const countCategories = (events: typeof recentCategories) => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      const cat = e.channel?.aiCategory || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([cat, count]) => `${cat}: ${Math.round((count / total) * 100)}%`)
      .sort()
      .join(', ');
  };

  if (recentCategories.length === 0 && olderCategories.length === 0) {
    return '数据不足，无法生成兴趣变迁分析。请上传更多观看历史数据。';
  }

  const prompt = `Analyze this YouTube viewer's interest shift over time. Write 100-150 words in Chinese.

Past (before 6 months): ${countCategories(olderCategories) || 'No data'}
Recent (last 6 months): ${countCategories(recentCategories) || 'No data'}

Describe what changed, what stayed the same, and what this might mean about their evolving interests. Be specific about the numbers.`;

  return askClaude(prompt);
}

// ——— 建议取消订阅（纯 SQL，不需要 AI）———

export async function getUnsubscribeSuggestions(userId: string) {
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  // 找出已订阅但 6 个月内没有观看记录的频道
  const watchedChannels = await db.watchEvent.findMany({
    where: { userId, watchedAt: { gte: sixMonthsAgo }, channelId: { not: null } },
    select: { channelId: true },
    distinct: ['channelId'],
  });

  const watchedIds = new Set(watchedChannels.map((w) => w.channelId!));

  const allSubs = await db.subscription.findMany({
    where: { userId },
    include: {
      channel: { select: { id: true, title: true, thumbnailUrl: true, subscriberCount: true } },
    },
  });

  return allSubs
    .filter((s) => !watchedIds.has(s.channelId))
    .map((s) => s.channel)
    .slice(0, 20); // 最多展示 20 个建议
}
```

- [ ] **Step 2: 创建洞察生成 API**

创建 `src/app/api/insights/generate/route.ts`：

```typescript
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  generateViewerProfile,
  generateInterestShift,
  classifyUserChannels,
} from '@/lib/ai/generate-insights';
import { classifyUserChannels as doClassify } from '@/lib/ai/classify-channels';

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  const userId = user!.id;

  try {
    // 先确保频道有分类（画像生成需要用到分类数据）
    await doClassify(userId);

    // 并行生成两个 AI 洞察
    const [profile, interestShift] = await Promise.all([
      generateViewerProfile(userId),
      generateInterestShift(userId),
    ]);

    // 存入 Insight 表，30 天内不重新生成
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.$transaction([
      db.insight.upsert({
        where: { userId_type: { userId, type: 'viewer_profile' } },
        update: { content: profile, generatedAt: new Date(), validUntil },
        create: { userId, type: 'viewer_profile', content: profile, validUntil },
      }),
      db.insight.upsert({
        where: { userId_type: { userId, type: 'interest_shift' } },
        update: { content: interestShift, generatedAt: new Date(), validUntil },
        create: { userId, type: 'interest_shift', content: interestShift, validUntil },
      }),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
```

**注意**：上面的 `upsert` 用了 `userId_type` 复合唯一键。需要在 Prisma Schema 的 Insight model 添加：`@@unique([userId, type])`。先检查是否已有，如果没有则更新 schema 并 migrate。

检查：

```bash
grep -A 5 "model Insight" /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens/prisma/schema.prisma | tail -5
```

如果 Insight 没有 `@@unique([userId, type])`，在 model 末尾添加，然后：

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx prisma migrate dev --name add-insight-unique
```

如果已有，跳过。

- [ ] **Step 3: 创建洞察查询 API**

创建 `src/app/api/insights/route.ts`：

```typescript
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUnsubscribeSuggestions } from '@/lib/ai/generate-insights';

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const userId = user!.id;

  const [insights, unsubscribeSuggestions] = await Promise.all([
    db.insight.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    }),
    getUnsubscribeSuggestions(userId),
  ]);

  const insightMap = Object.fromEntries(insights.map((i) => [i.type, i.content]));

  return Response.json({
    viewerProfile: insightMap['viewer_profile'] || null,
    interestShift: insightMap['interest_shift'] || null,
    unsubscribeSuggestions,
    hasInsights: insights.length > 0,
  });
}
```

- [ ] **Step 4: 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Step 5: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/ tubelens/prisma/
git commit -m "feat: add viewer profile, interest shift, unsubscribe suggestions (TUB-AI-003,004,005)"
git push
```

---

## Task 4：AI 洞察页（TUB-PAGE-008）

**Files:**

- Create: `src/components/insights/viewer-profile.tsx`
- Create: `src/components/insights/unsubscribe-list.tsx`
- Create: `src/app/insights/page.tsx`

- [ ] **Step 1: 创建观众画像卡片**

创建 `src/components/insights/viewer-profile.tsx`：

```tsx
'use client';

import { useState } from 'react';

interface ViewerProfileProps {
  profile: string | null;
  interestShift: string | null;
  onRegenerate: () => Promise<void>;
}

export function ViewerProfile({ profile, interestShift, onRegenerate }: ViewerProfileProps) {
  const [loading, setLoading] = useState(false);

  async function handleRegenerate() {
    setLoading(true);
    try {
      await onRegenerate();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 观众画像卡片 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="font-semibold text-white">你的 YouTube 画像</h3>
            <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">
              AI 生成
            </span>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="text-xs text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading ? '生成中...' : '重新生成 ↺'}
          </button>
        </div>

        {profile ? (
          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{profile}</p>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm mb-3">还没有 AI 画像</p>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '分析中...' : '生成我的 YouTube 画像'}
            </button>
          </div>
        )}
      </div>

      {/* 兴趣变迁卡片 */}
      {interestShift && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📈</span>
            <h3 className="font-semibold text-white">兴趣变迁分析</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{interestShift}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建取消订阅建议列表**

创建 `src/components/insights/unsubscribe-list.tsx`：

```tsx
interface Channel {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: bigint | null;
}

interface UnsubscribeListProps {
  channels: Channel[];
}

export function UnsubscribeList({ channels }: UnsubscribeListProps) {
  if (channels.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
        <span className="text-2xl">🎉</span>
        <p className="text-white font-medium mt-2">你的订阅都很活跃！</p>
        <p className="text-zinc-400 text-sm mt-1">没有需要清理的频道</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🧹</span>
          <h3 className="font-semibold text-white">建议取消订阅</h3>
        </div>
        <span className="text-xs text-zinc-500">6 个月内零观看</span>
      </div>
      <div className="divide-y divide-zinc-800">
        {channels.map((ch) => (
          <div key={ch.id} className="flex items-center gap-3 px-6 py-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden shrink-0">
              {ch.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ch.thumbnailUrl} alt={ch.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{ch.title}</p>
              {ch.subscriberCount && (
                <p className="text-xs text-zinc-500">
                  {Number(ch.subscriberCount).toLocaleString()} 订阅者
                </p>
              )}
            </div>
            <a
              href={`https://www.youtube.com/channel/${ch.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-400 hover:text-red-300 shrink-0"
            >
              去取消 →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 AI 洞察页**

创建 `src/app/insights/page.tsx`：

```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { InsightsClient } from '@/components/insights/insights-client';
import { db } from '@/lib/db';
import { getUnsubscribeSuggestions } from '@/lib/ai/generate-insights';

export default async function InsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as { id: string }).id;

  const [insights, unsubscribeSuggestions] = await Promise.all([
    db.insight.findMany({ where: { userId }, orderBy: { generatedAt: 'desc' } }),
    getUnsubscribeSuggestions(userId),
  ]);

  const insightMap = Object.fromEntries(insights.map((i) => [i.type, i.content]));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI 洞察</h1>
          <p className="text-zinc-400 text-sm mt-1">由 Claude AI 生成的个性化分析</p>
        </div>
        <InsightsClient
          initialProfile={insightMap['viewer_profile'] || null}
          initialInterestShift={insightMap['interest_shift'] || null}
          unsubscribeSuggestions={unsubscribeSuggestions}
        />
      </div>
    </DashboardLayout>
  );
}
```

创建 `src/components/insights/insights-client.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ViewerProfile } from './viewer-profile';
import { UnsubscribeList } from './unsubscribe-list';

interface InsightsClientProps {
  initialProfile: string | null;
  initialInterestShift: string | null;
  unsubscribeSuggestions: Array<{
    id: string;
    title: string;
    thumbnailUrl: string | null;
    subscriberCount: bigint | null;
  }>;
}

export function InsightsClient({
  initialProfile,
  initialInterestShift,
  unsubscribeSuggestions,
}: InsightsClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [interestShift, setInterestShift] = useState(initialInterestShift);

  async function handleRegenerate() {
    const res = await fetch('/api/insights/generate', { method: 'POST' });
    if (!res.ok) throw new Error('Generation failed');
    // 刷新页面获取最新数据
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <ViewerProfile
        profile={profile}
        interestShift={interestShift}
        onRegenerate={handleRegenerate}
      />
      <UnsubscribeList channels={unsubscribeSuggestions} />
    </div>
  );
}
```

- [ ] **Step 4: 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -10
npm run build 2>&1 | grep -E "error|✓|Compiled" | head -5
```

- [ ] **Step 5: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/
git commit -m "feat: build AI insights page with viewer profile and unsubscribe suggestions (TUB-PAGE-008)"
git push
```

---

## Task 5：首页 Landing Page（TUB-PAGE-001）

**Files:**

- Modify: `src/app/page.tsx`

- [ ] **Step 1: 替换首页**

完整替换 `src/app/page.tsx`：

```tsx
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  // 已登录用户直接跳转 dashboard
  const session = await getServerSession(authOptions);
  if (session?.user) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-zinc-950/80 backdrop-blur border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-red-500">●</span>
          <span className="font-bold text-lg">Tubelens</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/login"
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-8 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-400 mb-8">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          基于 Google Takeout 数据分析
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          You watch differently
          <br />
          <span className="text-red-500">than you think you do.</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          上传你的 Google Takeout 数据，Tubelens 帮你看清真实的 YouTube
          习惯——订阅了什么、真正在看什么、AI 为你生成个人画像。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            上传我的数据 →
          </Link>
          <a
            href="https://takeout.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white text-sm underline transition-colors"
          >
            如何导出 Takeout？
          </a>
        </div>
      </section>

      {/* 功能亮点 */}
      <section className="py-20 px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: '📊',
              title: '订阅 vs 实际观看',
              desc: '847 个订阅，但 80% 时间只花在 23 个频道上——看清你真正的偏好',
            },
            {
              icon: '🕐',
              title: '观看时段热力图',
              desc: '你是深夜型还是早鸟型？24h×7d 热力图揭露你的真实习惯',
            },
            {
              icon: '🤖',
              title: 'AI 个人画像',
              desc: 'Claude AI 基于你的全量数据，生成专属的 YouTube 观看者画像',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-colors"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 工作原理 */}
      <section className="py-20 px-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">三步开始分析</h2>
        <div className="space-y-6">
          {[
            {
              step: '01',
              title: '导出 Google Takeout',
              desc: '去 takeout.google.com，选择 YouTube 数据导出为 zip',
            },
            {
              step: '02',
              title: '上传到 Tubelens',
              desc: '把下载的 zip 文件拖拽上传，系统自动解析（1-3分钟）',
            },
            {
              step: '03',
              title: '查看你的报告',
              desc: 'Dashboard 展示热力图、排行榜，AI 生成个人画像',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-6 items-start">
              <div className="text-red-500 font-mono text-2xl font-bold w-12 shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 隐私承诺 */}
      <section className="py-12 px-8 max-w-2xl mx-auto text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <span className="text-green-400 text-2xl">🔒</span>
          <h3 className="font-semibold text-white mt-3 mb-2">你的数据只属于你</h3>
          <p className="text-zinc-400 text-sm">
            数据存储在你的账号下，不会与任何第三方共享。支持一键删除所有数据。
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-zinc-900 text-center text-zinc-500 text-sm">
        <p>
          Tubelens · 由 Next.js + Claude AI 构建 ·{' '}
          <a
            href="https://github.com/sarahwangy/WatchDNA"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
```

- [ ] **Step 2: 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/app/page.tsx
git commit -m "feat: build landing page (TUB-PAGE-001)"
git push
```

---

## Task 6：设置页（TUB-SET-001 + TUB-SET-003）

**Files:**

- Create: `src/app/settings/page.tsx`
- Create: `src/app/settings/account/page.tsx`
- Create: `src/app/api/user/delete/route.ts`

- [ ] **Step 1: 创建账号管理页**

创建 `src/app/settings/account/page.tsx`：

```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AccountSettings } from '@/components/settings/account-settings';
import { db } from '@/lib/db';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as { id: string }).id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, image: true, createdAt: true },
  });

  if (!user) redirect('/login');

  return (
    <DashboardLayout>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">账号设置</h1>
          <p className="text-zinc-400 text-sm mt-1">管理你的账号和数据</p>
        </div>
        <AccountSettings user={{ ...user, createdAt: user.createdAt.toISOString() }} />
      </div>
    </DashboardLayout>
  );
}
```

创建 `src/components/settings/account-settings.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

interface AccountSettingsProps {
  user: {
    email: string | null;
    name: string | null;
    image: string | null;
    createdAt: string;
  };
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      if (res.ok) {
        await signOut({ callbackUrl: '/' });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 用户信息 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">账号信息</h3>
        <div className="flex items-center gap-4 mb-4">
          {user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="avatar" className="w-12 h-12 rounded-full" />
          )}
          <div>
            <p className="font-medium text-white">{user.name || '—'}</p>
            <p className="text-sm text-zinc-400">{user.email}</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </div>

      {/* 危险区：删除账号 */}
      <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-sm font-medium text-red-400 mb-2">危险区</h3>
        <p className="text-zinc-400 text-sm mb-4">
          删除账号将永久清除你的所有数据，包括观看历史、订阅记录和 AI 洞察。此操作不可撤销。
        </p>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-sm text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            删除账号
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400 font-medium">确定要删除所有数据吗？</p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm text-zinc-400 hover:text-white px-4 py-2 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建删除账号 API**

创建 `src/app/api/user/delete/route.ts`：

```typescript
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE() {
  const { user, error } = await requireUser();
  if (error) return error;

  const userId = user!.id;

  // 按依赖顺序删除，防止外键约束报错
  await db.$transaction([
    db.watchEvent.deleteMany({ where: { userId } }),
    db.searchEvent.deleteMany({ where: { userId } }),
    db.comment.deleteMany({ where: { userId } }),
    db.likedVideo.deleteMany({ where: { userId } }),
    db.playlistItem.deleteMany({ where: { playlist: { userId } } }),
    db.playlist.deleteMany({ where: { userId } }),
    db.subscription.deleteMany({ where: { userId } }),
    db.takeoutFile.deleteMany({ where: { userId } }),
    db.insight.deleteMany({ where: { userId } }),
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);

  return Response.json({ success: true });
}
```

- [ ] **Step 3: 创建设置主页（重定向）**

创建 `src/app/settings/page.tsx`：

```tsx
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/settings/account');
}
```

- [ ] **Step 4: 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -10
npm run build 2>&1 | grep -E "error|✓|Compiled" | head -5
```

- [ ] **Step 5: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/
git commit -m "feat: add settings and account management pages (TUB-SET-001, TUB-SET-003)"
git push
```

---

## Week 4 完成标准

完成以上 6 个 Task 后：

- ✅ Claude API 集成，频道自动分类
- ✅ AI 观众画像和兴趣变迁报告
- ✅ 建议取消订阅清单（纯 SQL）
- ✅ AI 洞察页，支持重新生成
- ✅ 首页 Landing Page
- ✅ 账号设置页，支持删除账号
- ✅ Build 通过，V1 功能完整

**V1 上线 Checklist：**

- Vercel 环境变量检查（ANTHROPIC_API_KEY 已填入？）
- 推送触发 Vercel 自动部署
- 访问 https://watch-dna.vercel.app 验证首页
