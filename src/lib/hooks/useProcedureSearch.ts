import { useState, useEffect, useCallback } from 'react';

export interface Icd9CmEntry {
  id: string;
  code: string;
  display: string;
  display_id: string | null;
  category: string | null;
}

export interface UseProcedureSearchResult {
  results: Icd9CmEntry[];
  isLoading: boolean;
  error: string | null;
}

export function useProcedureSearch(query: string): UseProcedureSearchResult {
  const [results, setResults] = useState<Icd9CmEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/icd9cm?q=${encodeURIComponent(searchQuery)}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: Icd9CmEntry[] = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mencari data.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  return { results, isLoading, error };
}
