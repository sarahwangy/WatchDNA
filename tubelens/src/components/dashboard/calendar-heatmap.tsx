'use client';

import { useState } from 'react';

interface CalendarHeatmapProps {
  data: Record<string, number>;
}

interface DayVideo {
  videoId: string | null;
  title: string;
  channel: string | null;
  watchedAt: string;
}

function getColorClass(count: number, max: number): string {
  if (count === 0) return 'bg-zinc-800';
  const ratio = count / max;
  if (ratio < 0.2) return 'bg-red-900/40';
  if (ratio < 0.4) return 'bg-red-800/60';
  if (ratio < 0.6) return 'bg-red-700/70';
  if (ratio < 0.8) return 'bg-red-600/80';
  return 'bg-red-500';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);
  const [panel, setPanel] = useState<{ date: string; videos: DayVideo[]; loading: boolean } | null>(
    null
  );

  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: data[dateStr] || 0 });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const startYear = days[0].date.slice(0, 4);
  const endYear = days[days.length - 1].date.slice(0, 4);
  const yearLabel = startYear === endYear ? startYear : `${startYear}–${endYear}`;

  async function handleCellClick(date: string, count: number) {
    if (count === 0) return;
    setPanel({ date, videos: [], loading: true });
    const res = await fetch(`/api/watching/by-date?date=${date}`);
    const data = await res.json();
    setPanel({ date, videos: data.videos, loading: false });
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400">Watch Activity (Past Year)</h3>
        <span className="text-xs text-zinc-600">{yearLabel}</span>
      </div>

      <div className="flex gap-1" onMouseLeave={() => setTooltip(null)}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${getColorClass(day.count, maxCount)} transition-all ${
                  day.count > 0 ? 'cursor-pointer hover:ring-1 hover:ring-white/40' : ''
                } ${panel?.date === day.date ? 'ring-2 ring-white/60' : ''}`}
                onMouseEnter={(e) => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  const parent = (e.target as HTMLElement)
                    .closest('.relative')!
                    .getBoundingClientRect();
                  setTooltip({
                    x: rect.left - parent.left + rect.width / 2,
                    y: rect.top - parent.top - 8,
                    date: day.date,
                    count: day.count,
                  });
                }}
                onClick={() => handleCellClick(day.date, day.count)}
              />
            ))}
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-lg -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="text-white font-medium">{formatDate(tooltip.date)}</div>
          <div className="text-zinc-400 mt-0.5">
            {tooltip.count === 0
              ? 'No watches'
              : `${tooltip.count} ${tooltip.count === 1 ? 'watch' : 'watches'}`}
            {tooltip.count > 0 && <span className="text-zinc-600"> · click to view</span>}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-zinc-500">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${getColorClass(Math.ceil(r * maxCount), maxCount)}`}
          />
        ))}
        <span className="text-xs text-zinc-500">More</span>
      </div>

      {/* Video panel for clicked day */}
      {panel && (
        <div className="mt-4 border border-zinc-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800">
            <span className="text-sm font-medium text-white">
              {formatDate(panel.date)}
              {!panel.loading && (
                <span className="text-zinc-400 font-normal ml-2">
                  ({panel.videos.length} videos)
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="text-zinc-400 hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          {panel.loading ? (
            <div className="px-4 py-6 text-center text-zinc-500 text-sm">Loading...</div>
          ) : panel.videos.length === 0 ? (
            <div className="px-4 py-6 text-center text-zinc-500 text-sm">No videos found.</div>
          ) : (
            <div className="divide-y divide-zinc-800 max-h-72 overflow-y-auto">
              {panel.videos.map((v, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/50">
                  <span className="text-zinc-600 font-mono text-xs w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {v.videoId ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white hover:text-red-400 transition-colors truncate block"
                      >
                        {v.title}
                      </a>
                    ) : (
                      <span className="text-sm text-white truncate block">{v.title}</span>
                    )}
                    {v.channel && <span className="text-xs text-zinc-500">{v.channel}</span>}
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">
                    {new Date(v.watchedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
