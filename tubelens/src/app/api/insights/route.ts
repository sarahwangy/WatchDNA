// GET /api/insights — 读取已生成的洞察 + 取消订阅建议
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUnsubscribeSuggestions } from '@/lib/ai/generate-insights';

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const userId = user!.id;

  // 并行查询 AI 洞察和取消订阅建议
  const [insights, unsubscribeSuggestions] = await Promise.all([
    db.insight.findMany({ where: { userId }, orderBy: { generatedAt: 'desc' } }),
    getUnsubscribeSuggestions(userId),
  ]);

  // 把数组转成 { type: content } 的 Map，前端用 key 直接取值更方便
  const insightMap = Object.fromEntries(insights.map((i) => [i.type, i.content]));

  return Response.json({
    viewerProfile: insightMap['viewer_profile'] || null,
    interestShift: insightMap['interest_shift'] || null,
    unsubscribeSuggestions,
    hasInsights: insights.length > 0,
  });
}
