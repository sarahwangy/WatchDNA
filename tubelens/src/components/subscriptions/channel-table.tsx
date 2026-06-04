// 纯展示组件（无 'use client'）：不需要交互，在服务端渲染即可
// 这是"行业常用模式"：只展示数据的组件尽量保持为 Server Component，减少客户端 JS 体积

interface Channel {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  country: string | null;
  aiCategory: string | null;
  subscriberCount: bigint | null; // 数据库 BigInt 类型，JS 中要用 Number() 转换才能格式化
  watchCount: number;
  neverWatched: boolean; // 这个项目特有字段：该频道是否从未出现在观看记录里
}

interface ChannelTableProps {
  channels: Channel[];
}

export function ChannelTable({ channels }: ChannelTableProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* 表头：显示总频道数 */}
      <div className="px-5 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400">
          订阅频道列表 <span className="text-zinc-600">({channels.length})</span>
        </h3>
      </div>

      {/* 频道列表：每行是一个频道，用 divide-y 自动加分隔线 */}
      <div className="divide-y divide-zinc-800">
        {/* slice(0, 50)：只显示前 50 个，避免渲染太多 DOM 节点导致页面卡顿 */}
        {channels.slice(0, 50).map((ch) => (
          <div
            key={ch.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition-colors"
          >
            {/* 频道头像：圆形，有图就显示，没图就显示灰色占位 */}
            <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden shrink-0">
              {ch.thumbnailUrl && (
                // 用原生 img 而不是 Next.js Image，因为外部图片域名不固定（YouTube CDN）
                <img src={ch.thumbnailUrl} alt={ch.title} className="w-full h-full object-cover" />
              )}
            </div>

            {/* 频道名 + 订阅者数：flex-1 让它占满中间空间，min-w-0 配合 truncate 防止文字溢出 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{ch.title}</p>
              {ch.subscriberCount && (
                <p className="text-xs text-zinc-500">
                  {/* BigInt 不能直接用 toLocaleString，先转 Number */}
                  {Number(ch.subscriberCount).toLocaleString()} 订阅者
                </p>
              )}
            </div>

            {/* AI 分类标签：只在有分类时显示 */}
            {ch.aiCategory && (
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded shrink-0">
                {ch.aiCategory}
              </span>
            )}

            {/* 观看状态：从未观看显示红色警告，否则显示观看次数 */}
            {ch.neverWatched ? (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded shrink-0">
                从未观看
              </span>
            ) : (
              <span className="text-xs text-zinc-500 font-mono shrink-0">{ch.watchCount} 次</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
