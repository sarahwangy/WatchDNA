'use client';

import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/import/upload-zone';

// 这是 /import 路由的页面组件（Next.js App Router：文件即路由）
export default function ImportPage() {
  // useRouter：Next.js 提供的客户端导航 hook，行业常用
  const router = useRouter();

  // 上传完成后，带着 taskId 跳转到状态页
  function handleUploadComplete(taskId: string) {
    router.push(`/import/status/${taskId}`);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">上传你的 Takeout 数据</h1>
          <p className="text-zinc-400">从 Google Takeout 导出 YouTube 数据，上传后自动分析。</p>
        </div>

        {/* 3步操作引导 —— 用 .map() 渲染列表是 React 里最常见的模式 */}
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

        {/* 上传区域：拆成独立组件，职责分离 */}
        <UploadZone onUploadComplete={handleUploadComplete} />

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
