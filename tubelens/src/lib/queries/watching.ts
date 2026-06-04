import { db } from '@/lib/db';

// 生成 7×24 的观看热力矩阵（星期 × 小时）
// 用于展示"哪天几点最爱看视频"的热力图
export async function getHourlyHeatmap(userId: string) {
  const events = await db.watchEvent.findMany({
    where: { userId },
    select: { watchedAt: true },
  });

  // 初始化 7 行 24 列的二维数组，全部填 0
  // matrix[0] = 周日的 24 小时，matrix[1] = 周一的 24 小时，以此类推
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  events.forEach((e) => {
    const dow = e.watchedAt.getDay(); // 0=周日，1=周一…6=周六
    const hour = e.watchedAt.getHours(); // 0~23
    matrix[dow][hour]++;
  });

  return matrix;
}

// 获取近 24 个月的月度观看趋势
// 返回格式：[{ month: '2024-01', count: 42 }, ...]，按时间升序
export async function getMonthlyTrend(userId: string) {
  const events = await db.watchEvent.findMany({
    where: {
      userId,
      // 近 24 个月（约 730 天）
      watchedAt: { gte: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000) },
    },
    select: { watchedAt: true },
  });

  // 按 'YYYY-MM' 格式分组计数
  const byMonth = events.reduce<Record<string, number>>((acc, e) => {
    // padStart(2, '0') 确保月份始终两位数，如 '01' 而不是 '1'
    const key = `${e.watchedAt.getFullYear()}-${String(e.watchedAt.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Object.entries 把对象转成 [key, value] 数组，再排序后格式化输出
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b)) // 字符串比较，'2024-01' < '2024-02'
    .map(([month, count]) => ({ month, count }));
}

// 获取观看次数 Top N 的频道完整信息（含百分比，默认 Top 20）
// 比 dashboard.ts 中的 getTopChannels 多了 aiCategory 和百分比
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
  // 计算 Top N 总观看次数，用于算各频道占比
  const total = topChannels.reduce((sum, c) => sum + c._count.id, 0);

  return topChannels.map((item) => ({
    channelId: item.channelId,
    watchCount: item._count.id,
    // Math.round 保留整数百分比，total > 0 防止除以零
    percentage: total > 0 ? Math.round((item._count.id / total) * 100) : 0,
    channel: item.channelId ? channelMap.get(item.channelId) : null,
  }));
}
