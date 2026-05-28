import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import type { Repo } from '../types';
import { handleApiError } from '../utils/format';

interface UseRandomRepoReturn {
  randomRepo: Repo | null;
  loading: boolean;
  error: string | null;
  history: HistoryEntry[];
  getRandom: (username: string, language: string, minStars: number, filteredCount: number) => Promise<void>;
  clearError: () => void;
  selectFromHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

export interface HistoryEntry {
  repo: Repo;
  timestamp: number;
}

export function useRandomRepo(): UseRandomRepoReturn {
  const [randomRepo, setRandomRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const getRandom = useCallback(async (username: string, language: string, minStars: number, filteredCount: number) => {
    if (filteredCount === 0) {
      setError('Nessun repository disponibile con i filtri selezionati');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get<Repo>(`/api/random/${username}`, {
        params: { language: language || undefined, min_stars: minStars || undefined },
      });
      setRandomRepo(res.data);
      setHistory((prev) => [{ repo: res.data, timestamp: Date.now() }, ...prev].slice(0, 10));
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string }>;
      if (axiosError.response?.data?.error) {
        setError(axiosError.response.data.error);
      } else {
        setError(handleApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const selectFromHistory = useCallback((entry: HistoryEntry) => {
    setRandomRepo(entry.repo);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { randomRepo, loading, error, history, getRandom, clearError, selectFromHistory, clearHistory };
}
