import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

// GET /api/watching/compare?channels=UCxxx,UCyyy,UCzzz
// Returns monthly watch counts per channel for the past 12 months
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const channelParam = req.nextUrl.searchParams.get('channels') ?? '';
  const channelIds = channelParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (channelIds.length === 0) return NextResponse.json({ months: [], channels: [] });

  // Fetch channel titles for display
  const channelMeta = await db.channel.findMany({
    where: { id: { in: channelIds } },
    select: { id: true, title: true },
  });
  const titleMap = new Map(channelMeta.map((c) => [c.id, c.title]));

  // Fetch all watch events for these channels in the past 12 months
  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const events = await db.watchEvent.findMany({
    where: { userId, channelId: { in: channelIds }, watchedAt: { gte: since } },
    select: { channelId: true, watchedAt: true },
    orderBy: { watchedAt: 'asc' },
  });

  // Group by month + channel: { '2025-06': { UCxxx: 12, UCyyy: 3 } }
  const byMonth: Record<string, Record<string, number>> = {};
  for (const e of events) {
    const month = e.watchedAt.toISOString().slice(0, 7); // YYYY-MM
    if (!byMonth[month]) byMonth[month] = {};
    byMonth[month][e.channelId!] = (byMonth[month][e.channelId!] || 0) + 1;
  }

  // Build sorted month list covering the full 12-month range
  const months: string[] = [];
  const d = new Date(since);
  d.setDate(1);
  while (d <= new Date()) {
    months.push(d.toISOString().slice(0, 7));
    d.setMonth(d.getMonth() + 1);
  }

  // Shape into array of { month, [channelId]: count } for Recharts
  const data = months.map((month) => {
    const row: Record<string, string | number> = { month };
    for (const id of channelIds) {
      row[id] = byMonth[month]?.[id] ?? 0;
    }
    return row;
  });

  return NextResponse.json({
    data,
    channels: channelIds.map((id) => ({ id, title: titleMap.get(id) ?? id })),
  });
}
