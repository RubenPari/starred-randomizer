import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Repo } from '../types';
import { handleApiError } from '../utils/format';

interface UseStarredReposReturn {
  repos: Repo[];
  loading: boolean;
  error: string | null;
  fetchStarred: (username: string) => Promise<void>;
  clearError: () => void;
}

export function useStarredRepos(): UseStarredReposReturn {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStarred = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<Repo[]>(`/api/starred/${username}`);
      setRepos(res.data);
    } catch (err: unknown) {
      setError(handleApiError(err));
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { repos, loading, error, fetchStarred, clearError };
}
