// Server Component（默认）：整个页面在服务端运行，直接查数据库，不暴露给浏览器
// 这是 Next.js App Router 的核心模式：页面级组件默认是 Server Component

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CategoryPie } from '@/components/subscriptions/category-pie';
import { ChannelTable } from '@/components/subscriptions/channel-table';
import { getSubscriptionsByCategory, getSubscriptionChannels } from '@/lib/queries/subscriptions';
import { ExportButton } from '@/components/common/export-button';

export default async function SubscriptionsPage() {
  // 服务端获取登录 session：行业常用模式，用于保护需要登录才能访问的页面
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login'); // 未登录直接跳转，不渲染任何内容

  // 从 session 取出用户 ID（类型断言：告诉 TS 这里的 user 对象有 id 字段）
  const userId = (session.user as { id: string }).id;

  // Promise.all：同时发起两个数据库查询，比串行写法快一倍
  // 行业常用模式：多个无依赖关系的异步操作，用 Promise.all 并行执行
  const [categories, channels] = await Promise.all([
    getSubscriptionsByCategory(userId), // 返回 [{name, value}] 格式，给饼图用
    getSubscriptionChannels(userId), // 返回频道列表，给表格用
  ]);

  // 在服务端提前算好"从未观看"数量，避免把计算逻辑分散到客户端组件里
  const neverWatchedCount = channels.filter((c) => c.neverWatched).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题区：显示订阅总数和从未观看数 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Subscription Analysis</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {channels.length} subscribed channels · {neverWatchedCount} never watched
            </p>
          </div>
          <ExportButton href="/api/export/subscriptions" label="Export CSV" />
        </div>

        {/* 上半部分：饼图 + 快速统计，两列布局 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 分类饼图：传入 [{name, value}] 数据 */}
          <CategoryPie data={categories} />

          {/* 快速统计卡片：用数组 map 渲染，避免重复写相同结构的 JSX */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Subscriptions', value: channels.length, color: 'text-white' },
                { label: 'Never Watched', value: neverWatchedCount, color: 'text-red-400' },
                {
                  label: 'Active Channels',
                  value: channels.length - neverWatchedCount,
                  color: 'text-green-400',
                },
                {
                  label: 'Silent Rate',
                  // 三元运算符防止除以 0
                  value: `${channels.length > 0 ? Math.round((neverWatchedCount / channels.length) * 100) : 0}%`,
                  color: 'text-zinc-300',
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-zinc-400 text-sm">{item.label}</span>
                  {/* font-mono：等宽字体让数字对齐更好看，行业常见做法 */}
                  <span className={`font-mono ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 下半部分：频道详细列表 */}
        <ChannelTable channels={channels} />
      </div>
    </DashboardLayout>
  );
}
