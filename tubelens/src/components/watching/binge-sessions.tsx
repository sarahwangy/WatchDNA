interface BingeSession {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  videoCount: number;
}

interface BingeSessionsProps {
  sessions: BingeSession[];
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BingeSessions({ sessions }: BingeSessionsProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
        <p className="text-zinc-500 text-sm">No binge sessions found (2+ hours straight).</p>
      </div>
    );
  }

  const longest = sessions[0];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400">Binge Sessions</h3>
        <p className="text-xs text-zinc-600 mt-0.5">
          Longest: <span className="text-white">{formatDuration(longest.durationMinutes)}</span> on{' '}
          <span className="text-white">{formatDate(longest.date)}</span>
        </p>
      </div>

      <div className="divide-y divide-zinc-800">
        {sessions.map((s, i) => {
          const barWidth = (s.durationMinutes / longest.durationMinutes) * 100;
          return (
            <div key={i} className="px-5 py-3 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {/* Gold trophy for the longest session */}
                  {i === 0 && <span className="text-sm">🏆</span>}
                  <span className="text-sm text-white font-medium">
                    {formatDuration(s.durationMinutes)}
                  </span>
                  <span className="text-xs text-zinc-500">{s.videoCount} videos</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400">{formatDate(s.date)}</span>
                  <span className="text-xs text-zinc-600 ml-2">
                    {formatTime(s.startTime)}–{formatTime(s.endTime)}
                  </span>
                </div>
              </div>
              {/* Progress bar showing relative length */}
              <div className="w-full bg-zinc-800 rounded-full h-1">
                <div className="bg-red-500/60 h-1 rounded-full" style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
