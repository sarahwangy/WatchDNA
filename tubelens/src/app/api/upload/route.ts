// Task 3: 上传预签名 URL 生成接口
// 职责：生成一个临时凭证，让前端可以直接把 ZIP 文件上传到 Vercel Blob
// 好处：大文件不经过我们的服务器，避免 Vercel 函数 10 秒超时限制
// 行业模式：这叫"客户端直传"（client-side upload），S3/OSS/Blob 都有类似机制

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // 先鉴权：没登录就直接返回 401，不继续执行
  const { user, error } = await requireUser();
  if (error) return error;

  // 解析前端传来的 body（包含上传意图信息）
  const body = (await request.json()) as HandleUploadBody;

  // handleUpload 是 @vercel/blob/client 提供的工具函数
  // 它处理两个阶段：
  //   1. generate-client-token：生成临时 token，前端用它直传
  //   2. upload-complete：上传完成后的回调（可选处理）
  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      // 只允许上传 ZIP 文件
      allowedContentTypes: ['application/zip', 'application/x-zip-compressed'],
      // 最大 2GB（2 * 1024 * 1024 * 1024 字节）
      maximumSizeInBytes: 2 * 1024 * 1024 * 1024,
      // 把 userId 存进 token，upload-complete 阶段可以取出
      tokenPayload: JSON.stringify({ userId: user!.id }),
    }),
    onUploadCompleted: async ({ blob }) => {
      // 上传完成时的钩子，目前只打日志
      // 生产环境可在这里触发后续处理流程
      console.log('Blob uploaded successfully:', blob.url);
    },
  });

  return Response.json(jsonResponse);
}
