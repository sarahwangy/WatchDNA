// 桑基图数据查询：把"订阅了哪些分类"和"实际看了哪些分类"聚合成节点+连线
// 左侧节点 = 订阅分类（频道数），右侧节点 = 观看分类（观看次数）
// 连线粗细 = 观看次数
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

// 每个分类对应一个固定颜色，左右节点共用
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
  // 统计用户订阅的各分类频道数（JOIN Channel 拿到 aiCategory）
  const subscriptionCounts = await db.channel.groupBy({
    by: ['aiCategory'],
    where: {
      subscriptions: { some: { userId } },
    },
    _count: { id: true },
  });

  // 查询用户所有观看记录，附带频道分类
  const watchEvents = await db.watchEvent.findMany({
    where: { userId, channelId: { not: null } },
    include: {
      channel: { select: { aiCategory: true } },
    },
  });

  // 把观看记录按分类聚合成 { Tech: 342, Music: 88, ... }
  const watchByCategory: Record<string, number> = {};
  watchEvents.forEach((w) => {
    const cat = w.channel?.aiCategory || 'Other';
    watchByCategory[cat] = (watchByCategory[cat] || 0) + 1;
  });

  // 合并所有出现过的分类
  const allCategories = new Set([
    ...subscriptionCounts.map((s) => s.aiCategory || 'Other'),
    ...Object.keys(watchByCategory),
  ]);

  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  for (const cat of Array.from(allCategories)) {
    const subCount =
      subscriptionCounts.find((s) => (s.aiCategory || 'Other') === cat)?._count.id || 0;
    const watchCount = watchByCategory[cat] || 0;

    // 过滤噪音：订阅 < 2 且观看 < 5 的分类不显示
    if (subCount < 2 && watchCount < 5) continue;

    const color = CATEGORY_COLORS[cat] || '#71717a';

    if (subCount > 0) {
      // 左侧节点 id 加 "sub_" 前缀，避免和右侧重名
      nodes.push({ id: `sub_${cat}`, label: `${cat}\n${subCount} 个频道`, color });
    }

    if (watchCount > 0) {
      // 右侧节点 id 加 "watch_" 前缀
      nodes.push({ id: `watch_${cat}`, label: `${cat}\n${watchCount} 次`, color });
    }

    if (subCount > 0 && watchCount > 0) {
      links.push({
        source: `sub_${cat}`,
        target: `watch_${cat}`,
        value: Math.max(watchCount, 1), // value 决定连线粗细
      });
    }
  }

  return { nodes, links };
}
