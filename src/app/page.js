'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

function ClusterList({ items, render, limit = 20 }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, limit);
  return (
    <>
      <ul className="p-6 list-disc list-inside text-gray-300 space-y-2">
        {shown.map(render)}
      </ul>
      {items.length > limit && (
        <button
          onClick={() => setOpen(!open)}
          className="mx-6 mb-4 text-rose-300 underline"
        >
          {open ? 'Show less' : `Show ${items.length - limit} more`}
        </button>
      )}
    </>
  );
}

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [data, setData] = useState(null); // full response from API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAnalyze() {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`${API_BASE}/api/analyze/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl,
          use_bertopic: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || `Server error ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  function clustersAsArray(resp) {
    if (!resp?.clusters) return [];
    return Object.keys(resp.clusters)
      .map(Number)
      .map((id) => ({
        id,
        messages: resp.clusters[id] || [],
        title: resp.cluster_titles?.[id] || '',
        keywords: resp.cluster_keywords?.[id] || resp.cluster_labels?.[id] || [],
        size: resp.cluster_sizes?.[id] ?? (resp.clusters[id]?.length ?? 0),
        avgProb: resp.cluster_avg_prob?.[id] ?? 0,
      }))
      // Sort by size then avg confidence (most useful first)
      .sort((a, b) => (b.size - a.size) || (b.avgProb - a.avgProb));
  }

  const clusters = clustersAsArray(data);
  const validRepo = /^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(repoUrl);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 font-sans bg-gradient-to-b from-slate-950 to-indigo-950 overflow-y-auto">
      <div
        className={`
          w-full max-w-4xl
          transition-all duration-700 ease-in-out
          ${(isLoading || data || error) ? 'mt-8' : 'mt-[40vh]'}
        `}
      >
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white">Git Archaeologist</h1>
          <p className="text-lg text-gray-300 mt-2">
            Uncover the history of any public Git repository.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Paste a GitHub repository URL (e.g., https://github.com/owner/repo)"
            className="flex-grow w-full p-3 border border-gray-600 bg-slate-800 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-rose-500 transition placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={handleAnalyze}
            className="bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-rose-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading || !validRepo}
            title={!validRepo ? "Enter a valid GitHub repo URL" : ""}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        <div className="mt-12 space-y-6">
          {isLoading && (
            <div className="text-center p-8 text-lg text-gray-300 animate-pulse">
              <p>Analyzing repository... this may take a moment.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Noise summary */}
          {data?.noise && (
            <div className="bg-slate-800/50 border border-yellow-600/40 rounded-lg shadow-xl overflow-hidden">
              <div className="bg-black/20 p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-yellow-300">Unclustered (noise)</h3>
                <span className="text-gray-300 text-sm">
                  {data.noise.length} messages • noise rate {(data.noise_rate ?? 0).toFixed(2)}
                </span>
              </div>
              <details className="p-4 text-gray-300">
                <summary className="cursor-pointer text-gray-200">Show sample</summary>
                <ul className="mt-3 list-disc list-inside space-y-1">
                  {data.noise.slice(0, 40).map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </details>
            </div>
          )}

          {/* Clusters */}
          {clusters.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white text-center">Commit Clusters</h2>
              {clusters.map(({ id, messages, title, keywords, size, avgProb }) => (
                <div key={id} className="bg-slate-800/50 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  <div className="bg-black/20 p-4 border-b border-white/10">
                    <h3 className="font-bold text-lg text-rose-300">
                      {title?.length ? title : (keywords.length ? keywords.join(' • ') : `Topic #${id}`)}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-rose-900/30 border border-rose-700 text-rose-200 text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {size} commits • avg conf {(avgProb || 0).toFixed(2)}
                    </p>
                  </div>

                  <ClusterList
                    items={messages}
                    render={(commit, index) => <li key={index}>{commit}</li>}
                    limit={20}
                  />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && data && clusters.length === 0 && (
            <div className="text-center text-gray-300">
              No clusters found in this repository.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

