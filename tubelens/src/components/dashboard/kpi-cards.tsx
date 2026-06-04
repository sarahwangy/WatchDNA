// KPI = Key Performance Indicator，仪表盘顶部常见的"数字摘要卡片"——行业通用模式

interface KpiCardsProps {
  subscriptionCount: number; // 订阅频道总数
  watchEventCount: number; // 观看记录总次数
  activeDays: number; // 有观看记录的天数
}

export function KpiCards({ subscriptionCount, watchEventCount, activeDays }: KpiCardsProps) {
  // 把三张卡的数据统一定义成数组，再 map 渲染，避免重复写三遍 JSX（DRY 原则）
  const cards = [
    { label: '总订阅', value: subscriptionCount.toLocaleString(), unit: '个频道', icon: '📋' },
    { label: '总观看', value: watchEventCount.toLocaleString(), unit: '次', icon: '▶️' },
    { label: '活跃天数', value: activeDays.toLocaleString(), unit: '天', icon: '📅' },
  ];

  return (
    // grid grid-cols-3：CSS Grid 三列布局，卡片等宽排列（行业常用响应式布局）
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm">{card.label}</span>
            <span className="text-lg">{card.icon}</span>
          </div>
          {/* font-mono：等宽字体，数字对齐更整齐，仪表盘常用写法 */}
          <div className="text-3xl font-bold text-white font-mono tracking-tight">{card.value}</div>
          <div className="text-zinc-500 text-xs mt-1">{card.unit}</div>
        </div>
      ))}
    </div>
  );
}
