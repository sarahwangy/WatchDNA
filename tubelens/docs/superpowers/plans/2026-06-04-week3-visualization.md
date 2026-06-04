# Week 3 可视化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建完整的可视化 Dashboard——安装图表库、创建全局导航、数据聚合 API、以及订阅分析页、观看分析页、Dashboard 总览页。

**Architecture:** Server Components 直接查 Prisma 获取聚合数据（无需额外 API 层），图表组件用 `'use client'` 隔离客户端渲染。Recharts 处理简单图表，CSS Grid 实现热力图（避免 SSR 问题），react-simple-maps 画世界地图。

**Tech Stack:** Recharts、react-simple-maps、Next.js Server Components、Prisma 聚合查询、Tailwind CSS、shadcn/ui

---

## 文件结构

```
src/
├── app/
│   ├── dashboard/page.tsx          ← Dashboard 总览（已有，需重写）
│   ├── subscriptions/page.tsx      ← 订阅分析页（新建）
│   └── watching/page.tsx           ← 观看分析页（新建）
├── components/
│   ├── layout/
│   │   └── sidebar.tsx             ← 全局侧边栏导航
│   ├── dashboard/
│   │   ├── kpi-cards.tsx           ← 4 个 KPI 数字卡片
│   │   └── calendar-heatmap.tsx    ← GitHub 风格日历热力图
│   ├── watching/
│   │   ├── hour-heatmap.tsx        ← 24h×7d 时段热力图
│   │   └── top-channels.tsx        ← Top 20 频道排行
│   └── subscriptions/
│       ├── category-pie.tsx        ← 分类饼图
│       └── channel-table.tsx       ← 频道列表表格
└── lib/
    └── queries/
        ├── dashboard.ts            ← Dashboard 聚合查询
        ├── watching.ts             ← 观看数据查询
        └── subscriptions.ts        ← 订阅数据查询
```

---

## Task 1：安装图表库（TUB-VIZ-001）

**Files:**

- Modify: `tubelens/package.json`

- [ ] **Step 1: 安装**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npm install recharts react-simple-maps
npm install --save-dev @types/react-simple-maps
```

- [ ] **Step 2: 验证**

```bash
node -e "require('recharts'); require('react-simple-maps'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/package.json tubelens/package-lock.json
git commit -m "chore: install recharts and react-simple-maps (TUB-VIZ-001)"
git push
```

---

## Task 2：数据聚合查询层

**Files:**

- Create: `src/lib/queries/dashboard.ts`
- Create: `src/lib/queries/watching.ts`
- Create: `src/lib/queries/subscriptions.ts`

- [ ] **Step 1: 创建 `src/lib/queries/dashboard.ts`**

```typescript
// Server-side 查询函数，直接从数据库聚合数据
// 不需要 API 层，Next.js Server Components 可以直接调用
import { db } from '@/lib/db';

export async function getDashboardStats(userId: string) {
  const [subscriptionCount, watchEventCount, activeDays, recentWatches] = await Promise.all([
    // 总订阅数
    db.subscription.count({ where: { userId } }),

    // 总观看次数
    db.watchEvent.count({ where: { userId } }),

    // 活跃天数（有观看记录的不同日期数）
    db.watchEvent
      .findMany({
        where: { userId },
        select: { watchedAt: true },
        distinct: ['watchedAt'],
      })
      .then((events) => {
        const days = new Set(events.map((e) => e.watchedAt.toISOString().split('T')[0]));
        return days.size;
      }),

    // 最近 365 天的每日观看次数（用于热力图）
    db.watchEvent.groupBy({
      by: ['watchedAt'],
      where: {
        userId,
        watchedAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      },
      _count: { id: true },
    }),
  ]);

  // 把日期聚合成 { date: string, count: number }[] 格式
  const watchByDay = recentWatches.reduce<Record<string, number>>((acc, item) => {
    const date = item.watchedAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + item._count.id;
    return acc;
  }, {});

  return {
    subscriptionCount,
    watchEventCount,
    activeDays,
    watchByDay, // { '2024-01-15': 12, ... }
  };
}

