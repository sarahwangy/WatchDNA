'use client';

import { useState } from 'react';

interface RecommendationsProps {
  initialContent: string | null;
}

export function Recommendations({ initialContent }: RecommendationsProps) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/insights/recommendations', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setContent(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h3 className="font-semibold text-white">You Might Like</h3>
          <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">
            AI Generated
          </span>
        </div>
        {content && (
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="text-xs text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generating...' : 'Refresh ↺'}
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {content ? (
        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">{content}</p>
      ) : (
        <div className="text-center py-8">
          <p className="text-zinc-500 text-sm mb-3">
            Get AI recommendations based on your most-watched content categories
          </p>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Discover Channels for Me'}
          </button>
        </div>
      )}
    </div>
  );
}
