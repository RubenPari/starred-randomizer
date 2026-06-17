import { useState, useCallback } from 'react';
import { IconSearch, IconX } from './Icons';
import type { Repo, RepoFilters } from '../types';

interface SearchPanelProps {
  filters: RepoFilters;
  topics: string[];
  onFilterChange: (filters: RepoFilters) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading: boolean;
  results: Repo[];
  onSelect: (repo: Repo) => void;
  error: string | null;
}

export default function SearchPanel({ filters, topics, onFilterChange, onSearch, onClear, isLoading, results, onSelect, error }: SearchPanelProps) {
  const [query, setQuery] = useState('');

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onClear();
  }, [onClear]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg font-semibold text-primary">Cerca tra i tuoi starred</span>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cerca per nome, descrizione, topic..."
            className="w-full bg-surface-2 border border-surface-3 rounded-lg px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm text-primary"
            aria-label="Cerca repository"
          />
          <IconSearch className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              aria-label="Cancella ricerca"
            >
              <IconX className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
          className="px-4 py-2.5 bg-brand/10 hover:bg-brand/20 disabled:opacity-50 disabled:hover:bg-brand/10 rounded-lg transition-colors text-sm font-medium text-brand min-h-[44px]"
        >
          {isLoading ? '...' : 'Cerca'}
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
      {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}
      {results.length > 0 && (
        <ul className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {results.map((repo) => (
            <li
              key={repo.full_name}
              className="flex items-center justify-between text-sm p-3 rounded-lg hover:bg-surface-2/50 transition-colors cursor-pointer"
              onClick={() => onSelect(repo)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(repo);
                }
              }}
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium text-secondary truncate block">{repo.full_name}</span>
                {repo.description && (
                  <span className="text-xs text-muted truncate block">{repo.description}</span>
                )}
              </div>
              <span className="text-xs text-star ml-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-star" />
                {repo.stargazers_count}
              </span>
            </li>
          ))}
        </ul>
      )}
      {results.length === 0 && query.length > 0 && !isLoading && (
        <p className="text-sm text-muted mt-4 text-center">Nessun risultato trovato</p>
      )}
    </div>
  );
}
