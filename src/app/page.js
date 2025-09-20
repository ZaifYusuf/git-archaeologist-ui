'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [data, setData] = useState(null); 
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
          min_cluster_size: 8
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
      .map((k) => Number(k))
      .sort((a, b) => a - b)
      .map((id) => {
        const messages = resp.clusters[id] || [];
        const labels = resp.cluster_labels?.[id] || [];
        const size = resp.cluster_sizes?.[id] ?? messages.length;
        const avgProb = resp.cluster_avg_prob?.[id] ?? 0;
        return { id, messages, labels, size, avgProb };
      });
  }

  const clusters = clustersAsArray(data);

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
          <p className="text-lg text-gray-300 mt-2">Uncover the history of any public Git repository.</p>
        </header>

        <div className="flex flex-col sm:flex-row gap-2">
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
            disabled={isLoading || !/^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(repoUrl)}
            title={!/^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(repoUrl) ? "Enter a valid GitHub repo URL" : ""}
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
              {clusters.map(({ id, messages, labels, size, avgProb }) => (
                <div key={id} className="bg-slate-800/50 border border-yellow-600/1=40 rounded-lg shadow-xl overflow-hidden">
                  <div className="bg-black/20 p-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-rose-300">
                        {labels.length > 0 ? labels.join(' • ') : `Group ${id + 1}`}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Topic #{id} • {size} commits • avg conf {(avgProb || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <ul className="p-6 list-disc list-inside text-gray-300 space-y-2">
                    {messages.map((commit, index) => (
                      <li key={index}>{commit}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && data && clusters.length === 0 && (
            <div className="text-center text-gray-300">No clusters found. Try a smaller min_cluster_size.</div>
          )}
        </div>
      </div>
    </main>
  );
}
