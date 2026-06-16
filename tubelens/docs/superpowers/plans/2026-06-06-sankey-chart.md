# Sankey Chart: Subscriptions vs Actual Watching

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用桑基图展示"我订阅了什么"vs"我实际在看什么"的错位——按内容分类聚合，揭示沉睡订阅的真相。

**Architecture:** 左侧节点 = 订阅分类（如 Tech 180个频道），右侧节点 = 实际观看分类（如 Tech 342次），连线粗细 = 观看次数。用 `@nivo/sankey` 渲染（需要 `'use client'` 包装避免 SSR 问题）。数据查询在 Server Component 层完成，只把聚合后的数值传给客户端图表组件。

**Tech Stack:** `@nivo/core @nivo/sankey`，Next.js Server/Client Component 分层，Prisma 聚合查询

---

## 文件结构

```
src/
├── lib/queries/
│   └── sankey.ts                        ← 聚合查询（新建）
├── components/watching/
│   └── subscription-sankey.tsx          ← Sankey 图表组件（新建）
└── app/watching/
    └── page.tsx                         ← 添加 Sankey（修改）
```

---

## Task 1：安装 nivo/sankey

**Files:**

- Modify: `package.json`

- [ ] **Step 1: 安装**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npm install @nivo/core @nivo/sankey
```

- [ ] **Step 2: 验证**

```bash
node -e "require('@nivo/sankey'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/package.json tubelens/package-lock.json
git commit -m "chore: install @nivo/sankey for subscription vs watching chart"
git push
```

---

## Task 2：数据查询层

**Files:**

- Create: `src/lib/queries/sankey.ts`

- [ ] **Step 1: 创建查询函数**

创建 `src/lib/queries/sankey.ts`：

```typescript
// 桑基图数据查询：把"订阅了哪些分类"和"实际看了哪些分类"聚合成节点+连线
// 设计：左侧 = 订阅分类（频道数），右侧 = 观看分类（观看次数）
// 连线 = 从"订阅了X类的频道"流向"实际观看了X类的内容"
import { db } from '@/lib/db';

