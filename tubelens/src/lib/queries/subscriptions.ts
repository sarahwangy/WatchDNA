import { db } from '@/lib/db';

// 按 AI 分类聚合订阅数量，用于饼图/柱状图展示订阅内容分布
export async function getSubscriptionsByCategory(userId: string) {
  // include 是 Prisma 的关联查询：同时取出 subscription 关联的 channel 数据
  const subs = await db.subscription.findMany({
    where: { userId },
    include: {
      channel: { select: { aiCategory: true } },
    },
  });

  // 按分类分组计数，没有 aiCategory 的归入 'Other'
  const byCat = subs.reduce<Record<string, number>>((acc, s) => {
    const cat = s.channel.aiCategory || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // 转成数组并按数量降序排序，格式适配图表库（如 Recharts）
  return Object.entries(byCat)
    .sort(([, a], [, b]) => b - a) // 只比较 value，忽略 key（用 , 跳过第一个元素）
    .map(([name, value]) => ({ name, value }));
}

// 获取用户所有订阅频道列表，附带各频道的实际观看次数
// 可用于发现"订阅了但从未看过"的频道
export async function getSubscriptionChannels(userId: string) {
  // 先查这个用户对所有频道的观看次数（groupBy 批量统计，避免 N+1 问题）
  const watchCounts = await db.watchEvent.groupBy({
    by: ['channelId'],
    where: { userId, channelId: { not: null } },
    _count: { id: true },
  });

  // 转成 Map 供后续 O(1) 查找：channelId -> 观看次数
  const watchMap = new Map(watchCounts.map((w) => [w.channelId, w._count.id]));

  // 查订阅列表，关联频道详情，按频道名字母排序，最多返回 100 条
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
  });

  // 把订阅数据和观看次数合并，同时标记"从未观看"的频道
  return subs.map((s) => ({
    ...s.channel, // 展开频道字段（行业常用的对象合并写法）
    watchCount: watchMap.get(s.channel.id) || 0,
    neverWatched: !watchMap.has(s.channel.id), // true 表示订阅但从未看过
  }));
}
