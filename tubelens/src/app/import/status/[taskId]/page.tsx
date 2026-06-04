'use client';

// Task 5b: 导入状态页面
// 职责：显示 ZIP 解析进度，每 3 秒自动刷新状态
// 完成后自动跳转到 dashboard，失败后提供重试入口

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// 任务可能的四种状态（与数据库 status 字段一致）
type Status = 'pending' | 'processing' | 'completed' | 'failed';

interface TaskStatus {
  status: Status;
  fileName: string;
  errorMessage?: string;
}

export default function StatusPage({ params }: { params: { taskId: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<TaskStatus | null>(null);

  // useRef 存 interval ID，避免闭包陷阱
  // 行业模式：定时器 ID 用 ref 存，不用 state（state 变化会触发重渲染）
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 轮询函数：请求一次状态 API
    const poll = async () => {
      try {
        const res = await fetch(`/api/import/${params.taskId}/status`);
        if (!res.ok) return;
        const data: TaskStatus = await res.json();
        setTask(data);

        // 处理完成：停止轮询，1.5 秒后跳转 dashboard
        if (data.status === 'completed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => router.push('/dashboard'), 1500);
        } else if (data.status === 'failed') {
          // 失败：停止轮询，留在页面等用户操作
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    poll(); // 立刻查一次，不用等 3 秒
    intervalRef.current = setInterval(poll, 3000); // 每 3 秒查一次

    // cleanup：组件卸载时清除定时器，避免内存泄漏
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [params.taskId, router]);

  // 每种状态对应的 UI 配置
  const config = {
    pending: { icon: '⏳', text: '等待处理...', color: 'text-yellow-400' },
    processing: { icon: '⚙️', text: '正在解析数据...', color: 'text-blue-400' },
    completed: { icon: '✅', text: '分析完成！即将跳转...', color: 'text-green-400' },
    failed: { icon: '❌', text: '处理失败', color: 'text-red-400' },
  };

  // task 还没加载到时，默认显示 pending 状态
  const current = task ? config[task.status] : config.pending;

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        {/* 状态图标 */}
        <div className="text-6xl mb-6">{current.icon}</div>

        {/* 状态文字 */}
        <h2 className={`text-xl font-semibold mb-2 ${current.color}`}>{current.text}</h2>

        {/* 文件名 */}
        {task?.fileName && <p className="text-zinc-400 text-sm mb-4">{task.fileName}</p>}

        {/* 失败状态：显示错误信息和重试按钮 */}
        {task?.status === 'failed' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
            <p className="text-red-400 text-sm">{task.errorMessage || '未知错误'}</p>
            <button
              onClick={() => router.push('/import')}
              className="mt-3 text-sm text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700"
            >
              重新上传
            </button>
          </div>
        )}

        {/* 处理中状态：显示跳动的小圆点动画 */}
        {(task?.status === 'pending' || task?.status === 'processing' || !task) && (
          <div className="flex justify-center gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                // animationDelay 让三个圆点错开弹跳，产生波浪效果
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
