import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

// GET /api/watching/by-slot?day=0&hour=14
// Returns videos watched on a given weekday (0=Sun) at a given hour
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const day = parseInt(req.nextUrl.searchParams.get('day') ?? '0');
  const hour = parseInt(req.nextUrl.searchParams.get('hour') ?? '0');

  // Fetch all events then filter by weekday + hour in JS
  // (Postgres doesn't support weekday extraction without raw SQL in Prisma)
  const events = await db.watchEvent.findMany({
    where: { userId },
    select: {
      watchedAt: true,
      videoTitle: true,
      videoId: true,
      channelId: true,
      channel: { select: { title: true } },
    },
    orderBy: { watchedAt: 'desc' },
  });

  const filtered = events
    .filter((e) => e.watchedAt.getDay() === day && e.watchedAt.getHours() === hour)
    .slice(0, 50)
    .map((e) => ({
      videoId: e.videoId,
      title: e.videoTitle,
      channel: e.channel?.title ?? null,
      watchedAt: e.watchedAt.toISOString(),
    }));

  return NextResponse.json({ videos: filtered, day, hour });
}
