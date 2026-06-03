// 这个接口用于测试登录状态
// 登录后访问 /api/me 应该返回你的用户信息
import { requireUser } from '@/lib/auth';

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  return Response.json({ userId: user!.id, email: user!.email });
}
