import { askClaude } from '@/lib/claude';
import { db } from '@/lib/db';

// 生成观众画像：汇总订阅数、观看数、热门频道、分类分布，交给 Claude 写分析
export async function generateViewerProfile(userId: string): Promise<string> {
  // Promise.all 并行查询，比顺序查询快很多（行业常用模式）
  const [subCount, watchCount, topChannels, categories] = await Promise.all([
    db.subscription.count({ where: { userId } }),
    db.watchEvent.count({ where: { userId } }),
    // groupBy 相当于 SQL 的 GROUP BY + ORDER BY + LIMIT
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

  // 把频道 ID 列表转成名字，用 Map 做 O(1) 查找
  const channelIds = topChannels.map((c) => c.channelId!).filter(Boolean);
  const channelNames = await db.channel.findMany({
    where: { id: { in: channelIds } },
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
1. Describes their viewing personality
2. Notes their top interests and content preferences
3. Highlights any interesting patterns
4. Ends with 3-5 personality tags like #标签

Be specific and insightful, not generic. Write in Chinese.`;

  return askClaude(prompt);
}

// 分析兴趣变迁：比较六个月前后的分类分布，找出变化趋势
export async function generateInterestShift(userId: string): Promise<string> {
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const [recentEvents, olderEvents] = await Promise.all([
    db.watchEvent.findMany({
      where: { userId, watchedAt: { gte: sixMonthsAgo } },
      include: { channel: { select: { aiCategory: true } } },
    }),
    db.watchEvent.findMany({
      where: { userId, watchedAt: { lt: sixMonthsAgo } },
      include: { channel: { select: { aiCategory: true } } },
    }),
  ]);

  // 把事件列表聚合成"分类: 占比%"的字符串
  const countCategories = (events: typeof recentEvents) => {
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

  if (recentEvents.length === 0 && olderEvents.length === 0) {
    return '数据不足，无法生成兴趣变迁分析。请上传更多观看历史数据。';
  }

  const prompt = `Analyze this YouTube viewer's interest shift over time. Write 100-150 words in Chinese.

Past (before 6 months): ${countCategories(olderEvents) || 'No data'}
Recent (last 6 months): ${countCategories(recentEvents) || 'No data'}

Describe what changed, what stayed the same, and what this might mean. Be specific about percentages.`;

  return askClaude(prompt);
}

// 取消订阅建议：找出近 6 个月没有观看记录的订阅频道
// 纯 SQL 逻辑，不需要 AI，避免不必要的 token 消耗
export async function getUnsubscribeSuggestions(userId: string) {
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  // 查出近 6 个月有观看记录的频道 ID（去重）
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

  // 用 Set 做差集：订阅了但没看过的 = 可以考虑取消订阅的
  return allSubs
    .filter((s) => !watchedIds.has(s.channelId))
    .map((s) => s.channel)
    .slice(0, 20);
}
