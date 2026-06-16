import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { CalendarHeatmap } from '@/components/dashboard/calendar-heatmap';
import { getDashboardStats, getTopChannels } from '@/lib/queries/dashboard';
import { getStreakData } from '@/lib/queries/streak';
import { StreakCard } from '@/components/dashboard/streak-card';

export default async function DashboardPage() {
  // 服务端检查登录状态，未登录直接跳转到登录页
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  // session.user.id 来自 NextAuth session callback 注入
  const userId = (session.user as { id: string }).id;

  // Server Component 直接查数据库，无需 API 调用
  // Promise.all 并行发起两个查询，比串行更快
  const [stats, topChannels, streak] = await Promise.all([
    getDashboardStats(userId),
    getTopChannels(userId, 5),
    getStreakData(userId),
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题区域 */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Your YouTube watching overview</p>
        </div>

        {/* KPI 卡片：订阅数、观看次数、活跃天数 */}
        <KpiCards
          subscriptionCount={stats.subscriptionCount}
          watchEventCount={stats.watchEventCount}
          activeDays={stats.activeDays}
        />

        {/* Streak 统计：当前连续天数 + 历史最长 */}
        <StreakCard
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
          longestStreakEnd={streak.longestStreakEnd}
        />

        {/* 日历热力图：按天展示观看频率 */}
        <CalendarHeatmap data={stats.watchByDay} />

        {/* Top 频道排行榜，仅在有数据时显示 */}
        {topChannels.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">
              Top Channels (by watch count)
            </h3>
            <div className="space-y-3">
              {topChannels.map((item, i) => (
                <div key={item.channelId} className="flex items-center gap-3">
                  {/* 排名序号 */}
                  <span className="text-zinc-500 font-mono text-sm w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {/* 优先显示频道名称，无则显示频道 ID */}
                    <p className="text-sm text-white truncate">
                      {item.channel?.title || item.channelId}
                    </p>
                  </div>
                  {/* toLocaleString 自动加千分位逗号，如 1,234 */}
                  <span className="text-zinc-400 text-sm font-mono">
                    {item.watchCount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 没有数据时引导用户上传 */}
        {stats.watchEventCount === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-white font-medium mb-2">No data yet</p>
            <p className="text-zinc-400 text-sm mb-4">
              Upload your Google Takeout ZIP file to start analyzing
            </p>
            <a
              href="/import"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Upload Data →
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
