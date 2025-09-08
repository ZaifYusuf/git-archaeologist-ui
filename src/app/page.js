'use client'; // This directive is necessary for components that use hooks like useState

import { useState } from 'react';

export default function HomePage() {
  // React state hooks to manage our component's data
  const [repoUrl, setRepoUrl] = useState('');
  const [clusters, setClusters] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    // 1. Reset the UI and start the loading state
    setIsLoading(true);
    setError(null);
    setClusters(null);

    try {
      // 2. Send a request to our FastAPI backend (running on port 8000)
      const response = await fetch('http://localhost:8000/analyze/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      if (!response.ok) {
        // Handle errors from the backend (like a bad URL)
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An unknown error occurred on the server.');
      }

      // 3. If successful, parse the JSON and store the results
      const data = await response.json();
      setClusters(data.clusters);

    } catch (err) {
      // 4. If any other error occurs (e.g., network failure), store it
      setError(err.message);
    } finally {
      // 5. Always stop the loading indicator when the process is finished
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 font-sans bg-gradient-to-b from-slate-950 to-indigo-950">
      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white">Git Archaeologist</h1>
          <p className="text-lg text-gray-600 mt-2">
            Uncover the history of any public Git repository.
          </p>
        </header>

        {/* Input Form Section */}
        <div className="flex gap-2">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Paste a GitHub repository URL (e.g., https://github.com/owner/repo.git)"
            className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition placeholder:text-gray-800"
            disabled={isLoading}
          />
          <button
            onClick={handleAnalyze}
            className="bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:bg-rose-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* Results Display Section */}
        <div className="mt-8">
          {isLoading && (
            <div className="text-center p-8">
              <p className="text-lg text-gray-700">Analyzing repository... this may take a moment.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {clusters && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Commit Clusters</h2>
              {Object.keys(clusters).sort((a, b) => a - b).map((clusterId) => (
                <div key={clusterId} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-100 p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-700">Group {parseInt(clusterId) + 1}</h3>
                  </div>
                  <ul className="p-6 list-disc list-inside text-gray-600 space-y-2">
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