export async function getTopChannels(userId: string, limit = 10) {
  // 按观看次数排序的 Top N 频道
  const topChannels = await db.watchEvent.groupBy({
    by: ['channelId'],
    where: { userId, channelId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  // 补全频道信息
  const channelIds = topChannels.map((c) => c.channelId!).filter(Boolean);
  const channels = await db.channel.findMany({
    where: { id: { in: channelIds } },
    select: { id: true, title: true, thumbnailUrl: true, country: true },
  });

  const channelMap = new Map(channels.map((c) => [c.id, c]));

  return topChannels.map((item) => ({
    channelId: item.channelId,
    watchCount: item._count.id,
    channel: item.channelId ? channelMap.get(item.channelId) : null,
  }));
}
```

- [ ] **Step 2: 创建 `src/lib/queries/watching.ts`**

```typescript
import { db } from '@/lib/db';

export async function getHourlyHeatmap(userId: string) {
  // 获取所有观看时间，计算 weekday×hour 矩阵
  const events = await db.watchEvent.findMany({
    where: { userId },
    select: { watchedAt: true },
  });

  // 初始化 7×24 矩阵
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  events.forEach((e) => {
    const dow = e.watchedAt.getDay(); // 0=Sunday
    const hour = e.watchedAt.getHours();
    matrix[dow][hour]++;
  });

  return matrix; // matrix[weekday][hour] = count
}

export async function getMonthlyTrend(userId: string) {
  const events = await db.watchEvent.findMany({
    where: {
      userId,
      watchedAt: { gte: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000) },
    },
    select: { watchedAt: true },
  });

  const byMonth = events.reduce<Record<string, number>>((acc, e) => {
    const key = `${e.watchedAt.getFullYear()}-${String(e.watchedAt.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export async function getTopChannelsFull(userId: string, limit = 20) {
  const topChannels = await db.watchEvent.groupBy({
    by: ['channelId'],
    where: { userId, channelId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  const channelIds = topChannels.map((c) => c.channelId!).filter(Boolean);
  const channels = await db.channel.findMany({
    where: { id: { in: channelIds } },
    select: { id: true, title: true, thumbnailUrl: true, aiCategory: true },
  });

  const channelMap = new Map(channels.map((c) => [c.id, c]));
  const total = topChannels.reduce((sum, c) => sum + c._count.id, 0);

  return topChannels.map((item) => ({
    channelId: item.channelId,
    watchCount: item._count.id,
    percentage: total > 0 ? Math.round((item._count.id / total) * 100) : 0,
    channel: item.channelId ? channelMap.get(item.channelId) : null,
  }));
}
```

- [ ] **Step 3: 创建 `src/lib/queries/subscriptions.ts`**

```typescript
import { db } from '@/lib/db';

export async function getSubscriptionsByCategory(userId: string) {
  const subs = await db.subscription.findMany({
    where: { userId },
    include: {
      channel: { select: { aiCategory: true } },
    },
  });

  const byCat = subs.reduce<Record<string, number>>((acc, s) => {
    const cat = s.channel.aiCategory || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(byCat)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));
}

export async function getSubscriptionChannels(userId: string) {
  const watchCounts = await db.watchEvent.groupBy({
    by: ['channelId'],
    where: { userId, channelId: { not: null } },
    _count: { id: true },
  });

  const watchMap = new Map(watchCounts.map((w) => [w.channelId, w._count.id]));

  const subs = await db.subscription.findMany({
    where: { userId },
    include: {
      channel: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          country: true,
          aiCategory: true,
          subscriberCount: true,
        },
      },
    },
    orderBy: { channel: { title: 'asc' } },
    take: 100,
  });

  return subs.map((s) => ({
    ...s.channel,
    watchCount: watchMap.get(s.channel.id) || 0,
    neverWatched: !watchMap.has(s.channel.id),
  }));
}
```

- [ ] **Step 4: 验证 TypeScript**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -10
```

Expected: 零错误

- [ ] **Step 5: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/lib/queries/
git commit -m "feat: add dashboard/watching/subscriptions data query layer"
git push
```

---

## Task 3：全局侧边栏导航（TUB-PAGE-009）

**Files:**

- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/dashboard-layout.tsx`

- [ ] **Step 1: 创建侧边栏**

创建 `src/components/layout/sidebar.tsx`：

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/subscriptions', label: 'Subscriptions', icon: '📋' },
  { href: '/watching', label: 'Watching', icon: '👁' },
  { href: '/search', label: 'Search', icon: '🔍' },
  { href: '/insights', label: 'AI Insights', icon: '🤖' },
  { href: '/import', label: 'Import Data', icon: '📤' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-red-500 text-lg">●</span>
          <span className="font-bold text-white text-lg">Tubelens</span>
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${
                  isActive
                    ? 'bg-red-500/10 text-red-400 font-medium'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 用户信息 + 登出 */}
      <div className="px-4 py-4 border-t border-zinc-800">
        {session?.user && (
          <div className="flex items-center gap-3 mb-3">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{session.user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left text-xs text-zinc-500 hover:text-white px-2 py-1 rounded transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: 创建带侧边栏的布局组件**

创建 `src/components/layout/dashboard-layout.tsx`：

```tsx
import { Sidebar } from './sidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Sidebar />
      {/* 主内容区：左边留出 240px 给侧边栏 */}
      <main className="ml-60 min-h-screen p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: 验证**

```bash
npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 4: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/components/layout/
git commit -m "feat: add sidebar navigation and dashboard layout (TUB-PAGE-009)"
git push
```

---

## Task 4：KPI 卡片 + 日历热力图组件（TUB-VIZ-002 + VIZ-005）

**Files:**

- Create: `src/components/dashboard/kpi-cards.tsx`
- Create: `src/components/dashboard/calendar-heatmap.tsx`

- [ ] **Step 1: 创建 KPI 卡片**

创建 `src/components/dashboard/kpi-cards.tsx`：

```tsx
interface KpiCardsProps {
  subscriptionCount: number;
  watchEventCount: number;
  activeDays: number;
}

export function KpiCards({ subscriptionCount, watchEventCount, activeDays }: KpiCardsProps) {
  const cards = [
    { label: '总订阅', value: subscriptionCount.toLocaleString(), unit: '个频道', icon: '📋' },
    { label: '总观看', value: watchEventCount.toLocaleString(), unit: '次', icon: '▶️' },
    { label: '活跃天数', value: activeDays.toLocaleString(), unit: '天', icon: '📅' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm">{card.label}</span>
            <span className="text-lg">{card.icon}</span>
          </div>
          {/* 数字用 JetBrains Mono 风格显示 */}
          <div className="text-3xl font-bold text-white font-mono tracking-tight">{card.value}</div>
          <div className="text-zinc-500 text-xs mt-1">{card.unit}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 创建日历热力图**

创建 `src/components/dashboard/calendar-heatmap.tsx`：

```tsx
'use client';

interface CalendarHeatmapProps {
  // { '2024-01-15': 12 }
  data: Record<string, number>;
}

function getColorClass(count: number, max: number): string {
  if (count === 0) return 'bg-zinc-800';
  const ratio = count / max;
  if (ratio < 0.2) return 'bg-red-900/40';
  if (ratio < 0.4) return 'bg-red-800/60';
  if (ratio < 0.6) return 'bg-red-700/70';
  if (ratio < 0.8) return 'bg-red-600/80';
  return 'bg-red-500';
}

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  // 生成过去 365 天的日期数组
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: data[dateStr] || 0 });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);
  // 按周分组（每列 7 天）
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">观看活跃度（近一年）</h3>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} 次`}
                className={`w-3 h-3 rounded-sm ${getColorClass(day.count, maxCount)} cursor-pointer transition-opacity hover:opacity-80`}
              />
            ))}
          </div>
        ))}
      </div>
      {/* 图例 */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-zinc-500">少</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${getColorClass(Math.ceil(r * maxCount), maxCount)}`}
          />
        ))}
        <span className="text-xs text-zinc-500">多</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 4: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/components/dashboard/
