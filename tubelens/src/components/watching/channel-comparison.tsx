'use client';

import { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChannelOption {
  id: string;
  title: string;
}

interface ChannelComparisonProps {
  channelOptions: ChannelOption[]; // all subscribed channels
}

const LINE_COLORS = ['#ef4444', '#3b82f6', '#22c55e'];

export function ChannelComparison({ channelOptions }: ChannelComparisonProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [chartData, setChartData] = useState<Record<string, string | number>[]>([]);
  const [activeChannels, setActiveChannels] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = search.trim()
    ? channelOptions.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : channelOptions;

  function toggleChannel(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  const loadComparison = useCallback(async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/watching/compare?channels=${selected.join(',')}`);
      const data = await res.json();
      setChartData(data.data);
      setActiveChannels(data.channels);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400">Channel Comparison</h3>
        <p className="text-xs text-zinc-600 mt-0.5">
          Select up to 3 channels to compare watch trends
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Channel picker */}
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-600 mb-2"
          />

          {/* Selected pills */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selected.map((id, i) => {
                const ch = channelOptions.find((c) => c.id === id);
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white"
                    style={{
                      backgroundColor: `${LINE_COLORS[i]}33`,
                      border: `1px solid ${LINE_COLORS[i]}66`,
                    }}
                  >
                    <span style={{ color: LINE_COLORS[i] }}>●</span>
                    {ch?.title ?? id}
                    <button
                      type="button"
                      onClick={() => toggleChannel(id)}
                      className="ml-1 text-zinc-400 hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Channel list (scrollable) */}
          <div className="max-h-40 overflow-y-auto border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            {filtered.slice(0, 50).map((ch) => {
              const isSelected = selected.includes(ch.id);
              const idx = selected.indexOf(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannel(ch.id)}
                  disabled={!isSelected && selected.length >= 3}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                    isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                  } disabled:opacity-40`}
                >
                  {isSelected ? (
                    <span style={{ color: LINE_COLORS[idx] }}>●</span>
                  ) : (
                    <span className="text-zinc-700">○</span>
                  )}
                  <span className="text-zinc-300 truncate">{ch.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compare button */}
        <button
          type="button"
          onClick={loadComparison}
          disabled={selected.length === 0 || loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm py-2 rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : 'Compare'}
        </button>

        {/* Chart */}
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)} // show MM only
              />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
                itemStyle={{ fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
                formatter={(value) => activeChannels.find((c) => c.id === value)?.title ?? value}
              />
              {activeChannels.map((ch, i) => (
                <Line
                  key={ch.id}
                  type="monotone"
                  dataKey={ch.id}
                  stroke={LINE_COLORS[i]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
