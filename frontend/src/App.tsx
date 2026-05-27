import { useState, useEffect, useRef, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import LanguageBadge from './components/LanguageBadge';
import { SkeletonCard } from './components/SkeletonCard';
import StatisticsPanel from './components/StatisticsPanel';
import {
  IconDice,
  IconStar,
  IconExternalLink,
  IconRefresh,
  IconCalendar,
  IconSun,
  IconMoon,
  IconTrash,
  IconGitHub,
  IconZap,
  IconClock,
  IconCode,
} from './components/Icons';

const USERNAME = 'RubenPari';

interface Repo {
  full_name: string;
  html_url: string;
  description: string;
  language: string | null;
  stargazers_count: number;
  topics: string[];
  updated_at: string;
  created_at: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

interface HistoryEntry {
  repo: Repo;
  timestamp: number;
}

function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'ora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}g`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}m`;
  return `${Math.floor(seconds / 31536000)}a`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [randomRepo, setRandomRepo] = useState<Repo | null>(null);
  const [filters, setFilters] = useState<{ language: string; min_stars: number }>({ language: '', min_stars: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });
  const [shufflePhase, setShufflePhase] = useState(false);
  const [shuffledRepos, setShuffledRepos] = useState<Repo[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchStarred = async () => {
    setLoading(true);
    setError(null);
    setRandomRepo(null);
    setHistory([]);
    setShuffledRepos([]);
    try {
      const res = await axios.get<Repo[]>(`/api/starred/${USERNAME}`);
      setRepos(res.data);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.code === 'ERR_NETWORK') {
        setError('Impossibile connettersi al server. Verifica che il backend sia attivo.');
      } else {
        setError('Errore imprevisto. Riprova.');
      }
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRepos = useCallback(() => {
    return repos.filter((r) => {
      if (filters.language && r.language?.toLowerCase() !== filters.language.toLowerCase()) return false;
      if (filters.min_stars > 0 && r.stargazers_count < filters.min_stars) return false;
      return true;
    });
  }, [repos, filters]);

  const getRandom = async () => {
    setLoading(true);
    setError(null);
    setShufflePhase(true);
    setShuffledRepos([]);

    const filtered = getFilteredRepos();
    const shuffleCount = 6;
    for (let i = 0; i < shuffleCount; i++) {
      const randomIdx = Math.floor(Math.random() * filtered.length);
      setShuffledRepos([filtered[randomIdx]]);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    try {
      const res = await axios.get<Repo>(`/api/random/${USERNAME}`, {
        params: { language: filters.language || undefined, min_stars: filters.min_stars || undefined },
      });
      setRandomRepo(res.data);
      setHistory((prev) => [{ repo: res.data, timestamp: Date.now() }, ...prev].slice(0, 10));
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.code === 'ERR_NETWORK') {
        setError('Impossibile connettersi al server. Verifica che il backend sia attivo.');
      } else {
        setError("Errore nell'estrazione del repository");
      }
    } finally {
      setLoading(false);
      setShufflePhase(false);
      setShuffledRepos([]);
    }
  };

  const resetFilters = () => {
    setFilters({ language: '', min_stars: 0 });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const selectFromHistory = (entry: HistoryEntry) => {
    setRandomRepo(entry.repo);
    window.scrollTo({ top: resultRef.current?.offsetTop ?? 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchStarred();
  }, []);

  const languages = Array.from(new Set(repos.map((r) => r.language).filter((l): l is string => Boolean(l)))).sort();
  const maxStars = repos.length > 0 ? Math.max(...repos.map((r) => r.stargazers_count)) : 100;
  const filteredCount = getFilteredRepos().length;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <header className="text-center animate-fade-in">
          <div className="flex items-center justify-end mb-3">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="p-2.5 rounded-xl bg-surface border border-surface-3 hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand/50"
              aria-label={darkMode ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
            >
              {darkMode ? (
                <IconSun className="w-5 h-5 text-star" />
              ) : (
                <IconMoon className="w-5 h-5 text-brand" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand to-accent shadow-lg">
              <IconDice className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
              GitHub Starred Randomizer
            </h1>
          </div>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            Esplora e scopri casualmente i repository GitHub che hai salvato tra i preferiti
          </p>
        </header>

        {/* Load Button */}
        {loading && repos.length === 0 ? (
          <SkeletonCard />
        ) : (
          <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
            <button
              onClick={fetchStarred}
              disabled={loading}
              className="w-full min-h-[48px] px-5 py-3 bg-gradient-to-r from-brand to-brand-dark text-white font-medium rounded-xl hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2"
              aria-label="Carica repository starred"
            >
              {loading ? (
                <>
                  <span className="spinner" /> Caricamento...
                </>
              ) : (
                <>
                  <IconZap className="w-5 h-5" /> Carica Starred di {USERNAME}
                </>
              )}
            </button>
            {error && repos.length === 0 && (
              <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
            )}
          </div>
        )}

        {/* Statistics */}
        {repos.length > 0 && <StatisticsPanel repos={repos} />}

        {/* Filters & Random */}
        {repos.length > 0 && (
          <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {filteredCount}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  repo corrispondenti
                </span>
              </div>
              {(filters.language || filters.min_stars > 0) && (
                <button
                  onClick={resetFilters}
                  className="text-xs px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors flex items-center gap-1.5 min-h-[32px] focus:outline-none focus:ring-2 focus:ring-brand/50"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label="Reset filtri"
                >
                  <IconRefresh className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <select
                  value={filters.language || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
                  className="w-full bg-surface-2 border border-surface-3 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm min-h-[44px] appearance-none cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                  aria-label="Filtra per linguaggio"
                >
                  <option value="">Tutti i linguaggi</option>
                  {languages.filter(Boolean).map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconCode className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="flex-1 sm:flex-initial sm:w-48">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Min stelle: <span className="font-bold" style={{ color: 'var(--color-star)' }}>{filters.min_stars}</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxStars}
                  step="1"
                  value={filters.min_stars}
                  onChange={(e) => setFilters((f) => ({ ...f, min_stars: parseInt(e.target.value, 10) }))}
                  className="w-full h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-brand"
                  aria-label="Filtro stelle minime"
                />
              </div>
              <button
                onClick={getRandom}
                disabled={loading || filteredCount === 0}
                className="min-h-[48px] px-5 py-3 bg-gradient-to-r from-accent to-brand text-white font-medium rounded-xl hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2"
                aria-label="Estrai repository casuale"
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Estrazione...
                  </>
                ) : (
                  <>
                    <IconDice className="w-5 h-5" /> Estrai
                  </>
                )}
              </button>
            </div>
            {error && repos.length > 0 && (
              <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
            )}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && repos.length > 0 && <SkeletonCard />}

        {/* Shuffle animation */}
        {shufflePhase && shuffledRepos.length > 0 && (
          <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-brand/30 shadow-lg animate-shuffle-pulse">
            <div className="flex items-center gap-3 mb-3">
              <span className="spinner" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Selezione in corso...
              </span>
            </div>
            {shuffledRepos.map((repo, i) => (
              <div key={`${repo.full_name}-${i}`} className="animate-fade-in">
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {repo.full_name}
                </h3>
                <div className="flex items-center gap-3">
                  <LanguageBadge language={repo.language} />
                  <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-star)' }}>
                    <IconStar className="w-3.5 h-3.5" />
                    {formatStars(repo.stargazers_count)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Result Card */}
        {randomRepo && !shufflePhase && (
          <div ref={resultRef} className="bg-surface/80 backdrop-blur rounded-xl border border-brand/30 shadow-xl animate-scale-in animate-glow-pulse">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="p-1.5 rounded-lg bg-brand/10">
                    <IconDice className="w-4 h-4 text-brand" />
                  </span>
                  Repository Estratto
                </h2>
                <button
                  onClick={getRandom}
                  disabled={loading}
                  className="text-xs px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors flex items-center gap-1.5 min-h-[36px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand/50"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label="Re-estrai repository"
                >
                  <IconRefresh className="w-3.5 h-3.5" /> Re-estrai
                </button>
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0 border border-surface-3 overflow-hidden"
                  style={{ backgroundImage: `url(${randomRepo.owner?.avatar_url})`, backgroundSize: 'cover' }}
                >
                  {!randomRepo.owner?.avatar_url && (
                    <IconGitHub className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {randomRepo.full_name}
                  </h3>
                  <a
                    href={randomRepo.owner?.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-brand transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    @{randomRepo.owner?.login ?? randomRepo.full_name.split('/')[0]}
                  </a>
                </div>
              </div>

              {randomRepo.description && (
                <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {randomRepo.description}
                </p>
              )}

              {randomRepo.topics && randomRepo.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {randomRepo.topics.slice(0, 5).map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand hover:bg-brand/20 transition-colors cursor-default"
                    >
                      {topic}
                    </span>
                  ))}
                  {randomRepo.topics.length > 5 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2" style={{ color: 'var(--text-muted)' }}>
                      +{randomRepo.topics.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <LanguageBadge language={randomRepo.language} size="md" />
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-star)' }}>
                  <IconStar className="w-4 h-4" />
                  {formatStars(randomRepo.stargazers_count)}
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <IconCalendar className="w-3.5 h-3.5" />
                  Aggiornato {timeAgo(randomRepo.updated_at)}
                </span>
              </div>

              <a
                href={randomRepo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand/10 hover:bg-brand/20 rounded-xl transition-colors font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand/50"
                style={{ color: 'var(--color-brand)' }}
              >
                <IconExternalLink className="w-4 h-4" />
                Vai al repository
              </a>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span className="p-1.5 rounded-lg bg-surface-2">
                  <IconClock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </span>
                Cronologia
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                  {history.length}
                </span>
              </h2>
              <button
                onClick={clearHistory}
                className="text-xs px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 hover:text-red-400 transition-colors flex items-center gap-1.5 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-brand/50"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Cancella cronologia"
              >
                <IconTrash className="w-3.5 h-3.5" /> Cancella
              </button>
            </div>
            <ul className="space-y-2">
              {history.slice(1).map((entry, i) => (
                <li
                  key={`${entry.repo.full_name}-${entry.timestamp}`}
                  className="flex items-center justify-between text-sm p-3 rounded-lg hover:bg-surface-2/50 transition-colors cursor-pointer animate-slide-in-right group"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => selectFromHistory(entry)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && selectFromHistory(entry)}
                  aria-label={`Vedi ${entry.repo.full_name}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="truncate font-medium group-hover:text-brand transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {entry.repo.full_name}
                    </span>
                    <LanguageBadge language={entry.repo.language} />
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap ml-2">
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatTime(entry.timestamp)}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-star)' }}>
                      <IconStar className="w-3.5 h-3.5" />
                      {formatStars(entry.repo.stargazers_count)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Realizzato con</span>
            <span className="font-medium text-brand">React</span>
            <span>+</span>
            <span className="font-medium text-accent">Fastify</span>
            <span className="mx-1">•</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-brand transition-colors"
            >
              <IconGitHub className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
