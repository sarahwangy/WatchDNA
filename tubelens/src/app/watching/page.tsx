import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { HourHeatmap } from '@/components/watching/hour-heatmap';
import { TopChannels } from '@/components/watching/top-channels';
import { getHourlyHeatmap, getTopChannelsFull, getMonthlyTrend } from '@/lib/queries/watching';
import { getSankeyData } from '@/lib/queries/sankey';
import { getBingeSessions } from '@/lib/queries/binge';
import { BingeSessions } from '@/components/watching/binge-sessions';
import { ChannelComparison } from '@/components/watching/channel-comparison';
import { ExportButton } from '@/components/common/export-button';
import { db } from '@/lib/db';
import dynamic from 'next/dynamic';

// dynamic import 避免 nivo 在服务端渲染时报 "window is not defined"
const SubscriptionSankey = dynamic(
  () => import('@/components/watching/subscription-sankey').then((m) => m.SubscriptionSankey),
  {
    ssr: false,
    loading: () => (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 h-48 animate-pulse" />
    ),
  }
);

export default async function WatchingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as { id: string }).id;

  const [matrix, topChannels, monthlyTrend, sankeyData, bingeSessions, subscribedChannels] =
    await Promise.all([
      getHourlyHeatmap(userId),
      getTopChannelsFull(userId, 20),
      getMonthlyTrend(userId),
      getSankeyData(userId),
      getBingeSessions(userId),
      db.subscription.findMany({
        where: { userId },
        include: { channel: { select: { id: true, title: true } } },
        orderBy: { channel: { title: 'asc' } },
      }),
    ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Watch Analysis</h1>
            <p className="text-zinc-400 text-sm mt-1">Dive deep into your watching habits</p>
          </div>
          <ExportButton href="/api/export/watch-history" label="Export CSV" />
        </div>

        <HourHeatmap matrix={matrix} />

        <SubscriptionSankey data={sankeyData} />

        {monthlyTrend.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Monthly Watch Trend</h3>
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

        <BingeSessions sessions={bingeSessions} />

        <ChannelComparison
          channelOptions={subscribedChannels.map((s) => ({
            id: s.channel.id,
            title: s.channel.title,
          }))}
        />

        <TopChannels channels={topChannels} />
      </div>
    </DashboardLayout>
  );
}
