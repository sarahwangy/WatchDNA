'use client';

import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/import/upload-zone';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

// 这是 /import 路由的页面组件（Next.js App Router：文件即路由）
export default function ImportPage() {
  // useRouter：Next.js 提供的客户端导航 hook，行业常用
  const router = useRouter();

  // 上传完成后，带着 taskId 跳转到状态页
  function handleUploadComplete(taskId: string) {
    router.push(`/import/status/${taskId}`);
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Upload Your Takeout Data</h1>
          <p className="text-zinc-400">
            Export your YouTube data from Google Takeout and upload it for automatic analysis.
          </p>
        </div>

        {/* 3步操作引导 —— 用 .map() 渲染列表是 React 里最常见的模式 */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            {
              step: '1',
              title: 'Export Data',
              desc: 'Go to takeout.google.com and export your YouTube data',
            },
            { step: '2', title: 'Upload File', desc: 'Upload the downloaded zip file here' },
            {
              step: '3',
              title: 'View Report',
              desc: 'AI automatically generates your YouTube profile',
            },
          ].map((item) => (
            <div key={item.step} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="text-red-500 font-mono text-sm mb-1">Step {item.step}</div>
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
            Haven&apos;t exported yet? Go to Google Takeout →
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
