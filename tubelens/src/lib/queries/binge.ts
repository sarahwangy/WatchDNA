import { db } from '@/lib/db';

export interface BingeSession {
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  videoCount: number;
}

const GAP_MINUTES = 30; // 两个视频间隔超过30分钟则断开
const MIN_MINUTES = 120; // 至少连续2小时才算 binge session

export async function getBingeSessions(userId: string): Promise<BingeSession[]> {
  const events = await db.watchEvent.findMany({
    where: { userId },
    select: { watchedAt: true },
    orderBy: { watchedAt: 'asc' },
  });

  if (events.length < 2) return [];

  const sessions: BingeSession[] = [];
  const GAP_MS = GAP_MINUTES * 60 * 1000;

  // 滑动窗口分组：相邻视频间隔 > 30min 则切断，开始新的 session
  let sessionStart = events[0].watchedAt;
  let sessionEnd = events[0].watchedAt;
  let count = 1;

  for (let i = 1; i < events.length; i++) {
    const gap = events[i].watchedAt.getTime() - events[i - 1].watchedAt.getTime();

    if (gap <= GAP_MS) {
      // 连续：延伸当前 session
      sessionEnd = events[i].watchedAt;
      count++;
    } else {
      // 断开：保存当前 session（如果达到最小时长）
      const durationMinutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 60000);
      if (durationMinutes >= MIN_MINUTES) {
        sessions.push({
          date: sessionStart.toISOString().split('T')[0],
          startTime: sessionStart.toISOString(),
          endTime: sessionEnd.toISOString(),
          durationMinutes,
          videoCount: count,
        });
      }
      // 开始新 session
      sessionStart = events[i].watchedAt;
      sessionEnd = events[i].watchedAt;
      count = 1;
    }
  }

  // 处理最后一个 session
  const durationMinutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 60000);
  if (durationMinutes >= MIN_MINUTES) {
    sessions.push({
      date: sessionStart.toISOString().split('T')[0],
      startTime: sessionStart.toISOString(),
      endTime: sessionEnd.toISOString(),
      durationMinutes,
      videoCount: count,
    });
  }

  // 按时长降序，返回最长的 10 个
  return sessions.sort((a, b) => b.durationMinutes - a.durationMinutes).slice(0, 10);
}
