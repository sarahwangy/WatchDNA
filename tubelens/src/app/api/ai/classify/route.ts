// POST /api/ai/classify — 触发当前用户的频道分类
import { requireUser } from '@/lib/auth';
import { classifyUserChannels } from '@/lib/ai/classify-channels';

export async function POST() {
  // requireUser 是项目封装的认证检查，未登录时返回 401 error response
  const { user, error } = await requireUser();
  if (error) return error;

  const classified = await classifyUserChannels(user!.id);
  return Response.json({ classified });
}
