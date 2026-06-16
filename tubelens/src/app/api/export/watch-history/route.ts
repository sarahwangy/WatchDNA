import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

// GET /api/export/watch-history
// Returns a CSV file of full watch history
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const events = await db.watchEvent.findMany({
    where: { userId },
    select: {
      watchedAt: true,
      videoTitle: true,
      videoId: true,
      channel: { select: { title: true } },
    },
    orderBy: { watchedAt: 'desc' },
  });

  const escape = (v: string | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const header = ['Watched At', 'Video Title', 'Video ID', 'Channel', 'YouTube URL'].join(',');
  const rows = events.map((e) =>
    [
      escape(e.watchedAt.toISOString()),
      escape(e.videoTitle),
      escape(e.videoId),
      escape(e.channel?.title),
      e.videoId ? `https://www.youtube.com/watch?v=${e.videoId}` : '',
    ].join(',')
  );

  const csv = [header, ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tubelens-watch-history.csv"',
    },
  });
}
