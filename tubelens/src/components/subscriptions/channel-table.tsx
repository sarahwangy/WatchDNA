'use client';

import { useState, useMemo } from 'react';

interface Channel {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  country: string | null;
  aiCategory: string | null;
  subscriberCount: bigint | null;
  watchCount: number;
  neverWatched: boolean;
}

interface ChannelTableProps {
  channels: Channel[];
}

type FilterType = 'all' | 'never' | 'active';
type SortType = 'name' | 'watches_desc' | 'watches_asc';

export function ChannelTable({ channels }: ChannelTableProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('watches_desc');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = channels;

    // Filter
    if (filter === 'never') result = result.filter((c) => c.neverWatched);
    if (filter === 'active') result = result.filter((c) => !c.neverWatched);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }

    // Sort
    if (sort === 'name') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'watches_desc') result = [...result].sort((a, b) => b.watchCount - a.watchCount);
    if (sort === 'watches_asc') result = [...result].sort((a, b) => a.watchCount - b.watchCount);

    return result;
  }, [channels, filter, sort, search]);

  const neverCount = channels.filter((c) => c.neverWatched).length;
  const activeCount = channels.length - neverCount;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header with search + controls */}
      <div className="px-5 py-4 border-b border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400">
            Subscribed Channels{' '}
            <span className="text-zinc-600">
              ({filtered.length}
              {filtered.length !== channels.length ? ` of ${channels.length}` : ''})
            </span>
          </h3>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            title="Sort channels"
            aria-label="Sort channels"
            className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-500"
          >
            <option value="watches_desc">Most watched</option>
            <option value="watches_asc">Least watched</option>
            <option value="name">A → Z</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter pills */}
          {(
            [
              { key: 'all', label: `All (${channels.length})` },
              { key: 'active', label: `Active (${activeCount})` },
              { key: 'never', label: `Never watched (${neverCount})` },
            ] as { key: FilterType; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filter === key
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              {label}
            </button>
          ))}

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="ml-auto text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-1 focus:outline-none focus:border-zinc-500 placeholder-zinc-600 w-40"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="divide-y divide-zinc-800">
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-zinc-500 text-sm">
            No channels match your filter.
          </div>
        )}
        {filtered.map((ch) => (
          <div
            key={ch.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
              {ch.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ch.thumbnailUrl} alt={ch.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-zinc-400 font-bold">{ch.title.charAt(0)}</span>
              )}
            </div>

            {/* Name + subscribers — clicking opens YouTube channel */}
            <div className="flex-1 min-w-0">
              <a
                href={`https://www.youtube.com/channel/${ch.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white hover:text-red-400 transition-colors truncate block"
              >
                {ch.title}
              </a>
              {ch.subscriberCount && (
                <p className="text-xs text-zinc-500">
                  {Number(ch.subscriberCount).toLocaleString()} subscribers
                </p>
              )}
            </div>

            {/* AI category badge */}
            {ch.aiCategory && (
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded shrink-0">
                {ch.aiCategory}
              </span>
            )}

            {/* Watch status */}
            {ch.neverWatched ? (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded shrink-0">
                Never watched
              </span>
            ) : (
              <span className="text-xs text-zinc-500 font-mono shrink-0">
                {ch.watchCount} views
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
