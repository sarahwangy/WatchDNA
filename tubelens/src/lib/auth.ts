// 所有 API 路由都会调用这个函数
// 它做两件事：
// 1. 确认用户已登录（没登录返回 401）
// 2. 返回 userId（用于数据库查询，确保用户只能看自己的数据）
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { NextResponse } from 'next/server';

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // 返回 null + error response，让调用方直接 return error
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    user: {
      id: (session.user as any).id as string,
      email: session.user.email,
      name: session.user.name,
    },
    error: null,
  };
}
