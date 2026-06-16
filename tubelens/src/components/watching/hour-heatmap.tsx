'use client';

import { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface HourHeatmapProps {
  matrix: number[][];
}

interface SlotVideo {
  videoId: string | null;
  title: string;
  channel: string | null;
  watchedAt: string;
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return '#18181b';
  const ratio = count / max;
  const alpha = 0.2 + ratio * 0.8;
  return `rgba(239, 68, 68, ${alpha})`;
}

export function HourHeatmap({ matrix }: HourHeatmapProps) {
  const max = Math.max(...matrix.flat(), 1);
  const [panel, setPanel] = useState<{
    day: number;
    hour: number;
    videos: SlotVideo[];
    loading: boolean;
  } | null>(null);

  async function handleCellClick(day: number, hour: number) {
    const count = matrix[day]?.[hour] ?? 0;
    if (count === 0) return;

    setPanel({ day, hour, videos: [], loading: true });
    const res = await fetch(`/api/watching/by-slot?day=${day}&hour=${hour}`);
    const data = await res.json();
    setPanel({ day, hour, videos: data.videos, loading: false });
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Watch Time Distribution</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex mb-1 ml-10">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-zinc-600 text-xs">
                {h % 6 === 0 ? h : ''}
              </div>
            ))}
          </div>
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <div className="w-9 text-right text-zinc-500 text-xs pr-2">{day}</div>
              {HOURS.map((hour) => {
                const count = matrix[di]?.[hour] ?? 0;
                const isSelected = panel?.day === di && panel?.hour === hour;
                return (
                  <div
                    key={hour}
                    title={`${day} ${hour}:00 — ${count} views${count > 0 ? ' (click to see videos)' : ''}`}
                    onClick={() => handleCellClick(di, hour)}
                    className={`flex-1 h-6 rounded-sm transition-all ${count > 0 ? 'cursor-pointer hover:ring-1 hover:ring-white/40' : ''} ${isSelected ? 'ring-2 ring-white/60' : ''}`}
                    style={{
                      ['--cell-bg' as string]: getHeatColor(count, max),
                      backgroundColor: 'var(--cell-bg)',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Slide-over panel */}
      {panel && (
        <div className="mt-4 border border-zinc-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800">
            <span className="text-sm font-medium text-white">
              {DAYS[panel.day]} {panel.hour}:00–{panel.hour + 1}:00
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
                    {new Date(v.watchedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
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
