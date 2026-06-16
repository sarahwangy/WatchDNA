'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

// 上传状态机：idle → uploading → processing → done，出错时 → error
type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface UploadZoneProps {
  onUploadComplete: (taskId: string) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // useCallback：避免每次渲染都重新创建函数，依赖项是 onUploadComplete
  const handleFile = useCallback(
    async (file: File) => {
      // 前端校验：只接受 zip，最大 2GB
      if (!file.name.endsWith('.zip')) {
        setError('Please upload a .zip file');
        return;
      }
      if (file.size > 2 * 1024 * 1024 * 1024) {
        setError('File size cannot exceed 2GB');
        return;
      }

      setState('uploading');
      setError(null);

      try {
        // 第一步：从服务端获取上传凭证
        const tokenRes = await fetch('/api/upload', { method: 'POST' });
        const { uploadUrl, blobUrl } = await tokenRes.json();

        // 第二步：直接把文件传到 Vercel Blob（不经过服务器）
        // 用 XMLHttpRequest 是为了能拿到上传进度（fetch API 暂不支持 upload progress）
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error('Upload failed')));
          xhr.onerror = () => reject(new Error('Network error'));
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
        setError(err instanceof Error ? err.message : 'Upload failed, please try again');
        setState('error');
      }
    },
    [onUploadComplete]
  );

  // 处理拖拽放下事件，取出第一个文件交给 handleFile
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
        {/* 隐藏的文件选择框，由点击事件触发 */}
        <input
          id="file-input"
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {/* 根据状态显示不同 UI —— 行业常用的"状态驱动渲染"模式 */}
        {state === 'idle' && (
          <>
            <div className="text-4xl mb-4">📦</div>
            <p className="text-white font-medium mb-1">Drag your Takeout ZIP here</p>
            <p className="text-zinc-400 text-sm">or click to select a file · .zip only · max 2GB</p>
          </>
        )}

        {state === 'uploading' && (
          <>
            <div className="text-4xl mb-4">⬆️</div>
            <p className="text-white font-medium mb-3">Uploading... {progress}%</p>
            {/* 进度条：用内联 style 控制宽度，Tailwind 动态类名不可靠 */}
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
            <p className="text-white font-medium">Parsing data...</p>
            <p className="text-zinc-400 text-sm mt-1">This may take 1-3 minutes</p>
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
              Retry
            </Button>
          </>
        )}
      </div>
      <p className="text-zinc-500 text-xs text-center">
        Your data is used for analysis only and will never be shared with any third party.
      </p>
    </div>
  );
}
