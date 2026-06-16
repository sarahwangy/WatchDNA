import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

// GET /api/watching/by-date?date=2026-05-16
// Returns videos watched on a specific calendar date
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const date = req.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const events = await db.watchEvent.findMany({
    where: { userId, watchedAt: { gte: start, lte: end } },
    select: {
      watchedAt: true,
      videoTitle: true,
      videoId: true,
      channel: { select: { title: true } },
    },
    orderBy: { watchedAt: 'asc' },
    take: 100,
  });

  const videos = events.map((e) => ({
    videoId: e.videoId,
    title: e.videoTitle,
    channel: e.channel?.title ?? null,
    watchedAt: e.watchedAt.toISOString(),
  }));

  return NextResponse.json({ videos, date });
}
