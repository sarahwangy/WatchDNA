import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { askClaude } from '@/lib/claude';

// POST /api/insights/recommendations
// Generates "You Might Like" channel type recommendations based on watch history
export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;
  const userId = user!.id;

  // Get top watched categories
  const categories = await db.channel.groupBy({
    by: ['aiCategory'],
    where: {
      watchEvents: { some: { userId } },
      aiCategory: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  // Get already-subscribed channel titles (so we don't recommend what they have)
  const subTitles = await db.subscription.findMany({
    where: { userId },
    include: { channel: { select: { title: true } } },
    take: 30,
  });
  const subList = subTitles.map((s) => s.channel.title).join(', ');

  const categoryStr = categories
    .map((c) => `${c.aiCategory} (${c._count.id} channels watched)`)
    .join(', ');

  if (!categoryStr) {
    return NextResponse.json({
      recommendations: 'Not enough data to generate recommendations. Run AI classification first.',
    });
  }

  const prompt = `You are a YouTube discovery assistant. Based on this viewer's watching habits, recommend 4-5 types of YouTube channels they might enjoy but haven't subscribed to yet.

Their top content categories (by channels watched): ${categoryStr}

Some of their current subscriptions: ${subList || 'None yet'}

Generate recommendations as a numbered list. For each:
1. Name the channel type/niche (be specific, not generic)
2. One sentence explaining why it fits their taste
3. One example creator name or channel style

Be specific and insightful. Write in English.`;

  const result = await askClaude(prompt);
  return NextResponse.json({ recommendations: result });
}
