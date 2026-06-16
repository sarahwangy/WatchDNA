import Link from 'next/link';

interface KpiCardsProps {
  subscriptionCount: number;
  watchEventCount: number;
  activeDays: number;
}

export function KpiCards({ subscriptionCount, watchEventCount, activeDays }: KpiCardsProps) {
  const cards = [
    {
      label: 'Total Subscriptions',
      value: subscriptionCount.toLocaleString(),
      unit: 'channels',
      icon: '📋',
      href: '/subscriptions',
    },
    {
      label: 'Total Watches',
      value: watchEventCount.toLocaleString(),
      unit: 'views',
      icon: '▶️',
      href: '/watching',
    },
    {
      label: 'Active Days',
      value: activeDays.toLocaleString(),
      unit: 'days',
      icon: '📅',
      href: '/watching',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all cursor-pointer block"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm">{card.label}</span>
            <span className="text-lg">{card.icon}</span>
          </div>
          <div className="text-3xl font-bold text-white font-mono tracking-tight">{card.value}</div>
          <div className="text-zinc-500 text-xs mt-1">{card.unit}</div>
        </Link>
      ))}
    </div>
  );
}
