'use client';

// CalendarHeatmap：仿 GitHub 贡献图的日历热力图，展示近一年每天的观看频率

interface CalendarHeatmapProps {
  // data 格式：{ "2025-06-01": 5, "2025-06-02": 0, ... }，key 是日期字符串，value 是当天观看次数
  data: Record<string, number>;
}

// 根据当天观看次数和最大值，返回对应的 Tailwind 颜色 class（颜色深浅代表活跃程度）
function getColorClass(count: number, max: number): string {
  if (count === 0) return 'bg-zinc-800';
  const ratio = count / max;
  if (ratio < 0.2) return 'bg-red-900/40';
  if (ratio < 0.4) return 'bg-red-800/60';
  if (ratio < 0.6) return 'bg-red-700/70';
  if (ratio < 0.8) return 'bg-red-600/80';
  return 'bg-red-500';
}

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  // 生成近 365 天的日期数组（从最早到今天）
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // toISOString().split('T')[0] 是把日期转成 "YYYY-MM-DD" 格式的常用技巧
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: data[dateStr] || 0 });
  }

  // 找到最大值，用于计算颜色深浅的比例基准（Math.max 的第二个参数 1 防止除以零）
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  // 把 365 天按每 7 天分成一列（模拟日历的"周"结构）
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">观看活跃度（近一年）</h3>
      {/* flex + gap-1：每列（周）横向排列，列内再纵向排列每天的小方块 */}
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                // title：鼠标悬停时显示具体日期和次数（原生 tooltip，无需额外库）
                title={`${day.date}: ${day.count} 次`}
                className={`w-3 h-3 rounded-sm ${getColorClass(day.count, maxCount)} cursor-pointer hover:opacity-80 transition-opacity`}
              />
            ))}
          </div>
        ))}
      </div>
      {/* 图例：从少到多展示颜色梯度 */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-zinc-500">少</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${getColorClass(Math.ceil(r * maxCount), maxCount)}`}
          />
        ))}
        <span className="text-xs text-zinc-500">多</span>
      </div>
    </div>
  );
}
