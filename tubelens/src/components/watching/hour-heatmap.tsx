'use client';

// 7天×24小时的观看分布热力图
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface HourHeatmapProps {
  matrix: number[][]; // matrix[weekday][hour] = count
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return '#18181b'; // zinc-900
  const ratio = count / max;
  const alpha = 0.2 + ratio * 0.8;
  return `rgba(239, 68, 68, ${alpha})`; // red-500 透明度渐变
}

export function HourHeatmap({ matrix }: HourHeatmapProps) {
  const max = Math.max(...matrix.flat(), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">观看时段分布</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* 小时标签 */}
          <div className="flex mb-1 ml-10">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-zinc-600 text-xs">
                {h % 6 === 0 ? h : ''}
              </div>
            ))}
          </div>
          {/* 热力图行 */}
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <div className="w-9 text-right text-zinc-500 text-xs pr-2">{day}</div>
              {HOURS.map((hour) => {
                const count = matrix[di]?.[hour] ?? 0;
                return (
                  <div
                    key={hour}
                    title={`${day} ${hour}:00 — ${count} 次`}
                    className="flex-1 h-6 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: getHeatColor(count, max) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
