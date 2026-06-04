// Task 5a: 任务状态查询接口
// 职责：前端每 3 秒轮询一次，查询 ZIP 解析任务的进度
// 行级隔离：用 userId + taskId 双重过滤，确保用户只能查自己的任务

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  // Next.js App Router 把动态路由参数放在第二个参数的 params 里
  { params }: { params: { taskId: string } }
) {
  // 鉴权：确认用户已登录
  const { user, error } = await requireUser();
  if (error) return error;

  // 严格行级隔离：同时过滤 id 和 userId
  // 即使攻击者猜到别人的 taskId，也查不到（因为 userId 不匹配）
  const task = await db.takeoutFile.findFirst({
    where: {
      id: params.taskId,
      userId: user!.id, // 关键安全检查：只能查自己的任务
    },
  });

  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  // 只返回前端需要的字段，不暴露 blobUrl 等敏感信息
  return Response.json({
    status: task.status,
    fileName: task.fileName,
    errorMessage: task.errorMessage,
    processedAt: task.processedAt,
  });
}
