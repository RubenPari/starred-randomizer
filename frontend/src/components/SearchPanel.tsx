import { useState, useCallback } from 'react';
import { IconSearch, IconX } from './Icons';
import type { Repo } from '../types';

interface SearchPanelProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading: boolean;
  results: Repo[];
  onSelect: (repo: Repo) => void;
  error: string | null;
}

export default function SearchPanel({ onSearch, onClear, isLoading, results, onSelect, error }: SearchPanelProps) {
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
