// Task 4: 导入任务创建接口
// 职责：前端上传完 ZIP 后调用此 API，在数据库创建"处理任务"记录
// 然后 fire-and-forget 触发解析，前端立刻拿到 taskId 去轮询状态

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // 鉴权：确认用户已登录
  const { user, error } = await requireUser();
  if (error) return error;

  // 从请求体解析上传后的文件信息
  const { blobUrl, fileName, fileSize } = await request.json();

  // 参数校验：这两个字段是必须的
  if (!blobUrl || !fileName) {
    return Response.json({ error: 'Missing blobUrl or fileName' }, { status: 400 });
  }

  // 在数据库创建任务记录，status 初始为 'pending'（等待处理）
  // BigInt 用于存储文件大小，因为 2GB 超过 JS Number 安全范围
  const takeoutFile = await db.takeoutFile.create({
    data: {
      userId: user!.id,
      source: 'manual_upload',
      fileName,
      fileSize: BigInt(fileSize || 0),
      blobUrl,
      status: 'pending',
    },
  });

  // Fire-and-forget 模式：异步触发处理，但不等待结果
  // 行业常见做法：让耗时操作异步执行，API 快速返回 taskId
  // 前端拿到 taskId 后，自己去轮询 /api/import/[taskId]/status
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3003';
  fetch(`${baseUrl}/api/process-takeout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 内部服务间鉴权：用 secret 防止外部直接调用 process-takeout
      'x-internal-secret': process.env.NEXTAUTH_SECRET || '',
    },
    body: JSON.stringify({ taskId: takeoutFile.id }),
  }).catch((err) => console.error('Failed to trigger processing:', err));
  // .catch 确保即使触发失败，主请求不会崩溃

  // 立刻返回 taskId，前端用它查询进度
  return Response.json({ taskId: takeoutFile.id });
}
