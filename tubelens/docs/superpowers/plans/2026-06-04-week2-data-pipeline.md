# Week 2 数据管道 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的数据管道——用户上传 Google Takeout ZIP → 解压解析订阅/观看/搜索数据 → 存入数据库 → 调用 YouTube API 富化频道元数据。

**Architecture:** 前端直传 ZIP 到 Vercel Blob（绕过服务器避免超时），服务端拿到 Blob URL 后异步处理：JSZip 解压 → cheerio/papaparse 解析各文件 → 批量写入 Prisma → 调用 YouTube Data API v3 富化频道数据。处理进度通过轮询 API 反馈给前端。

**Tech Stack:** `@vercel/blob`（文件存储）、`jszip`（解压）、`papaparse`（CSV 解析）、`cheerio`（HTML 解析）、`@googleapis/youtube`（YouTube API）、Next.js API Routes、Prisma + Neon Postgres

---

## 文件结构

```
src/
├── app/
│   ├── import/
│   │   └── page.tsx              ← 上传页面 UI（拖拽 + 进度）
│   └── api/
│       ├── upload/
│       │   └── route.ts          ← 生成 Blob 上传 token
│       ├── import/
│       │   └── route.ts          ← 创建 TakeoutFile 记录，触发处理
│       ├── import/[taskId]/
│       │   └── status/
│       │       └── route.ts      ← 查询处理进度
│       └── process-takeout/
│           └── route.ts          ← 核心处理：解压→解析→富化
├── lib/
│   ├── parsers/
│   │   ├── zip.ts                ← ZIP 下载与解压
│   │   ├── subscriptions.ts      ← subscriptions.csv 解析
│   │   ├── watch-history.ts      ← watch-history.html 解析
│   │   └── search-history.ts     ← search-history.html 解析
│   └── youtube.ts                ← YouTube Data API 封装
```

---

## Task 1：安装依赖包（TUB-IMPORT-002 前置）

**Files:**

- Modify: `tubelens/package.json`

- [ ] **Step 1: 安装所有 Week 2 需要的包**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npm install jszip papaparse cheerio
npm install --save-dev @types/papaparse @types/cheerio
```

- [ ] **Step 2: 验证安装**

```bash
node -e "require('jszip'); require('papaparse'); require('cheerio'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/package.json tubelens/package-lock.json
git commit -m "chore: install jszip, papaparse, cheerio for data pipeline"
git push
```

---

## Task 2：上传页面 UI（TUB-IMPORT-001）

**Files:**

- Create: `src/app/import/page.tsx`
- Create: `src/components/import/upload-zone.tsx`

- [ ] **Step 1: 创建上传拖拽组件**

创建 `src/components/import/upload-zone.tsx`：

```tsx
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface UploadZoneProps {
  onUploadComplete: (taskId: string) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      // 前端校验：只接受 zip，最大 2GB
      if (!file.name.endsWith('.zip')) {
        setError('请上传 .zip 格式的文件');
        return;
      }
      if (file.size > 2 * 1024 * 1024 * 1024) {
        setError('文件大小不能超过 2GB');
        return;
      }

      setState('uploading');
      setError(null);

      try {
        // 第一步：从服务端获取上传凭证
        const tokenRes = await fetch('/api/upload', { method: 'POST' });
        const { uploadUrl, blobUrl } = await tokenRes.json();

        // 第二步：直接把文件传到 Vercel Blob（不经过服务器）
        // 用 XMLHttpRequest 是为了能拿到上传进度
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error('上传失败')));
          xhr.onerror = () => reject(new Error('网络错误'));
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', 'application/zip');
          xhr.send(file);
        });

        // 第三步：通知服务端开始处理
        setState('processing');
        const importRes = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blobUrl, fileName: file.name, fileSize: file.size }),
        });
        const { taskId } = await importRes.json();
        onUploadComplete(taskId);
      } catch (err) {
        setError(err instanceof Error ? err.message : '上传失败，请重试');
        setState('error');
      }
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      {/* 拖拽区域 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-red-500 bg-red-500/5' : 'border-zinc-700 hover:border-zinc-500'}
          ${state === 'error' ? 'border-red-500/50' : ''}
        `}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {state === 'idle' && (
          <>
            <div className="text-4xl mb-4">📦</div>
            <p className="text-white font-medium mb-1">拖拽 Takeout ZIP 到这里</p>
            <p className="text-zinc-400 text-sm">或点击选择文件 · 仅接受 .zip · 最大 2GB</p>
          </>
        )}

        {state === 'uploading' && (
          <>
            <div className="text-4xl mb-4">⬆️</div>
            <p className="text-white font-medium mb-3">上传中... {progress}%</p>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {state === 'processing' && (
          <>
            <div className="text-4xl mb-4">⚙️</div>
            <p className="text-white font-medium">正在解析数据...</p>
            <p className="text-zinc-400 text-sm mt-1">这可能需要 1-3 分钟</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <p className="text-red-400 font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={(e) => {
                e.stopPropagation();
                setState('idle');
                setError(null);
              }}
            >
              重试
            </Button>
          </>
        )}
      </div>

      {/* 文件格式说明 */}
      <p className="text-zinc-500 text-xs text-center">
        你的数据仅用于分析，不会被分享给任何第三方。
      </p>
    </div>
  );
}
```

- [ ] **Step 2: 创建上传页面（含 Takeout 导出引导）**

创建 `src/app/import/page.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/import/upload-zone';

