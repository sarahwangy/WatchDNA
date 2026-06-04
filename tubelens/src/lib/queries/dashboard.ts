// Server-side 查询函数，直接从数据库聚合数据
// Next.js Server Components 可以直接调用，不需要 API 层
import { db } from '@/lib/db';

// 获取仪表盘统计数据：订阅数、观看总数、活跃天数、每日观看分布
export async function getDashboardStats(userId: string) {
  // Promise.all 并行发起多个数据库查询，比串行快很多（行业常用模式）
  const [subscriptionCount, watchEventCount, activeDaysData, recentWatches] = await Promise.all([
    db.subscription.count({ where: { userId } }),
    db.watchEvent.count({ where: { userId } }),
    // 查所有观看记录的时间，用于计算历史活跃天数
    db.watchEvent.findMany({
      where: { userId },
      select: { watchedAt: true },
    }),
    // 查近 365 天的记录，用于绘制每日观看热力图
    db.watchEvent.findMany({
      where: {
        userId,
        watchedAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      },
      select: { watchedAt: true },
    }),
  ]);

  // 用 Set 去重：把每个时间戳截取日期部分，重复日期只算一次
  const days = new Set(activeDaysData.map((e) => e.watchedAt.toISOString().split('T')[0]));
  const activeDays = days.size;

  // 聚合每日观看次数，结果格式：{ '2024-01-15': 12, '2024-01-16': 5, ... }
  // reduce 是数组"归并"操作——行业常用的统计聚合写法
  const watchByDay = recentWatches.reduce<Record<string, number>>((acc, item) => {
    const date = item.watchedAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return { subscriptionCount, watchEventCount, activeDays, watchByDay };
}

// 获取观看次数最多的频道 Top N（默认 Top 10）
export async function getTopChannels(userId: string, limit = 10) {
  // groupBy 是 Prisma 的 GROUP BY 等价操作，按 channelId 分组统计观看次数
  const topChannels = await db.watchEvent.groupBy({
    by: ['channelId'],
    where: { userId, channelId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  // 取出所有 channelId，再一次性批量查频道详情（避免 N+1 查询问题——行业常见优化）
  const channelIds = topChannels.map((c) => c.channelId!).filter(Boolean);
  const channels = await db.channel.findMany({
    where: { id: { in: channelIds } },
    select: { id: true, title: true, thumbnailUrl: true, country: true },
  });

  // 把频道列表转成 Map，方便 O(1) 查找
  const channelMap = new Map(channels.map((c) => [c.id, c]));

  // 把统计数据和频道详情合并返回
  return topChannels.map((item) => ({
    channelId: item.channelId,
    watchCount: item._count.id,
    channel: item.channelId ? channelMap.get(item.channelId) : null,
  }));
}