git commit -m "feat: add KPI cards and calendar heatmap components (TUB-VIZ-002, TUB-VIZ-005)"
git push
```

---

## Task 5：Dashboard 总览页（TUB-PAGE-003）

**Files:**

- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: 重写 Dashboard 页面**

完整替换 `src/app/dashboard/page.tsx`：

```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { CalendarHeatmap } from '@/components/dashboard/calendar-heatmap';
import { getDashboardStats, getTopChannels } from '@/lib/queries/dashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as { id: string }).id;

  // Server Component 直接查数据库，不需要 API 调用
  const [stats, topChannels] = await Promise.all([
    getDashboardStats(userId),
    getTopChannels(userId, 5),
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">你的 YouTube 观看概览</p>
        </div>

        {/* KPI 卡片 */}
        <KpiCards
          subscriptionCount={stats.subscriptionCount}
          watchEventCount={stats.watchEventCount}
          activeDays={stats.activeDays}
        />

        {/* 日历热力图 */}
        <CalendarHeatmap data={stats.watchByDay} />

        {/* Top 5 频道 */}
        {topChannels.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Top 频道（观看次数）</h3>
            <div className="space-y-3">
              {topChannels.map((item, i) => (
                <div key={item.channelId} className="flex items-center gap-3">
                  <span className="text-zinc-500 font-mono text-sm w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {item.channel?.title || item.channelId}
                    </p>
                  </div>
                  <span className="text-zinc-400 text-sm font-mono">
                    {item.watchCount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 没有数据时的引导 */}
        {stats.watchEventCount === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-white font-medium mb-2">还没有数据</p>
            <p className="text-zinc-400 text-sm mb-4">上传你的 Google Takeout ZIP 文件开始分析</p>
            <a
              href="/import"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              上传数据 →
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -10
npm run build 2>&1 | grep -E "error|✓|Compiled" | head -5
```

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/app/dashboard/
git commit -m "feat: build Dashboard overview page with KPI cards and heatmap (TUB-PAGE-003)"
git push
```

---

## Task 6：时段热力图 + Top 频道组件（TUB-VIZ-006 + VIZ-009）

**Files:**

- Create: `src/components/watching/hour-heatmap.tsx`
- Create: `src/components/watching/top-channels.tsx`

- [ ] **Step 1: 创建 24h×7d 时段热力图**

创建 `src/components/watching/hour-heatmap.tsx`：

```tsx
'use client';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface HourHeatmapProps {
  // matrix[weekday][hour] = count
  matrix: number[][];
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return '#18181b'; // zinc-900
  const ratio = count / max;
  const alpha = 0.2 + ratio * 0.8;
  return `rgba(239, 68, 68, ${alpha})`; // red-500 with variable opacity
}

export function HourHeatmap({ matrix }: HourHeatmapProps) {
  const max = Math.max(...matrix.flat(), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">观看时段分布</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* 小时标签行 */}
          <div className="flex mb-1 ml-10">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-zinc-600 text-xs">
                {h % 6 === 0 ? h : ''}
              </div>
            ))}
          </div>
          {/* 热力图主体 */}
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <div className="w-9 text-right text-zinc-500 text-xs pr-2">{day}</div>
              {HOURS.map((hour) => {
                const count = matrix[di]?.[hour] ?? 0;
                return (
                  <div
                    key={hour}
                    title={`${day} ${hour}:00 — ${count} 次`}
                    className="flex-1 h-6 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: getHeatColor(count, max) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 Top 频道排行组件**

创建 `src/components/watching/top-channels.tsx`：

```tsx
interface TopChannelsProps {
  channels: Array<{
    channelId: string | null;
    watchCount: number;
    percentage: number;
    channel?: {
      id: string;
      title: string;
      thumbnailUrl: string | null;
      aiCategory: string | null;
    } | null;
  }>;
}

export function TopChannels({ channels }: TopChannelsProps) {
  const maxCount = channels[0]?.watchCount || 1;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Top 频道排行</h3>
      <div className="space-y-3">
        {channels.map((item, i) => (
          <div key={item.channelId || i} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-zinc-600 font-mono text-xs w-5 shrink-0">{i + 1}</span>
                <span className="text-sm text-white truncate">
                  {item.channel?.title || item.channelId || '未知频道'}
                </span>
                {item.channel?.aiCategory && (
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                    {item.channel.aiCategory}
                  </span>
                )}
              </div>
              <span className="text-zinc-400 font-mono text-xs shrink-0 ml-2">
                {item.watchCount.toLocaleString()} ({item.percentage}%)
              </span>
            </div>
            {/* 进度条 */}
            <div className="w-full bg-zinc-800 rounded-full h-1">
              <div
                className="bg-red-500/60 h-1 rounded-full"
                style={{ width: `${(item.watchCount / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/components/watching/
git commit -m "feat: add hour heatmap and top channels components (TUB-VIZ-006, TUB-VIZ-009)"
git push
```

---

## Task 7：观看分析页（TUB-PAGE-005）

**Files:**

- Create: `src/app/watching/page.tsx`

- [ ] **Step 1: 创建观看分析页**

创建 `src/app/watching/page.tsx`：

```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { HourHeatmap } from '@/components/watching/hour-heatmap';
import { TopChannels } from '@/components/watching/top-channels';
import { getHourlyHeatmap, getTopChannelsFull, getMonthlyTrend } from '@/lib/queries/watching';

export default async function WatchingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as { id: string }).id;

  const [matrix, topChannels, monthlyTrend] = await Promise.all([
    getHourlyHeatmap(userId),
    getTopChannelsFull(userId, 20),
    getMonthlyTrend(userId),
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">观看分析</h1>
          <p className="text-zinc-400 text-sm mt-1">深入了解你的观看习惯</p>
        </div>

        {/* 时段热力图 */}
        <HourHeatmap matrix={matrix} />

        {/* 月度趋势 */}
        {monthlyTrend.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">月度观看趋势</h3>
            <div className="flex items-end gap-1 h-32">
              {monthlyTrend.map((m) => {
                const maxVal = Math.max(...monthlyTrend.map((x) => x.count), 1);
                const heightPct = (m.count / maxVal) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      title={`${m.month}: ${m.count}`}
                      className="w-full bg-red-500/60 rounded-sm hover:bg-red-500 transition-colors cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-zinc-600 text-xs rotate-45 origin-left hidden sm:block">
                      {m.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top 20 频道 */}
        <TopChannels channels={topChannels} />
      </div>
    </DashboardLayout>
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
git add tubelens/src/app/watching/
git commit -m "feat: build watching analysis page (TUB-PAGE-005)"
git push
```

---

## Task 8：分类饼图 + 频道列表（TUB-VIZ-004 + PAGE-004）

**Files:**

- Create: `src/components/subscriptions/category-pie.tsx`
- Create: `src/components/subscriptions/channel-table.tsx`
- Create: `src/app/subscriptions/page.tsx`

- [ ] **Step 1: 创建分类饼图（用 Recharts）**

创建 `src/components/subscriptions/category-pie.tsx`：

```tsx
'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

interface CategoryPieProps {
  data: Array<{ name: string; value: number }>;
}

export function CategoryPie({ data }: CategoryPieProps) {
  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-center h-64">
        <p className="text-zinc-500 text-sm">暂无分类数据（需先完成 AI 分类）</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">订阅分类分布</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#a1a1aa' }}
          />
          <Legend formatter={(value) => <span className="text-zinc-400 text-xs">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: 创建频道列表**

创建 `src/components/subscriptions/channel-table.tsx`：

```tsx
interface Channel {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  country: string | null;
  aiCategory: string | null;
  subscriberCount: bigint | null;
  watchCount: number;
  neverWatched: boolean;
}

interface ChannelTableProps {
  channels: Channel[];
}

export function ChannelTable({ channels }: ChannelTableProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400">
          订阅频道列表 <span className="text-zinc-600">({channels.length})</span>
        </h3>
      </div>
      <div className="divide-y divide-zinc-800">
        {channels.slice(0, 50).map((ch) => (
          <div
            key={ch.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition-colors"
          >
            {/* 频道缩略图 */}
            <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden shrink-0">
              {ch.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ch.thumbnailUrl} alt={ch.title} className="w-full h-full object-cover" />
              )}
            </div>
            {/* 频道名 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{ch.title}</p>
              {ch.subscriberCount && (
                <p className="text-xs text-zinc-500">
                  {Number(ch.subscriberCount).toLocaleString()} 订阅者
                </p>
              )}
            </div>
            {/* 分类标签 */}
            {ch.aiCategory && (
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded shrink-0">
                {ch.aiCategory}
              </span>
            )}
            {/* 从未观看标记 */}
            {ch.neverWatched ? (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded shrink-0">
                从未观看
              </span>
            ) : (
              <span className="text-xs text-zinc-500 font-mono shrink-0">{ch.watchCount} 次</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建订阅分析页**

创建 `src/app/subscriptions/page.tsx`：

```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CategoryPie } from '@/components/subscriptions/category-pie';
import { ChannelTable } from '@/components/subscriptions/channel-table';
import { getSubscriptionsByCategory, getSubscriptionChannels } from '@/lib/queries/subscriptions';

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as { id: string }).id;

  const [categories, channels] = await Promise.all([
    getSubscriptionsByCategory(userId),
    getSubscriptionChannels(userId),
  ]);

  const neverWatchedCount = channels.filter((c) => c.neverWatched).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">订阅分析</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {channels.length} 个订阅频道 · {neverWatchedCount} 个从未观看
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <CategoryPie data={categories} />
          {/* 订阅规模统计 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">快速统计</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">总订阅</span>
                <span className="text-white font-mono">{channels.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">从未观看</span>
                <span className="text-red-400 font-mono">{neverWatchedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">活跃频道</span>
                <span className="text-green-400 font-mono">
                  {channels.length - neverWatchedCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">沉默率</span>
                <span className="text-zinc-300 font-mono">
                  {channels.length > 0
                    ? Math.round((neverWatchedCount / channels.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        <ChannelTable channels={channels} />
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 4: 验证 build**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npm run build 2>&1 | grep -E "error|Error|✓|Compiled" | head -8
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/
git commit -m "feat: build subscriptions analysis page with pie chart and channel table (TUB-PAGE-004, TUB-VIZ-004)"
git push
```

---

## Week 3 完成标准

完成以上 8 个 Task 后：

- ✅ 全局侧边栏导航，所有页面统一布局
- ✅ Dashboard 页：KPI 卡片 + GitHub 风格日历热力图 + Top 5 频道
- ✅ 观看分析页：24h×7d 时段热力图 + 月度趋势 + Top 20 排行
- ✅ 订阅分析页：分类饼图 + 频道列表（含"从未观看"标记）
- ✅ Build 通过，部署到 Vercel

**下一步：Week 4 — AI 洞察 + 首页 + 上线**
