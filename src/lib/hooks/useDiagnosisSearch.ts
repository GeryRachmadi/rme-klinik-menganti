import { useState, useEffect, useCallback } from 'react';

export interface ICD10Entry {
  id: string;
  code: string;
  display: string;
  display_id: string | null;
}

export interface UseDiagnosisSearchResult {
  results: ICD10Entry[];
  isLoading: boolean;
  error: string | null;
}

export function useDiagnosisSearch(searchQuery: string): UseDiagnosisSearchResult {
  const [results, setResults] = useState<ICD10Entry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/icd10?q=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: ICD10Entry[] = await res.json();
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