export interface SankeyNode {
  id: string;
  label: string;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// 左侧节点颜色（订阅分类）
const CATEGORY_COLORS: Record<string, string> = {
  Tech: '#3b82f6',
  Music: '#22c55e',
  Gaming: '#f59e0b',
  Education: '#8b5cf6',
  News: '#6b7280',
  Entertainment: '#ec4899',
  Lifestyle: '#06b6d4',
  Sports: '#f97316',
  Science: '#10b981',
  Art: '#a78bfa',
  Other: '#71717a',
};

export async function getSankeyData(userId: string): Promise<SankeyData> {
  // 1. 统计用户订阅的各分类频道数
  const subsByCategory = await db.subscription.groupBy({
    by: [],
    where: { userId },
    _count: true,
  });

  // 更精确的查询：JOIN Channel 表拿到 aiCategory
  const subscriptionCounts = await db.channel.groupBy({
    by: ['aiCategory'],
    where: {
      subscriptions: { some: { userId } },
    },
    _count: { id: true },
  });

  // 2. 统计用户实际观看的各分类次数
  const watchCounts = await db.watchEvent.findMany({
    where: { userId, channelId: { not: null } },
    include: {
      channel: { select: { aiCategory: true } },
    },
  });

  // 聚合观看次数按分类
  const watchByCategory: Record<string, number> = {};
  watchCounts.forEach((w) => {
    const cat = w.channel?.aiCategory || 'Other';
    watchByCategory[cat] = (watchByCategory[cat] || 0) + 1;
  });

  // 3. 构建桑基图数据
  // 只保留有意义的数据：订阅 >= 2 或观看 >= 5 的分类
  const allCategories = new Set([
    ...subscriptionCounts.map((s) => s.aiCategory || 'Other'),
    ...Object.keys(watchByCategory),
  ]);

  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  for (const cat of allCategories) {
    const subCount =
      subscriptionCounts.find((s) => (s.aiCategory || 'Other') === cat)?._count.id || 0;
    const watchCount = watchByCategory[cat] || 0;

    if (subCount < 2 && watchCount < 5) continue; // 过滤噪音

    const color = CATEGORY_COLORS[cat] || '#71717a';

    // 左侧节点：订阅（sub_Tech）
    if (subCount > 0) {
      nodes.push({
        id: `sub_${cat}`,
        label: `${cat}\n${subCount} 个频道`,
        color,
      });
    }

    // 右侧节点：观看（watch_Tech）
    if (watchCount > 0) {
      nodes.push({
        id: `watch_${cat}`,
        label: `${cat}\n${watchCount} 次`,
        color,
      });
    }

    // 连线：订阅该分类 → 观看该分类
    if (subCount > 0 && watchCount > 0) {
      links.push({
        source: `sub_${cat}`,
        target: `watch_${cat}`,
        // value 用观看次数（决定连线粗细）
        value: Math.max(watchCount, 1),
      });
    }
  }

  // 如果没有分类数据（AI 还没跑分类），返回空
  if (nodes.length === 0) {
    return { nodes: [], links: [] };
  }

  return { nodes, links };
}
```

- [ ] **Step 2: 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -5
```

Expected: 零错误

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/lib/queries/sankey.ts
git commit -m "feat: add sankey data query (subscription vs watching by category)"
git push
```

---

## Task 3：桑基图组件

**Files:**

- Create: `src/components/watching/subscription-sankey.tsx`

- [ ] **Step 1: 创建组件**

创建 `src/components/watching/subscription-sankey.tsx`：

```tsx
'use client';

// nivo/sankey 是纯客户端渲染，必须加 'use client'
// SSR 下会报 "window is not defined" 错误，所以整个组件在客户端运行
import { ResponsiveSankey } from '@nivo/sankey';
import type { SankeyData } from '@/lib/queries/sankey';

interface SubscriptionSankeyProps {
  data: SankeyData;
}

export function SubscriptionSankey({ data }: SubscriptionSankeyProps) {
  // 没有数据时显示提示（通常是因为 AI 分类还没跑）
  if (data.nodes.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-400 text-sm">
          桑基图需要 AI 分类数据。请先前往{' '}
          <a href="/insights" className="text-red-400 hover:text-red-300 underline">
            AI 洞察页
          </a>{' '}
          生成分类。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-400">订阅 vs 实际观看</h3>
        <p className="text-xs text-zinc-600 mt-1">
          左：订阅频道数 · 右：实际观看次数 · 线宽 = 观看量
        </p>
      </div>

      {/* nivo Sankey 需要固定高度 */}
      <div style={{ height: 400 }}>
        <ResponsiveSankey
          data={data}
          margin={{ top: 16, right: 120, bottom: 16, left: 120 }}
          align="justify"
          colors={{ datum: 'color' }}
          nodeOpacity={1}
          nodeThickness={18}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
          linkOpacity={0.4}
          linkHoverOpacity={0.7}
          linkContract={3}
          enableLinkGradient
          // 标签样式
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={12}
          labelTextColor={{ from: 'color', modifiers: [['brighter', 1]] }}
          // 深色主题
          theme={{
            background: 'transparent',
            text: {
              fill: '#a1a1aa',
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
            },
            tooltip: {
              container: {
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
              },
            },
          }}
          // Tooltip 显示中文
          nodeTooltip={({ node }) => (
            <div className="px-3 py-2 text-xs">
              <strong>{node.label}</strong>
            </div>
          )}
          linkTooltip={({ link }) => (
            <div className="px-3 py-2 text-xs">
              {(link.source as { label: string }).label?.split('\n')[0]} →{' '}
              {(link.target as { label: string }).label?.split('\n')[0]}
              <br />
              <span className="text-zinc-400">{link.value} 次观看</span>
            </div>
          )}
        />
      </div>

      {/* 图例说明 */}
      <div className="flex items-center gap-6 mt-3 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-zinc-600" />
          左侧 = 订阅频道数
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-zinc-600" />
          右侧 = 实际观看次数
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-6 bg-zinc-600" />
          线宽 = 观看量
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证**

```bash
npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/components/watching/subscription-sankey.tsx
git commit -m "feat: add SubscriptionSankey chart component (TUB-VIZ-007)"
git push
```

---

## Task 4：集成到观看分析页

**Files:**

- Modify: `src/app/watching/page.tsx`
- Modify: `src/lib/queries/watching.ts`（不改，只 import 新查询）

- [ ] **Step 1: 读取现有 watching/page.tsx**

```bash
cat /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens/src/app/watching/page.tsx
```

- [ ] **Step 2: 在 watching/page.tsx 里添加 Sankey**

在现有的 import 区域顶部添加：

```typescript
import { SubscriptionSankey } from '@/components/watching/subscription-sankey';
import { getSankeyData } from '@/lib/queries/sankey';
```

在 `Promise.all` 里添加 `getSankeyData`：

```typescript
const [matrix, topChannels, monthlyTrend, sankeyData] = await Promise.all([
  getHourlyHeatmap(userId),
  getTopChannelsFull(userId, 20),
  getMonthlyTrend(userId),
  getSankeyData(userId),
]);
```

在页面 JSX 里，把 `<HourHeatmap>` 和 `<TopChannels>` 之间加入 Sankey（放在时段热力图之后）：

```tsx
{
  /* 桑基图：订阅 vs 实际观看 */
}
<SubscriptionSankey data={sankeyData} />;
```

- [ ] **Step 3: Build 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npm run build 2>&1 | grep -E "error|Error|✓|Compiled" | head -8
```

Expected: `✓ Compiled successfully`

如果有 nivo SSR 相关报错（`window is not defined`），用动态导入解决：

在 `watching/page.tsx` 顶部加：

```typescript
import dynamic from 'next/dynamic';
const SubscriptionSankey = dynamic(
  () => import('@/components/watching/subscription-sankey').then(m => m.SubscriptionSankey),
  { ssr: false, loading: () => <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 h-48 animate-pulse" /> }
);
```

并移除直接的 import 语句。

- [ ] **Step 4: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/app/watching/
git commit -m "feat: add Sankey chart to watching analysis page (TUB-VIZ-007)"
git push
```

---

## 完成标准

- ✅ `/watching` 页面出现桑基图
- ✅ 左侧节点 = 订阅分类（频道数），右侧 = 观看分类（次数）
- ✅ 没有 AI 分类数据时显示提示而不是报错
- ✅ Build 通过
