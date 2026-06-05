// POST /api/insights/generate — 生成并保存用户的 AI 洞察（画像 + 兴趣变迁）
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateViewerProfile, generateInterestShift } from '@/lib/ai/generate-insights';
import { classifyUserChannels } from '@/lib/ai/classify-channels';

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  const userId = user!.id;

  try {
    // 第一步：先分类频道，画像生成依赖 aiCategory 字段
    await classifyUserChannels(userId);

    // 第二步：并行生成两个洞察，节省等待时间
    const [profile, interestShift] = await Promise.all([
      generateViewerProfile(userId),
      generateInterestShift(userId),
    ]);

    // 30 天后过期，到期后用户再次触发会重新生成
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // upsert = 有则更新，无则插入 —— 避免同一用户重复生成时产生多条记录
    // $transaction 保证两条 upsert 同时成功或同时失败
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
