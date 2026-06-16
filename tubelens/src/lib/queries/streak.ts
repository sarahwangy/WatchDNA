import { db } from '@/lib/db';

export interface StreakData {
  currentStreak: number; // 截至今天的连续天数
  longestStreak: number; // 历史最长连续天数
  longestStreakEnd: string; // 最长连续记录的结束日期（YYYY-MM-DD）
}

// 计算连续观看天数（streak）
// 核心算法：把所有有观看记录的日期排序，相邻两天差1天就是连续
export async function getStreakData(userId: string): Promise<StreakData> {
  const events = await db.watchEvent.findMany({
    where: { userId },
    select: { watchedAt: true },
  });

  if (events.length === 0) {
    return { currentStreak: 0, longestStreak: 0, longestStreakEnd: '' };
  }

  // 用 Set 去重日期，再排序（升序）
  const dateSet = new Set(events.map((e) => e.watchedAt.toISOString().split('T')[0]));
  const sortedDates = Array.from(dateSet).sort();

  let longestStreak = 1;
  let longestStreakEnd = sortedDates[0];
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    // 两个日期相差1天（86400000ms）则连续
    const diffDays = (curr.getTime() - prev.getTime()) / 86400000;

    if (diffDays === 1) {
      currentRun++;
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
        longestStreakEnd = sortedDates[i];
      }
    } else {
      currentRun = 1;
    }
  }

  // 计算"当前连续天数"：从今天往前数，连续有记录的天数
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  // 如果今天或昨天有记录，才算当前streak还在继续
  if (dateSet.has(today) || dateSet.has(yesterday)) {
    const startDay = dateSet.has(today) ? today : yesterday;
    const startIdx = sortedDates.lastIndexOf(startDay);
    currentStreak = 1;
    for (let i = startIdx - 1; i >= 0; i--) {
      const curr = new Date(sortedDates[i + 1]);
      const prev = new Date(sortedDates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak, longestStreakEnd };
}
