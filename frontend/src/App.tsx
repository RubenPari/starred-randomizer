import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import LanguageBadge from './components/LanguageBadge';

const USERNAME = 'RubenPari';

interface Repo {
  full_name: string;
  html_url: string;
  description: string;
  language: string | null;
  stargazers_count: number;
}

function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

function App() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [randomRepo, setRandomRepo] = useState<Repo | null>(null);
  const [filters, setFilters] = useState<{ language: string; min_stars: string }>({ language: '', min_stars: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [repoCount, setRepoCount] = useState<number>(0);
  const [history, setHistory] = useState<Repo[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchStarred = async () => {
    setLoading(true);
    setError(null);
    setRandomRepo(null);
    setHistory([]);
    try {
      console.log(`[DEBUG] Fetching starred repos for: ${USERNAME}`);
      const res = await axios.get<Repo[]>(`/api/starred/${USERNAME}`);
      console.log(`[DEBUG] Retrieved ${res.data.length} repositories`);
      setRepos(res.data);
      setRepoCount(res.data.length);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      console.error('[ERROR] fetchStarred failed:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.code === 'ERR_NETWORK') {
        setError('Impossibile connettersi al server. Verifica che il backend sia attivo.');
      } else {
        setError('Errore imprevisto. Riprova.');
      }
      setRepos([]);
      setRepoCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getRandom = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[DEBUG] Getting random repo with filters:`, filters);
      const res = await axios.get<Repo>(`/api/random/${USERNAME}`, { params: filters });
      console.log(`[DEBUG] Selected repo: ${res.data.full_name}`);
      setRandomRepo(res.data);
      setHistory(prev => [res.data, ...prev].slice(0, 5));
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      console.error('[ERROR] getRandom failed:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.code === 'ERR_NETWORK') {
        setError('Impossibile connettersi al server. Verifica che il backend sia attivo.');
      } else {
        setError('Errore nell\'estrazione del repository');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarred();
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center animate-fade-in">
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => setDarkMode(d => !d)}
              className="p-2 rounded-lg bg-surface border border-surface-3 hover:opacity-80 transition"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-star" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
            GitHub Starred Randomizer
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Scopri casualmente i repository che hai salvato</p>
        </header>

        {/* Load Button */}
        <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 animate-fade-in">
          <button
            onClick={fetchStarred}
            disabled={loading}
            className="w-full px-5 py-2.5 bg-gradient-to-r from-brand to-brand-dark text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading && repos.length === 0 ? (
              <><span className="spinner" /> Caricamento...</>
            ) : (
              <>⚡ Carica Starred di {USERNAME}</>
            )}
          </button>
          {error && repos.length === 0 && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>

        {/* Filters & Random */}
        {repos.length > 0 && (
          <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-accent font-semibold">{repoCount}</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>repo trovati</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Language"
                value={filters.language}
                onChange={e => setFilters(f => ({ ...f, language: e.target.value }))}
                className="flex-1 bg-surface-2 border border-surface-3 rounded-lg px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
              <input
                type="number"
                placeholder="Min stars"
                value={filters.min_stars}
                onChange={e => setFilters(f => ({ ...f, min_stars: e.target.value }))}
                className="w-full sm:w-32 bg-surface-2 border border-surface-3 rounded-lg px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={getRandom}
                disabled={loading}
                className="px-5 py-2 bg-gradient-to-r from-accent to-brand text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? <><span className="spinner" /> Estrazione...</> : <>🎲 Estrai Random</>}
              </button>
            </div>
            {error && repos.length > 0 && (
              <p className="text-red-400 text-sm mt-3">{error}</p>
            )}
          </div>
        )}

        {/* Result Card */}
        {randomRepo && (
          <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-brand/30 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                🎯 Repository Estratto
              </h2>
              <button
                onClick={getRandom}
                disabled={loading}
                className="text-xs px-3 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg transition disabled:opacity-50"
                style={{ color: 'var(--text-secondary)' }}
              >
                🔁 Re-estrai
              </button>
            </div>
            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{randomRepo.full_name}</h3>
            {randomRepo.description && (
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{randomRepo.description}</p>
            )}
            <div className="flex items-center gap-3 mb-4">
              <LanguageBadge language={randomRepo.language} />
              <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-star)' }}>
                ⭐ {formatStars(randomRepo.stargazers_count)}
              </span>
            </div>
            <a
              href={randomRepo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-accent transition font-medium"
              style={{ color: 'var(--color-brand)' }}
            >
              🔗 Vai al repository →
            </a>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 animate-fade-in">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              📜 Cronologia
            </h2>
            <ul className="space-y-2">
              {history.slice(1).map((repo, i) => (
                <li key={`${repo.full_name}-${i}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{repo.full_name}</span>
                    <LanguageBadge language={repo.language} />
                  </div>
                  <span className="flex items-center gap-1 whitespace-nowrap ml-2" style={{ color: 'var(--color-star)' }}>
                    ⭐ {formatStars(repo.stargazers_count)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
