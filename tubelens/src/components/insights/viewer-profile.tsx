'use client';

import { useState } from 'react';

interface ViewerProfileProps {
  profile: string | null;
  interestShift: string | null;
  onRegenerate: () => Promise<void>;
}

export function ViewerProfile({ profile, interestShift, onRegenerate }: ViewerProfileProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 点击"重新生成"时调用父组件传来的回调，并管理本地加载状态
  async function handleRegenerate() {
    setLoading(true);
    setError(null);
    try {
      await onRegenerate();
    } catch (err) {
      // err instanceof Error 是 TypeScript 推荐的错误类型检查方式
      setError(err instanceof Error ? err.message : 'Generation failed, please try again');
    } finally {
      // finally 块无论成功失败都会执行，适合重置加载状态
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 观众画像卡片 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="font-semibold text-white">Your YouTube Profile</h3>
            {/* AI 生成标签，视觉上区分 AI 内容 */}
            <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">
              AI Generated
            </span>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="text-xs text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generating...' : 'Regenerate ↺'}
          </button>
        </div>

        {/* 错误提示 */}
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        {profile ? (
          // whitespace-pre-wrap 保留 AI 返回的换行格式
          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{profile}</p>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm mb-3">No AI profile yet</p>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Generate My YouTube Profile'}
            </button>
          </div>
        )}
      </div>

      {/* 兴趣变迁卡片：只有有数据时才渲染 */}
      {interestShift && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📈</span>
            <h3 className="font-semibold text-white">Interest Shift Analysis</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{interestShift}</p>
        </div>
      )}
    </div>
  );
}
