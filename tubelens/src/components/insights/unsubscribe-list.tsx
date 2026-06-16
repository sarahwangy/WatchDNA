// 这是纯展示组件（无状态），只接收数据并渲染列表
interface Channel {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  // bigint 是 Prisma 处理数据库 BIGINT 类型的方式，比普通 number 能存更大的数
  subscriberCount: bigint | null;
}

interface UnsubscribeListProps {
  channels: Channel[];
}

export function UnsubscribeList({ channels }: UnsubscribeListProps) {
  // 空状态：没有需要清理的频道时给用户正面反馈
  if (channels.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
        <span className="text-2xl">🎉</span>
        <p className="text-white font-medium mt-2">All your subscriptions are active!</p>
        <p className="text-zinc-400 text-sm mt-1">No channels to clean up</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* 卡片头部：标题 + 频道数量 badge */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🧹</span>
          <h3 className="font-semibold text-white">Suggested Unsubscribes</h3>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
            {channels.length}
          </span>
        </div>
        <span className="text-xs text-zinc-500">Zero watches in 6 months</span>
      </div>
      {/* divide-y 在每个子元素之间加分隔线，比手动加 border-b 更简洁 */}
      <div className="divide-y divide-zinc-800">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-800/50 transition-colors"
          >
            {/* 频道头像 */}
            <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden shrink-0">
              {ch.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ch.thumbnailUrl} alt={ch.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={`https://www.youtube.com/channel/${ch.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white hover:text-red-400 transition-colors truncate block"
              >
                {ch.title}
              </a>
              {ch.subscriberCount && (
                <p className="text-xs text-zinc-500">
                  {/* bigint 需要先转 Number 才能用 toLocaleString 格式化 */}
                  {Number(ch.subscriberCount).toLocaleString()} subscribers
                </p>
              )}
            </div>
            {/* 直接跳转 YouTube 频道页，让用户自行取消订阅 */}
            <a
              href={`https://www.youtube.com/channel/${ch.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-400 hover:text-red-300 shrink-0 transition-colors"
            >
              Unsubscribe →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
