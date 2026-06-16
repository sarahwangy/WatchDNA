'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface VideoResult {
  videoId: string | null;
  title: string;
  channelId: string | null;
  channelName: string | null;
  watchedAt: string;
}

interface ChannelResult {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  aiCategory: string | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [channels, setChannels] = useState<ChannelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: wait 300ms after user stops typing before fetching
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setVideos(data.videos ?? []);
        setChannels(data.channels ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Clear results when query is too short (derived state, no effect needed)
  const displayVideos = query.length >= 2 ? videos : [];
  const displayChannels = query.length >= 2 ? channels : [];

  const hasResults = displayVideos.length > 0 || displayChannels.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Search</h1>
          <p className="text-zinc-400 text-sm mt-1">Search your watch history and subscriptions</p>
        </div>

        {/* Search input */}
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos, channels..."
            autoFocus
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
              …
            </span>
          )}
          {!loading && query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Empty state */}
        {query.length < 2 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-500 text-sm">Type at least 2 characters to search</p>
          </div>
        )}

        {/* No results */}
        {query.length >= 2 && !loading && !hasResults && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-500 text-sm">No results for &quot;{query}&quot;</p>
          </div>
        )}

        {/* Channel results */}
        {displayChannels.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Subscribed Channels ({displayChannels.length})
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden">
              {displayChannels.map((ch) => (
                <a
                  key={ch.id}
                  href={`https://www.youtube.com/channel/${ch.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {ch.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ch.thumbnailUrl}
                        alt={ch.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400 font-bold">{ch.title.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm text-white flex-1 truncate">{ch.title}</span>
                  {ch.aiCategory && (
                    <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded shrink-0">
                      {ch.aiCategory}
                    </span>
                  )}
                  <span className="text-xs text-zinc-600 shrink-0">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Video results */}
        {displayVideos.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Watch History ({displayVideos.length}
              {displayVideos.length === 30 ? '+' : ''})
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden">
              {displayVideos.map((v, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    {v.videoId ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white hover:text-red-400 transition-colors block truncate"
                      >
                        {v.title}
                      </a>
                    ) : (
                      <span className="text-sm text-white block truncate">{v.title}</span>
                    )}
                    {v.channelName && v.channelId ? (
                      <a
                        href={`https://www.youtube.com/channel/${v.channelId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {v.channelName}
                      </a>
                    ) : (
                      v.channelName && (
                        <span className="text-xs text-zinc-500">{v.channelName}</span>
                      )
                    )}
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0 mt-0.5">
                    {new Date(v.watchedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
