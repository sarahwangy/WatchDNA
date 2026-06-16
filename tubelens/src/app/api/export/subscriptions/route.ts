import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

// GET /api/export/subscriptions
// Returns a CSV file of all subscribed channels with watch counts
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const watchCounts = await db.watchEvent.groupBy({
    by: ['channelId'],
    where: { userId, channelId: { not: null } },
    _count: { id: true },
  });
  const watchMap = new Map(watchCounts.map((w) => [w.channelId, w._count.id]));

  const subs = await db.subscription.findMany({
    where: { userId },
    include: {
      channel: { select: { id: true, title: true, aiCategory: true, subscriberCount: true } },
    },
    orderBy: { channel: { title: 'asc' } },
  });

  // Build CSV rows — escape double quotes inside values
  const escape = (v: string | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const header = [
    'Channel ID',
    'Channel Name',
    'Category',
    'Subscriber Count',
    'Your Watch Count',
  ].join(',');
  const rows = subs.map((s) =>
    [
      escape(s.channel.id),
      escape(s.channel.title),
      escape(s.channel.aiCategory),
      s.channel.subscriberCount != null ? Number(s.channel.subscriberCount) : '',
      watchMap.get(s.channel.id) ?? 0,
    ].join(',')
  );

  const csv = [header, ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tubelens-subscriptions.csv"',
    },
  });
}
