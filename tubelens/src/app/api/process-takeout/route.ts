// ============================================================
// 数据处理管道的"指挥官"
// 职责：收到 taskId → 下载 ZIP → 依次解析各文件 → 触发富化
// 这是一个内部 API，只接受带 x-internal-secret 的请求
// ============================================================

import { db } from '@/lib/db';
import { loadTakeoutZip } from '@/lib/parsers/zip';
import { parseSubscriptions } from '@/lib/parsers/subscriptions';
import { parseWatchHistory } from '@/lib/parsers/watch-history';
import { parseSearchHistory } from '@/lib/parsers/search-history';
import { NextRequest } from 'next/server';

// 验证内部请求：检查请求头里的 secret 是否和环境变量一致
// 行业常用模式：内部服务间通信用共享 secret，避免暴露给外部用户
function verifyInternalRequest(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-secret');
  return secret === (process.env.NEXTAUTH_SECRET || '');
}

export async function POST(request: NextRequest) {
  // 第一步：鉴权，非内部请求直接拒绝
  if (!verifyInternalRequest(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 第二步：从请求体里取出 taskId
  const { taskId } = await request.json();
  if (!taskId) return Response.json({ error: 'Missing taskId' }, { status: 400 });

  // 第三步：从数据库查找任务记录，确认 blobUrl 存在
  const task = await db.takeoutFile.findUnique({ where: { id: taskId } });
  if (!task?.blobUrl) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  // 第四步：标记为"处理中"，让前端可以显示进度
  await db.takeoutFile.update({
    where: { id: taskId },
    data: { status: 'processing' },
  });

  try {
    // 第五步：从 Blob 存储下载并解压 ZIP 文件
    // loadTakeoutZip 返回 { subscriptions, watchHistory, searchHistory } 三个可选文件对象
    const files = await loadTakeoutZip(task.blobUrl);

    // 记录各类数据解析到的条数
    const results = { subscriptions: 0, watchEvents: 0, searchEvents: 0 };

    // 第六步：逐类解析（文件不存在则跳过，避免因缺少某个文件就整体失败）
    if (files.subscriptions) {
      // async('string') 是 JSZip 的 API，把压缩条目读成字符串
      const csvText = await files.subscriptions.async('string');
      results.subscriptions = await parseSubscriptions(csvText, task.userId);
    }

    if (files.watchHistory) {
      const html = await files.watchHistory.async('string');
      results.watchEvents = await parseWatchHistory(html, task.userId);
    }

    if (files.searchHistory) {
      const html = await files.searchHistory.async('string');
      results.searchEvents = await parseSearchHistory(html, task.userId);
    }

    // 第七步：所有解析完成，标记任务为 completed
    await db.takeoutFile.update({
      where: { id: taskId },
      data: { status: 'completed', processedAt: new Date() },
    });

    // 第八步：异步触发频道富化（fire-and-forget 模式）
    // 不用 await，这样不会阻塞当前请求的返回
    // .catch(console.error) 确保即使富化失败也不会让这里崩溃
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3003';
    fetch(`${baseUrl}/api/enrich/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.NEXTAUTH_SECRET || '',
      },
      body: JSON.stringify({ userId: task.userId }),
    }).catch(console.error);

    return Response.json({ success: true, results });
  } catch (err) {
    // 任何步骤失败 → 记录错误信息，标记任务为 failed
    const message = err instanceof Error ? err.message : 'Unknown error';
    await db.takeoutFile.update({
      where: { id: taskId },
      data: { status: 'failed', errorMessage: message },
    });
    return Response.json({ error: message }, { status: 500 });
  }
}
