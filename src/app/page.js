'use client';

import { useState } from 'react';

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [clusters, setClusters] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setClusters(null);

    try {
      const response = await fetch('http://localhost:8000/analyze/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An unknown error occurred on the server.');
      }

      const data = await response.json();
      setClusters(data.clusters);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 font-sans bg-gradient-to-b from-slate-950 to-indigo-950 overflow-y-auto">
      <div 
        className={`
          w-full max-w-4xl
          transition-all duration-700 ease-in-out
          ${(isLoading || clusters || error) ? 'mt-8' : 'mt-[40vh]'}
        `}
      >
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white">Git Archaeologist</h1>
          <p className="text-lg text-gray-300 mt-2">
            Uncover the history of any public Git repository.
          </p>
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
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        <div className="mt-12">
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

          {clusters && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="text-3xl font-bold text-white text-center mb-6">Commit Clusters</h2>
              {Object.keys(clusters).sort((a, b) => a - b).map((clusterId) => (
                <div key={clusterId} className="bg-slate-800/50 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  <div className="bg-black/20 p-4 border-b border-white/10">
                    <h3 className="font-bold text-lg text-rose-300">Group {parseInt(clusterId) + 1}</h3>
                  </div>
                  <ul className="p-6 list-disc list-inside text-gray-300 space-y-2">
                    {clusters[clusterId].map((commit, index) => (
                      <li key={index}>{commit}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}