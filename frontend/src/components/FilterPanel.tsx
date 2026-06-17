import { IconRefresh, IconCode, IconDice } from './Icons';
import type { Repo, RepoFilters } from '../types';

interface FilterPanelProps {
  repos: Repo[];
  filteredCount: number;
  languages: string[];
  topics: string[];
  filters: RepoFilters;
  maxStars: number;
  loading: boolean;
  onFilterChange: (filters: RepoFilters) => void;
  onResetFilters: () => void;
  onRandom: () => void;
  error: string | null;
}

export default function FilterPanel({
  repos,
  filteredCount,
  languages,
  topics,
  filters,
  maxStars,
  loading,
  onFilterChange,
  onResetFilters,
  onRandom,
  error,
}: FilterPanelProps) {
  const hasActiveFilters = filters.language || filters.min_stars > 0 || filters.topic || filters.updated_after || !filters.include_archived;

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-accent">{filteredCount}</span>
          <span className="text-sm text-secondary">repo corrispondenti</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors flex items-center gap-1.5 min-h-[32px] focus:outline-none focus:ring-2 focus:ring-brand/50 text-secondary"
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
            onChange={(e) => onFilterChange({ ...filters, language: e.target.value })}
            className="w-full bg-surface-2 border border-surface-3 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm min-h-[44px] appearance-none cursor-pointer text-primary"
            aria-label="Filtra per linguaggio"
          >
            <option value="">Tutti i linguaggi</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconCode className="w-4 h-4 text-muted" />
          </div>
        </div>
        <div className="flex-1 sm:flex-initial sm:w-48">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-secondary">
              Min stelle:{' '}
              <span className="font-bold text-star">{filters.min_stars}</span>
            </label>
          </div>
          <input
            type="range"
            min="0"
            max={maxStars}
            step="1"
            value={filters.min_stars}
            onChange={(e) => onFilterChange({ ...filters, min_stars: parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-brand"
            aria-label="Filtro stelle minime"
            id="min-stars-range"
          />
        </div>
        <button
          onClick={onRandom}
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
      <div className="flex flex-col sm:flex-row gap-3 mt-3">
        <div className="flex-1 relative">
          <select
            value={filters.topic || ''}
            onChange={(e) => onFilterChange({ ...filters, topic: e.target.value })}
            disabled={topics.length === 0}
            className="w-full bg-surface-2 border border-surface-3 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm min-h-[44px] appearance-none cursor-pointer text-primary disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Filtra per topic"
          >
            <option value="">Tutti i topic</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconCode className="w-4 h-4 text-muted" />
          </div>
        </div>
        <label className="flex-1 sm:flex-initial flex items-center gap-2 min-h-[44px] px-3 bg-surface-2 border border-surface-3 rounded-lg cursor-pointer text-sm text-primary">
          <input
            type="checkbox"
            checked={filters.include_archived}
            onChange={(e) => onFilterChange({ ...filters, include_archived: e.target.checked })}
            className="w-4 h-4 accent-brand cursor-pointer"
            aria-label="Includi repository archiviati"
          />
          Includi archiviati
        </label>
        <div className="flex-1 sm:flex-initial sm:w-48">
          <label className="text-xs font-medium text-secondary block mb-1">Aggiornato dopo</label>
          <input
            type="date"
            value={filters.updated_after}
            onChange={(e) => onFilterChange({ ...filters, updated_after: e.target.value })}
            className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm min-h-[44px] text-primary"
            aria-label="Aggiornato dopo"
          />
        </div>
      </div>
      {error && repos.length > 0 && (
        <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
      )}
    </div>
  );
}
