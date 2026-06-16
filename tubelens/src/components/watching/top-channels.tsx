interface TopChannelsProps {
  channels: Array<{
    channelId: string | null;
    watchCount: number;
    percentage: number;
    channel?: {
      id: string;
      title: string;
      thumbnailUrl: string | null;
      aiCategory: string | null;
    } | null;
  }>;
}

export function TopChannels({ channels }: TopChannelsProps) {
  const maxCount = channels[0]?.watchCount || 1;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Top Channels</h3>
      <div className="space-y-3">
        {channels.map((item, i) => (
          <div key={item.channelId || i} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-zinc-600 font-mono text-xs w-5 shrink-0">{i + 1}</span>
                {item.channelId ? (
                  <a
                    href={`https://www.youtube.com/channel/${item.channelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white hover:text-red-400 transition-colors truncate"
                  >
                    {item.channel?.title || item.channelId}
                  </a>
                ) : (
                  <span className="text-sm text-white truncate">Unknown Channel</span>
                )}
                {item.channel?.aiCategory && (
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                    {item.channel.aiCategory}
                  </span>
                )}
              </div>
              <span className="text-zinc-400 font-mono text-xs shrink-0 ml-2">
                {item.watchCount.toLocaleString()} ({item.percentage}%)
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1">
              <div
                className="bg-red-500/60 h-1 rounded-full"
                style={{ width: `${(item.watchCount / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
