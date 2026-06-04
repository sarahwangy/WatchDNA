import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { HourHeatmap } from '@/components/watching/hour-heatmap';
import { TopChannels } from '@/components/watching/top-channels';
import { getHourlyHeatmap, getTopChannelsFull, getMonthlyTrend } from '@/lib/queries/watching';

export default async function WatchingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as { id: string }).id;

  const [matrix, topChannels, monthlyTrend] = await Promise.all([
    getHourlyHeatmap(userId),
    getTopChannelsFull(userId, 20),
    getMonthlyTrend(userId),
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">观看分析</h1>
          <p className="text-zinc-400 text-sm mt-1">深入了解你的观看习惯</p>
        </div>

        <HourHeatmap matrix={matrix} />

        {monthlyTrend.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">月度观看趋势</h3>
            <div className="flex items-end gap-1 h-32">
              {monthlyTrend.map((m) => {
                const maxVal = Math.max(...monthlyTrend.map((x) => x.count), 1);
                const heightPct = (m.count / maxVal) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      title={`${m.month}: ${m.count}`}
                      className="w-full bg-red-500/60 rounded-sm hover:bg-red-500 transition-colors cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-zinc-600 text-xs">{m.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <TopChannels channels={topChannels} />
      </div>
    </DashboardLayout>
  );
}
