'use client';

// recharts 是一个基于 React 的图表库，这里用到甜甜圈图（Donut Chart = 有 innerRadius 的 PieChart）
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// 颜色数组：用 index % COLORS.length 循环复用，不管有几个分类都能上色
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

interface CategoryPieProps {
  data: Array<{ name: string; value: number }>; // name=分类名, value=频道数量
}

export function CategoryPie({ data }: CategoryPieProps) {
  // 空状态处理：如果还没有 AI 分类数据，显示提示文字而不是空图表
  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-center h-64">
        <p className="text-zinc-500 text-sm">
          No category data yet (complete AI classification first)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Subscription Category Breakdown</h3>
      {/* ResponsiveContainer：让图表自动填满父元素宽度，height 固定 260px */}
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60} // 有 innerRadius 就变成甜甜圈图
            outerRadius={100}
            paddingAngle={2} // 每个扇形之间留 2° 间隔，视觉上更清晰
            dataKey="value"
          >
            {/* 每个扇形单独设置颜色 */}
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          {/* Tooltip：鼠标悬停时显示分类名和数值 */}
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#a1a1aa' }}
          />
          {/* Legend：图例，显示颜色和分类名 */}
          <Legend formatter={(value) => <span className="text-zinc-400 text-xs">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
