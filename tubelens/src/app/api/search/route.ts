import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

// GET /api/search?q=keyword
// Searches watch history (by title/channel) and subscriptions (by channel name)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ videos: [], channels: [] });

  // Search watch events by video title (case-insensitive)
  const events = await db.watchEvent.findMany({
    where: {
      userId,
      videoTitle: { contains: q, mode: 'insensitive' },
    },
    select: {
      videoId: true,
      videoTitle: true,
      watchedAt: true,
      channel: { select: { id: true, title: true } },
    },
    orderBy: { watchedAt: 'desc' },
    take: 30,
  });

  // Search subscribed channels by name
  const subs = await db.subscription.findMany({
    where: {
      userId,
      channel: { title: { contains: q, mode: 'insensitive' } },
    },
    include: {
      channel: { select: { id: true, title: true, thumbnailUrl: true, aiCategory: true } },
    },
    take: 20,
  });

  return NextResponse.json({
    videos: events.map((e) => ({
      videoId: e.videoId,
      title: e.videoTitle,
      channelId: e.channel?.id ?? null,
      channelName: e.channel?.title ?? null,
      watchedAt: e.watchedAt.toISOString(),
    })),
    channels: subs.map((s) => ({
      id: s.channel.id,
      title: s.channel.title,
      thumbnailUrl: s.channel.thumbnailUrl,
      aiCategory: s.channel.aiCategory,
    })),
  });
}
