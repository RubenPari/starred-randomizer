import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SkeletonCard } from './components/SkeletonCard';
import StatisticsPanel from './components/StatisticsPanel';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import ResultCard from './components/ResultCard';
import HistoryPanel from './components/HistoryPanel';
import ShuffleAnimation from './components/ShuffleAnimation';
import { useStarredRepos } from './hooks/useStarredRepos';
import { useRandomRepo } from './hooks/useRandomRepo';
import type { Repo } from './types';
import { IconZap } from './components/Icons';

const DEFAULT_USERNAME = 'RubenPari';

function useTheme() {
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

  return { darkMode, toggleTheme: () => setDarkMode((d) => !d) };
}

function App() {
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [filters, setFilters] = useState<{ language: string; min_stars: number }>({ language: '', min_stars: 0 });
  const [shufflePhase, setShufflePhase] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { darkMode, toggleTheme } = useTheme();
  const { repos, loading: starredLoading, error: starredError, fetchStarred } = useStarredRepos();
  const { randomRepo, loading: randomLoading, error: randomError, history, getRandom, selectFromHistory, clearHistory } = useRandomRepo();

  const loading = starredLoading || randomLoading;

  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      if (filters.language && r.language?.toLowerCase() !== filters.language.toLowerCase()) return false;
      if (filters.min_stars > 0 && r.stargazers_count < filters.min_stars) return false;
      return true;
    });
  }, [repos, filters]);

  const languages = useMemo(
    () => Array.from(new Set(repos.map((r) => r.language).filter((l): l is string => Boolean(l)))).sort(),
    [repos]
  );

  const maxStars = repos.length > 0 ? Math.max(...repos.map((r) => r.stargazers_count)) : 100;

  useEffect(() => {
    fetchStarred(username);
  }, [username, fetchStarred]);

  const handleRandom = useCallback(async () => {
    setShufflePhase(true);
    await getRandom(username, filters.language, filters.min_stars, filteredRepos.length);
    setShufflePhase(false);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [username, filters, filteredRepos.length, getRandom]);

  const handleShuffleComplete = useCallback(() => {
    // Shuffle completed, the hook already sets the random repo
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ language: '', min_stars: 0 });
  }, []);

  const handleSelectFromHistory = useCallback((entry: { repo: Repo; timestamp: number }) => {
    selectFromHistory(entry);
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [selectFromHistory]);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          username={username}
          onUsernameChange={setUsername}
        />

        {loading && repos.length === 0 ? (
          <SkeletonCard />
        ) : (
          <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
            <button
              onClick={() => fetchStarred(username)}
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
                  <IconZap className="w-5 h-5" /> Carica Starred di {username}
                </>
              )}
            </button>
            {starredError && repos.length === 0 && (
              <p className="text-red-400 text-sm mt-3 text-center">{starredError}</p>
            )}
          </div>
        )}

        {repos.length > 0 && <StatisticsPanel repos={repos} />}

        {repos.length > 0 && (
          <FilterPanel
            repos={repos}
            filteredCount={filteredRepos.length}
            languages={languages}
            filters={filters}
            maxStars={maxStars}
            loading={loading}
            onFilterChange={setFilters}
            onResetFilters={resetFilters}
            onRandom={handleRandom}
            error={randomError}
          />
        )}

        {loading && repos.length > 0 && <SkeletonCard />}

        {shufflePhase && filteredRepos.length > 0 && (
          <ShuffleAnimation
            filteredRepos={filteredRepos}
            onComplete={handleShuffleComplete}
          />
        )}

        {randomRepo && !shufflePhase && (
          <ResultCard
            ref={resultRef}
            repo={randomRepo}
            loading={loading}
            onReroll={handleRandom}
          />
        )}

        <HistoryPanel
          history={history}
          onSelectEntry={handleSelectFromHistory}
          onClear={clearHistory}
        />

        <footer className="text-center py-6 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
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
              <span className="icon-github w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
