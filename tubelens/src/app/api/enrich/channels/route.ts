// ============================================================
// 频道元数据富化路由
// 职责：用 YouTube API 填充 Channel 表里缺少的元数据
// 优化：只处理 7 天内没有富化过的频道，节省 API 配额
// ============================================================

import { db } from '@/lib/db';
import { fetchChannels } from '@/lib/youtube';
import { NextRequest } from 'next/server';

// 复用同样的内部鉴权逻辑（与 process-takeout 相同的模式）
function verifyInternalRequest(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-secret');
  return secret === (process.env.NEXTAUTH_SECRET || '');
}

export async function POST(request: NextRequest) {
  if (!verifyInternalRequest(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await request.json();

  // 计算 7 天前的时间戳，用于过滤"最近已富化"的频道
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 查找该用户订阅的频道中，需要富化的那些
  // OR 条件：enrichedAt 为空（从未富化）或超过 7 天没更新
  // take: 200 防止单次处理太多导致超时
  const channels = await db.channel.findMany({
    where: {
      subscriptions: { some: { userId } }, // 该用户订阅的频道
      OR: [
        { enrichedAt: null }, // 从未富化过
        { enrichedAt: { lt: sevenDaysAgo } }, // 超过 7 天没富化
      ],
    },
    select: { id: true }, // 只取 id，减少数据库传输量
    take: 200,
  });

  // 没有需要富化的频道，直接返回
  if (channels.length === 0) {
    return Response.json({ enriched: 0 });
  }

  // 调用 YouTube API 批量获取频道元数据
  const enrichedData = await fetchChannels(channels.map((c) => c.id));

  // 用事务批量更新 Channel 表
  // db.$transaction 保证：要么全部成功，要么全部回滚
  // BigInt：subscriberCount 和 viewCount 可能超过 JS Number 的安全整数范围
  await db.$transaction(
    enrichedData.map((data) =>
      db.channel.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description: data.description,
          country: data.country,
          customUrl: data.customUrl,
          thumbnailUrl: data.thumbnailUrl,
          subscriberCount: data.subscriberCount ? BigInt(data.subscriberCount) : null,
          videoCount: data.videoCount,
          viewCount: data.viewCount ? BigInt(data.viewCount) : null,
          publishedAt: data.publishedAt,
          topicCategories: data.topicCategories,
          enrichedAt: new Date(), // 更新富化时间戳
        },
      })
    )
  );

  return Response.json({ enriched: enrichedData.length });
}
