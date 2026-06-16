interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  longestStreakEnd: string;
}

function formatStreakDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function StreakCard({ currentStreak, longestStreak, longestStreakEnd }: StreakCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Current streak */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔥</span>
          <span className="text-sm text-zinc-400">Current Streak</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white">{currentStreak}</span>
          <span className="text-zinc-500 text-sm mb-1">days</span>
        </div>
        <p className="text-xs text-zinc-600 mt-1">
          {currentStreak === 0
            ? 'No activity yesterday or today'
            : currentStreak === 1
              ? 'Keep it going!'
              : `${currentStreak} days in a row`}
        </p>
      </div>

      {/* Longest streak */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🏆</span>
          <span className="text-sm text-zinc-400">Longest Streak</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white">{longestStreak}</span>
          <span className="text-zinc-500 text-sm mb-1">days</span>
        </div>
        {longestStreakEnd && (
          <p className="text-xs text-zinc-600 mt-1">ended {formatStreakDate(longestStreakEnd)}</p>
        )}
      </div>
    </div>
  );
}
