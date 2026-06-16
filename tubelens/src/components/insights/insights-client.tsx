'use client';

// 这是"客户端协调层"：把服务端拿到的初始数据传给子组件，并处理用户交互
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ViewerProfile } from './viewer-profile';
import { UnsubscribeList } from './unsubscribe-list';
import { Recommendations } from './recommendations';

interface InsightsClientProps {
  initialProfile: string | null;
  initialInterestShift: string | null;
  unsubscribeSuggestions: Array<{
    id: string;
    title: string;
    thumbnailUrl: string | null;
    subscriberCount: bigint | null;
  }>;
}

export function InsightsClient({
  initialProfile,
  initialInterestShift,
  unsubscribeSuggestions,
}: InsightsClientProps) {
  // useRouter 是 Next.js App Router 的路由钩子，用于编程式导航/刷新
  const router = useRouter();
  // 用 useState 存储 profile，让 UI 可以在重新生成后响应新数据
  const [profile] = useState(initialProfile);
  const [interestShift] = useState(initialInterestShift);

  // 调用后端 API 生成新的 AI 洞察，然后用 router.refresh() 拉取最新数据
  async function handleRegenerate() {
    const res = await fetch('/api/insights/generate', { method: 'POST' });
    if (!res.ok) {
      // .catch(() => ({})) 防止 JSON 解析失败导致的额外错误
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Generation failed');
    }
    // router.refresh() 是 Next.js 特有的：重新请求服务端组件数据，但不整页刷新
    // 行业常用模式：乐观更新 or 刷新数据，这里选择简单可靠的刷新方式
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <ViewerProfile
        profile={profile}
        interestShift={interestShift}
        onRegenerate={handleRegenerate}
      />
      <Recommendations initialContent={null} />
      <UnsubscribeList channels={unsubscribeSuggestions} />
    </div>
  );
}
