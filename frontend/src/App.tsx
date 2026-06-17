import { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import SettingsPanel from './components/SettingsPanel';
import { SkeletonCard } from './components/SkeletonCard';
import StatisticsPanel from './components/StatisticsPanel';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import ResultCard from './components/ResultCard';
import HistoryPanel from './components/HistoryPanel';
import ShuffleAnimation from './components/ShuffleAnimation';
import SearchPanel from './components/SearchPanel';
import HiddenGems from './components/HiddenGems';
import FavoritesPanel from './components/FavoritesPanel';
import StatsDashboard from './components/StatsDashboard';
import TimelineHeatmap from './components/TimelineHeatmap';
import { useStarredRepos } from './hooks/useStarredRepos';
import { useRandomRepo } from './hooks/useRandomRepo';
import { useFavorites } from './hooks/useFavorites';
import { useTheme } from './hooks/useTheme';
import type { Repo, HiddenGemScore, RepoStats, RepoFilters } from './types';
import { IconZap, IconGitHub } from './components/Icons';
import { handleApiError } from './utils/format';

const DEFAULT_USERNAME = 'RubenPari';
const HIDDEN_GEMS_LIMIT = 10;

function AppContent() {
  const { user, login, register, logout, updateToken, loading: authLoading } = useContext(AuthContext);
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [filters, setFilters] = useState<RepoFilters>({ language: '', min_stars: 0, topic: '', include_archived: true, updated_after: '' });
  const [shufflePhase, setShufflePhase] = useState(false);
  const [searchResults, setSearchResults] = useState<Repo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [gems, setGems] = useState<HiddenGemScore[]>([]);
  const [gemsLoading, setGemsLoading] = useState(false);
  const [gemsError, setGemsError] = useState<string | null>(null);
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setAuthModalOpen(true);
    }
  }, [authLoading, user]);
  const [activeTab, setActiveTab] = useState<'randomizer' | 'search' | 'gems' | 'stats' | 'favorites'>('randomizer');
  const resultRef = useRef<HTMLDivElement>(null);

  const { darkMode, toggleTheme } = useTheme();
  const { repos, loading: starredLoading, error: starredError, fetchStarred } = useStarredRepos();
  const { randomRepo, loading: randomLoading, error: randomError, history, getRandom, selectFromHistory, clearHistory } = useRandomRepo();
  const { favorites, addFavorite, removeFavorite, isFavorite, clearFavorites } = useFavorites();

  const loading = starredLoading || randomLoading;

  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      if (filters.language && r.language?.toLowerCase() !== filters.language.toLowerCase()) return false;
      if (filters.min_stars > 0 && r.stargazers_count < filters.min_stars) return false;
      if (filters.topic && !r.topics.some((t) => t.toLowerCase() === filters.topic.toLowerCase())) return false;
      if (!filters.include_archived && r.archived) return false;
      if (filters.updated_after) {
        const d = new Date(filters.updated_after);
        if (!Number.isNaN(d.getTime()) && new Date(r.updated_at) < d) return false;
      }
      return true;
    });
  }, [repos, filters]);

  const languages = useMemo(
    () => Array.from(new Set(repos.map((r) => r.language).filter((l): l is string => Boolean(l)))).sort(),
    [repos]
  );
  const topics = useMemo(
    () => Array.from(new Set(repos.flatMap((r) => r.topics))).sort(),
    [repos]
  );

  const maxStars = useMemo(
    () => repos.reduce((max, r) => Math.max(max, r.stargazers_count), 0) || 100,
    [repos]
  );

  useEffect(() => {
    fetchStarred(username);
  }, [username, fetchStarred]);

  const handleRandom = useCallback(async () => {
    setShufflePhase(true);
    await getRandom(username, filters.language, filters.min_stars, filters.topic, filters.include_archived, filters.updated_after, filteredRepos.length);
    setShufflePhase(false);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [username, filters, filteredRepos.length, getRandom]);

  const resetFilters = useCallback(() => {
    setFilters({ language: '', min_stars: 0, topic: '', include_archived: true, updated_after: '' });
  }, []);

  const handleSelectFromHistory = useCallback((entry: { repo: Repo; timestamp: number }) => {
    selectFromHistory(entry);
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [selectFromHistory]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const params: Record<string, string | boolean | number> = { q: query };
      if (filters.topic) params.topic = filters.topic;
      params.include_archived = filters.include_archived;
      if (filters.updated_after) params.updated_after = filters.updated_after;
      const res = await axios.get<Repo[]>(`/api/search/${username}`, { params });
      setSearchResults(res.data);
    } catch (err) {
      setSearchError(handleApiError(err));
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [username, filters]);

  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  const [searchSelectedRepo, setRandomRepoFromSearch] = useState<Repo | null>(null);

  const handleSelectRepo = useCallback((repo: Repo) => {
    setRandomRepoFromSearch(repo);
    setActiveTab('randomizer');
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const handleFetchGems = useCallback(async () => {
    setGemsLoading(true);
    setGemsError(null);
    try {
      const res = await axios.get<HiddenGemScore[]>(`/api/hidden-gems/${username}`, { params: { limit: HIDDEN_GEMS_LIMIT } });
      setGems(res.data);
    } catch (err) {
      setGemsError(handleApiError(err));
      setGems([]);
    } finally {
      setGemsLoading(false);
    }
  }, [username]);

  const handleFetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await axios.get<RepoStats>(`/api/stats/${username}`);
      setStats(res.data);
    } catch (err) {
      setStatsError(handleApiError(err));
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [username]);

  const tabs = [
    { id: 'randomizer' as const, label: 'Randomizer' },
    { id: 'search' as const, label: 'Cerca' },
    { id: 'gems' as const, label: 'Hidden Gems' },
    { id: 'stats' as const, label: 'Statistiche' },
    { id: 'favorites' as const, label: `Preferiti (${favorites.length})` },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          username={username}
          onUsernameChange={setUsername}
          isAuthenticated={!!user}
          onAuthClick={() => setAuthModalOpen(true)}
          onLogout={logout}
          userEmail={user?.email ?? null}
          onOpenSettings={() => setSettingsOpen(true)}
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
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[40px] ${
                  activeTab === tab.id
                    ? 'bg-brand/20 text-brand'
                    : 'bg-surface-2 text-secondary hover:bg-surface-3'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'randomizer' && repos.length > 0 && (
          <>
            <FilterPanel
              repos={repos}
              filteredCount={filteredRepos.length}
              languages={languages}
              topics={topics}
              filters={filters}
              maxStars={maxStars}
              loading={loading}
              onFilterChange={setFilters}
              onResetFilters={resetFilters}
              onRandom={handleRandom}
              error={randomError}
            />

            {loading && repos.length > 0 && <SkeletonCard />}

            {shufflePhase && filteredRepos.length > 0 && (
              <ShuffleAnimation filteredRepos={filteredRepos} />
            )}

            {(randomRepo || searchSelectedRepo) && !shufflePhase && (
              <ResultCard
                ref={resultRef}
                repo={randomRepo ?? searchSelectedRepo!}
                loading={loading}
                onReroll={handleRandom}
                isFavorite={isFavorite((randomRepo ?? searchSelectedRepo)!.full_name)}
                onToggleFavorite={() => {
                  const repo = randomRepo ?? searchSelectedRepo!;
                  if (isFavorite(repo.full_name)) {
                    removeFavorite(repo.full_name);
                  } else {
                    addFavorite(repo);
                  }
                }}
              />
            )}

            <HistoryPanel
              history={history}
              onSelectEntry={handleSelectFromHistory}
              onClear={clearHistory}
            />
          </>
        )}

        {activeTab === 'search' && (
          <SearchPanel
            filters={filters}
            topics={topics}
            onFilterChange={setFilters}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            isLoading={searchLoading}
            results={searchResults}
            onSelect={handleSelectRepo}
            error={searchError}
          />
        )}

        {activeTab === 'gems' && (
          <HiddenGems
            gems={gems}
            loading={gemsLoading}
            error={gemsError}
            onFetch={handleFetchGems}
            onSelect={handleSelectRepo}
          />
        )}

        {activeTab === 'stats' && (
          <>
            <StatsDashboard
              stats={stats}
              loading={statsLoading}
              error={statsError}
              onFetch={handleFetchStats}
            />
            {stats && stats.repoCreationActivity && stats.repoCreationActivity.length > 0 && (
              <TimelineHeatmap activity={stats.repoCreationActivity} />
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <FavoritesPanel
            favorites={favorites}
            onRemove={removeFavorite}
            onClear={clearFavorites}
            onSelect={handleSelectRepo}
          />
        )}

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
              <IconGitHub className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </footer>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={login}
        onRegister={register}
      />

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaveToken={updateToken}
      />
    </div>
  );
}

export default AppContent;