export default function ImportPage() {
  const router = useRouter();
  const [taskId, setTaskId] = useState<string | null>(null);

  function handleUploadComplete(id: string) {
    setTaskId(id);
    // 跳转到状态页
    router.push(`/import/status/${id}`);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">上传你的 Takeout 数据</h1>
          <p className="text-zinc-400">从 Google Takeout 导出 YouTube 数据，上传后自动分析。</p>
        </div>

        {/* 操作步骤引导 */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { step: '1', title: '导出数据', desc: '去 takeout.google.com 导出 YouTube 数据' },
            { step: '2', title: '上传文件', desc: '把下载的 zip 文件上传到这里' },
            { step: '3', title: '查看报告', desc: 'AI 自动生成你的 YouTube 画像' },
          ].map((item) => (
            <div key={item.step} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-red-500 font-mono text-sm mb-1">步骤 {item.step}</div>
              <div className="font-medium text-sm mb-1">{item.title}</div>
              <div className="text-zinc-500 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>

        <UploadZone onUploadComplete={handleUploadComplete} />

        {/* 快捷链接 */}
        <div className="mt-6 text-center">
          <a
            href="https://takeout.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-red-400 hover:text-red-300 underline"
          >
            还没导出？去 Google Takeout →
          </a>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 验证页面编译**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -10
```

Expected: 无错误

- [ ] **Step 4: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/
git commit -m "feat: add import page UI with drag-drop upload zone (TUB-IMPORT-001)"
git push
```

---

## Task 3：Vercel Blob 直传 API（TUB-IMPORT-002）

**Files:**

- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: 创建上传凭证 API**

创建 `src/app/api/upload/route.ts`：

```typescript
// 这个 API 的作用：生成一个"临时上传凭证"
// 用户拿着这个凭证，直接把文件传到 Vercel Blob 的服务器
// 好处：文件不经过我们的服务器，避免 Vercel 函数 10 秒超时
import { put } from '@vercel/blob';
import { requireUser } from '@/lib/auth';

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  // 生成唯一文件名，防止不同用户文件冲突
  const fileName = `takeout-${user!.id}-${Date.now()}.zip`;

  // handleUpload 返回客户端直传所需的 URL 和 token
  const { url: blobUrl, uploadUrl } = await put(fileName, '', {
    access: 'private',
    multipart: false,
    contentType: 'application/zip',
    // allowedContentTypes 限制只能上传 zip，防止恶意文件
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return Response.json({ uploadUrl, blobUrl });
}
```

**注意**：如果 `@vercel/blob` 的 `put` API 不支持返回 `uploadUrl`，改用 `handleUpload` 方式：

```typescript
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ['application/zip', 'application/x-zip-compressed'],
      maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2GB
    }),
    onUploadCompleted: async ({ blob }) => {
      console.log('Upload completed:', blob.url);
    },
  });

  return Response.json(jsonResponse);
}
```

先试第一种，如果报错再用第二种。

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/app/api/upload/
git commit -m "feat: add Vercel Blob upload token API (TUB-IMPORT-002)"
git push
```

---

## Task 4：创建 TakeoutFile 记录 + 触发处理（TUB-IMPORT-003）

**Files:**

- Create: `src/app/api/import/route.ts`

- [ ] **Step 1: 创建 import API**

创建 `src/app/api/import/route.ts`：

```typescript
// 上传完成后，前端调用这个 API
// 作用：在数据库创建一条"处理任务"记录，然后异步触发解析
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { blobUrl, fileName, fileSize } = await request.json();

  if (!blobUrl || !fileName) {
    return Response.json({ error: 'Missing blobUrl or fileName' }, { status: 400 });
  }

  // 在数据库创建处理任务记录
  const takeoutFile = await db.takeoutFile.create({
    data: {
      userId: user!.id,
      source: 'manual_upload',
      fileName,
      fileSize: BigInt(fileSize),
      blobUrl,
      status: 'pending',
    },
  });

  // 异步触发处理（不等待结果，避免超时）
  // 用 fetch 调用自己的 API，fire-and-forget 模式
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3003';
  fetch(`${baseUrl}/api/process-takeout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.NEXTAUTH_SECRET || '',
    },
    body: JSON.stringify({ taskId: takeoutFile.id }),
  }).catch((err) => console.error('Failed to trigger processing:', err));

  return Response.json({ taskId: takeoutFile.id });
}
```

- [ ] **Step 2: 验证**

```bash
npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/app/api/import/
git commit -m "feat: add import API to create TakeoutFile and trigger processing (TUB-IMPORT-003)"
git push
```

---

## Task 5：处理状态 API + 状态页面（TUB-IMPORT-004 + 005）

**Files:**

- Create: `src/app/api/import/[taskId]/status/route.ts`
- Create: `src/app/import/status/[taskId]/page.tsx`

- [ ] **Step 1: 创建状态查询 API**

创建 `src/app/api/import/[taskId]/status/route.ts`：

```typescript
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const task = await db.takeoutFile.findFirst({
    where: {
      id: params.taskId,
      userId: user!.id, // 严格隔离：只能查自己的任务
    },
  });

  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  return Response.json({
    status: task.status, // 'pending' | 'processing' | 'completed' | 'failed'
    fileName: task.fileName,
    errorMessage: task.errorMessage,
    processedAt: task.processedAt,
  });
}
```

- [ ] **Step 2: 创建处理状态页面**

创建 `src/app/import/status/[taskId]/page.tsx`：

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'pending' | 'processing' | 'completed' | 'failed';

interface TaskStatus {
  status: Status;
  fileName: string;
  errorMessage?: string;
  processedAt?: string;
}

export default function StatusPage({ params }: { params: { taskId: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<TaskStatus | null>(null);

  useEffect(() => {
    // 轮询：每 3 秒查一次状态
    const poll = async () => {
      const res = await fetch(`/api/import/${params.taskId}/status`);
      const data = await res.json();
      setTask(data);

      if (data.status === 'completed') {
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    };

    poll();
    const interval = setInterval(() => {
      if (task?.status === 'completed' || task?.status === 'failed') {
        clearInterval(interval);
        return;
      }
      poll();
    }, 3000);

    return () => clearInterval(interval);
  }, [params.taskId, task?.status, router]);

  const statusConfig = {
    pending: { icon: '⏳', text: '等待处理...', color: 'text-yellow-400' },
    processing: { icon: '⚙️', text: '正在解析数据...', color: 'text-blue-400' },
    completed: { icon: '✅', text: '分析完成！正在跳转...', color: 'text-green-400' },
    failed: { icon: '❌', text: '处理失败', color: 'text-red-400' },
  };

  const config = task ? statusConfig[task.status] : statusConfig.pending;

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">{config.icon}</div>
        <h2 className={`text-xl font-semibold mb-2 ${config.color}`}>{config.text}</h2>
        {task?.fileName && <p className="text-zinc-400 text-sm mb-4">{task.fileName}</p>}
        {task?.status === 'failed' && task.errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
            <p className="text-red-400 text-sm">{task.errorMessage}</p>
            <button
              onClick={() => router.push('/import')}
              className="mt-3 text-sm text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700"
            >
              重新上传
            </button>
          </div>
        )}
        {(task?.status === 'pending' || task?.status === 'processing') && (
          <div className="flex justify-center gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 验证**

```bash
npx tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 4: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/
git commit -m "feat: add import status API and status page (TUB-IMPORT-004,005)"
git push
```

---

## Task 6：ZIP 解压工具（TUB-PARSE-001）

**Files:**

- Create: `src/lib/parsers/zip.ts`

- [ ] **Step 1: 创建 ZIP 解压工具**

创建 `src/lib/parsers/zip.ts`：

```typescript
// 这个文件负责从 Vercel Blob 下载 zip 并识别里面的文件
// Google Takeout 的 zip 结构：Takeout/YouTube and YouTube Music/...
import JSZip from 'jszip';

export interface TakeoutFiles {
  subscriptions: JSZip.JSZipObject | null;
  watchHistory: JSZip.JSZipObject | null;
  searchHistory: JSZip.JSZipObject | null;
  comments: JSZip.JSZipObject | null;
  likedVideos: JSZip.JSZipObject | null;
  playlists: JSZip.JSZipObject[];
}

export async function loadTakeoutZip(blobUrl: string): Promise<TakeoutFiles> {
  // 从 Vercel Blob 下载文件到内存（不写磁盘）
  const response = await fetch(blobUrl);
  if (!response.ok) throw new Error(`Failed to download zip: ${response.status}`);

  const buffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const files: TakeoutFiles = {
    subscriptions: null,
    watchHistory: null,
    searchHistory: null,
    comments: null,
    likedVideos: null,
    playlists: [],
  };

  // 遍历 zip 内所有文件，按名称识别
  zip.forEach((relativePath, file) => {
    if (file.dir) return; // 跳过目录

    const lower = relativePath.toLowerCase();

    if (lower.endsWith('subscriptions.csv')) {
      files.subscriptions = file;
    } else if (lower.endsWith('watch-history.html')) {
      files.watchHistory = file;
    } else if (lower.endsWith('search-history.html')) {
      files.searchHistory = file;
    } else if (lower.endsWith('comments.csv')) {
      files.comments = file;
    } else if (lower.match(/liked.videos\.csv$/)) {
      files.likedVideos = file;
    } else if (lower.includes('playlists/') && lower.endsWith('.csv')) {
      files.playlists.push(file);
    }
  });

  return files;
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/lib/parsers/zip.ts
git commit -m "feat: add zip download and file recognition utility (TUB-PARSE-001)"
git push
```

---

## Task 7：订阅 CSV 解析（TUB-PARSE-002）

**Files:**

- Create: `src/lib/parsers/subscriptions.ts`

- [ ] **Step 1: 创建订阅解析器**

创建 `src/lib/parsers/subscriptions.ts`：

```typescript
// 解析 subscriptions.csv 格式：
// Channel Id,Channel Url,Channel Title
// UCxxxxxx,https://www.youtube.com/channel/UCxxxxxx,Fireship
import Papa from 'papaparse';
import { db } from '@/lib/db';

interface SubscriptionRow {
  'Channel Id': string;
  'Channel Url': string;
  'Channel Title': string;
}

export async function parseSubscriptions(csvText: string, userId: string): Promise<number> {
  const result = Papa.parse<SubscriptionRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  let count = 0;

  // 分批处理，每批 100 条
  const rows = result.data.filter((row) => row['Channel Id']?.startsWith('UC'));

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);

    await db.$transaction(
      batch.map((row) =>
        db.channel.upsert({
          where: { id: row['Channel Id'] },
          update: { title: row['Channel Title'] },
          // upsert：已存在则更新标题，不存在则新建
          create: {
            id: row['Channel Id'],
            title: row['Channel Title'],
          },
        })
      )
    );

    await db.$transaction(
      batch.map((row) =>
        db.subscription.upsert({
          where: { userId_channelId: { userId, channelId: row['Channel Id'] } },
          update: {},
          create: { userId, channelId: row['Channel Id'] },
        })
      )
    );

    count += batch.length;
  }

  return count; // 返回成功解析的数量
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/lib/parsers/subscriptions.ts
git commit -m "feat: add subscriptions.csv parser (TUB-PARSE-002)"
git push
```

---

## Task 8：观看历史 HTML 解析（TUB-PARSE-003）

**Files:**

- Create: `src/lib/parsers/watch-history.ts`

- [ ] **Step 1: 创建观看历史解析器**

创建 `src/lib/parsers/watch-history.ts`：

```typescript
// watch-history.html 的 DOM 结构：
// <div class="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1">
//   <a href="https://www.youtube.com/watch?v=xxx">视频标题</a>
//   <br><a href="https://www.youtube.com/channel/UCxxx">频道名</a>
//   <br>2024年1月15日 23:45:00 UTC+8
// </div>
import * as cheerio from 'cheerio';
import { db } from '@/lib/db';

interface WatchEntry {
  videoId: string | null;
  videoTitle: string;
  channelId: string | null;
  channelTitle: string | null;
  watchedAt: Date | null;
}

function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

function extractChannelId(url: string): string | null {
  const match = url.match(/channel\/(UC[^/?]+)/);
  return match ? match[1] : null;
}

function parseWatchTime(text: string): Date | null {
  // Takeout 的时间格式多样，尝试几种格式
  const cleaned = text.trim().replace(/\s+/g, ' ');
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? null : date;
}

export async function parseWatchHistory(html: string, userId: string): Promise<number> {
  const $ = cheerio.load(html);
  const entries: WatchEntry[] = [];

  // 找所有观看记录 cell
  $('.content-cell').each((_, el) => {
    const cell = $(el);
    const links = cell.find('a');

    if (links.length === 0) return; // 跳过没有链接的 cell（广告等）

    const videoLink = links.eq(0);
    const videoUrl = videoLink.attr('href') || '';
    const videoTitle = videoLink.text().trim();

    // 跳过非 YouTube 视频链接
    if (!videoUrl.includes('youtube.com/watch') && !videoUrl.includes('youtu.be')) return;
    if (!videoTitle) return;

    const channelLink = links.eq(1);
    const channelUrl = channelLink.attr('href') || '';
    const channelTitle = channelLink.text().trim() || null;

    // 提取时间：在最后一个 <br> 之后的文字
    const cellText = cell.text();
    const lastLine =
      cellText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .at(-1) || '';
    const watchedAt = parseWatchTime(lastLine);

    entries.push({
      videoId: extractVideoId(videoUrl),
      videoTitle,
      channelId: extractChannelId(channelUrl),
      channelTitle,
      watchedAt,
    });
  });

  // 分批写入数据库，每批 500 条
  let count = 0;
  for (let i = 0; i < entries.length; i += 500) {
    const batch = entries.slice(i, i + 500);

    // 先 upsert Channel（只有已知 channelId 的）
    const channelsToUpsert = batch.filter((e) => e.channelId && e.channelTitle);
    if (channelsToUpsert.length > 0) {
      await db.$transaction(
        channelsToUpsert.map((e) =>
          db.channel.upsert({
            where: { id: e.channelId! },
            update: {},
            create: { id: e.channelId!, title: e.channelTitle! },
          })
        )
      );
    }

    // 批量写入 WatchEvent
    await db.watchEvent.createMany({
      data: batch.map((e) => ({
        userId,
        videoId: null, // Video 表在这里不预先创建，保持轻量
        channelId: e.channelId,
        videoTitle: e.videoTitle,
        watchedAt: e.watchedAt || new Date(),
      })),
      skipDuplicates: true,
    });

    count += batch.length;
  }

  return count;
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/lib/parsers/watch-history.ts
git commit -m "feat: add watch-history.html parser with batch insert (TUB-PARSE-003)"
git push
```

---

## Task 9：搜索历史解析（TUB-PARSE-004）

**Files:**

- Create: `src/lib/parsers/search-history.ts`

- [ ] **Step 1: 创建搜索历史解析器**

创建 `src/lib/parsers/search-history.ts`：

```typescript
// search-history.html 结构与 watch-history.html 类似
// 链接格式：https://www.youtube.com/results?search_query=xxx
import * as cheerio from 'cheerio';
import { db } from '@/lib/db';

export async function parseSearchHistory(html: string, userId: string): Promise<number> {
  const $ = cheerio.load(html);
  const entries: { query: string; searchedAt: Date }[] = [];

  $('.content-cell').each((_, el) => {
    const cell = $(el);
    const link = cell.find('a').first();
    const href = link.attr('href') || '';

    // 只处理搜索链接
    if (!href.includes('search_query=')) return;

    const url = new URL(href);
    const query = url.searchParams.get('search_query');
    if (!query) return;

    const cellText = cell.text();
    const lastLine =
      cellText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .at(-1) || '';
    const searchedAt = new Date(lastLine);

    entries.push({
      query: decodeURIComponent(query),
      searchedAt: isNaN(searchedAt.getTime()) ? new Date() : searchedAt,
    });
  });

  // 批量写入
  for (let i = 0; i < entries.length; i += 500) {
    await db.searchEvent.createMany({
      data: entries.slice(i, i + 500).map((e) => ({ userId, ...e })),
      skipDuplicates: true,
    });
  }

  return entries.length;
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/lib/parsers/search-history.ts
git commit -m "feat: add search-history.html parser (TUB-PARSE-004)"
git push
```

---

## Task 10：核心处理 API（process-takeout）

**Files:**

- Create: `src/app/api/process-takeout/route.ts`

- [ ] **Step 1: 创建处理路由**

创建 `src/app/api/process-takeout/route.ts`：

```typescript
// 这是整个数据管道的"指挥官"
// 收到 taskId → 下载 zip → 解析各文件 → 写入数据库 → 触发富化
import { db } from '@/lib/db';
import { loadTakeoutZip } from '@/lib/parsers/zip';
import { parseSubscriptions } from '@/lib/parsers/subscriptions';
import { parseWatchHistory } from '@/lib/parsers/watch-history';
import { parseSearchHistory } from '@/lib/parsers/search-history';
import { NextRequest } from 'next/server';

// 简单的内部请求验证，防止外部直接调用
function verifyInternalRequest(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-secret');
  return secret === (process.env.NEXTAUTH_SECRET || '');
}

export async function POST(request: NextRequest) {
  if (!verifyInternalRequest(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { taskId } = await request.json();
  if (!taskId) return Response.json({ error: 'Missing taskId' }, { status: 400 });

  // 取出任务记录
  const task = await db.takeoutFile.findUnique({ where: { id: taskId } });
  if (!task || !task.blobUrl) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  // 标记为处理中
  await db.takeoutFile.update({
    where: { id: taskId },
    data: { status: 'processing' },
  });

  try {
    // 1. 下载并解压 zip
    const files = await loadTakeoutZip(task.blobUrl);

    const results = { subscriptions: 0, watchEvents: 0, searchEvents: 0 };

    // 2. 解析订阅列表
    if (files.subscriptions) {
      const csvText = await files.subscriptions.async('string');
      results.subscriptions = await parseSubscriptions(csvText, task.userId);
    }

    // 3. 解析观看历史
    if (files.watchHistory) {
      const html = await files.watchHistory.async('string');
      results.watchEvents = await parseWatchHistory(html, task.userId);
    }

    // 4. 解析搜索历史
    if (files.searchHistory) {
      const html = await files.searchHistory.async('string');
      results.searchEvents = await parseSearchHistory(html, task.userId);
    }

    // 5. 标记完成
    await db.takeoutFile.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        processedAt: new Date(),
      },
    });

    // 6. 异步触发 YouTube API 富化（不阻塞返回）
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
    const message = err instanceof Error ? err.message : 'Unknown error';
    await db.takeoutFile.update({
      where: { id: taskId },
      data: { status: 'failed', errorMessage: message },
    });
    return Response.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 验证编译**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/app/api/process-takeout/
git commit -m "feat: add process-takeout pipeline API (TUB-PARSE-001~004 integration)"
git push
```

---

## Task 11：YouTube API 封装（TUB-ENRICH-002）

**Files:**

- Create: `src/lib/youtube.ts`

> ⚠️ **前置条件**：需要先去 [Google Cloud Console](https://console.cloud.google.com) 开启 YouTube Data API v3 并创建 API Key，填入 `.env.local` 的 `YOUTUBE_API_KEY`。

- [ ] **Step 1: 创建 YouTube API 封装**

创建 `src/lib/youtube.ts`：

```typescript
// 封装 YouTube Data API v3 的 channels.list 接口
// 每次最多查 50 个频道（API 限制），自动分批
export interface ChannelData {
  id: string;
  title: string;
  description: string | null;
  country: string | null;
  customUrl: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
  viewCount: number | null;
  publishedAt: Date | null;
  topicCategories: string[];
}

export async function fetchChannels(channelIds: string[]): Promise<ChannelData[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not set');

  const results: ChannelData[] = [];

  // 每批最多 50 个 ID（YouTube API 限制）
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);

    const params = new URLSearchParams({
      part: 'snippet,statistics,topicDetails,brandingSettings',
      id: batch.join(','),
      key: apiKey,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`YouTube API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();

    for (const item of data.items || []) {
      results.push({
        id: item.id,
        title: item.snippet?.title ?? '',
        description: item.snippet?.description ?? null,
        country: item.snippet?.country ?? null,
        customUrl: item.snippet?.customUrl ?? null,
        thumbnailUrl: item.snippet?.thumbnails?.default?.url ?? null,
        subscriberCount: item.statistics?.subscriberCount
          ? parseInt(item.statistics.subscriberCount)
          : null,
        videoCount: item.statistics?.videoCount ? parseInt(item.statistics.videoCount) : null,
        viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount) : null,
        publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : null,
        topicCategories: item.topicDetails?.topicCategories ?? [],
      });
    }

    // 防止请求过快（每批之间等 100ms）
    if (i + 50 < channelIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/lib/youtube.ts
git commit -m "feat: add YouTube Data API channels.list wrapper (TUB-ENRICH-002)"
git push
```

---

## Task 12：频道富化路由（TUB-ENRICH-003 + 005）

**Files:**

- Create: `src/app/api/enrich/channels/route.ts`

- [ ] **Step 1: 创建富化 API**

创建 `src/app/api/enrich/channels/route.ts`：

```typescript
// 这个 API 负责：
// 1. 找出用户订阅的、还没富化过的频道
// 2. 批量调用 YouTube API 获取频道详情
// 3. 把结果更新到 Channel 表
import { db } from '@/lib/db';
import { fetchChannels } from '@/lib/youtube';
import { NextRequest } from 'next/server';

function verifyInternalRequest(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-secret');
  return secret === (process.env.NEXTAUTH_SECRET || '');
}

export async function POST(request: NextRequest) {
  if (!verifyInternalRequest(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await request.json();

  // 找出该用户订阅的频道中，7天内没有富化过的
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const channels = await db.channel.findMany({
    where: {
      subscriptions: { some: { userId } },
      OR: [{ enrichedAt: null }, { enrichedAt: { lt: sevenDaysAgo } }],
    },
    select: { id: true },
    take: 200, // 单次最多处理 200 个，防止超时
  });

  if (channels.length === 0) {
    return Response.json({ enriched: 0 });
  }

  const channelIds = channels.map((c) => c.id);

  try {
    const enrichedData = await fetchChannels(channelIds);

    // 批量更新 Channel 表
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
            enrichedAt: new Date(),
          },
        })
      )
    );

    return Response.json({ enriched: enrichedData.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Enrichment failed:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 最终 build 验证**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA/tubelens
npm run build 2>&1 | grep -E "error|Error|✓|success" | head -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: 提交**

```bash
cd /Users/sha/Code/AI-code-26/8-YouTube-watchDNA
git add tubelens/src/app/api/enrich/
git commit -m "feat: add channel enrichment API with YouTube Data API (TUB-ENRICH-003,005)"
git push
```

---

## Week 2 完成标准

完成以上 12 个 Task 后：

- ✅ 用户能上传 ZIP 文件，看到处理进度
- ✅ ZIP 被解压，订阅/观看/搜索数据写入数据库
- ✅ 频道元数据通过 YouTube API 自动富化
- ✅ 所有 API 都有鉴权保护
- ✅ build 通过，可以部署到 Vercel

**下一步：Week 3 — 数据可视化**（VIZ-001~009，PAGE-003~005）
