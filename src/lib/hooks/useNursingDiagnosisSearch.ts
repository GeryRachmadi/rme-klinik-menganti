import { useState, useEffect, useCallback } from 'react';
import { SDKI_MOCK, SdkiEntry } from '../constants/sdki-mock';

export interface UseNursingDiagnosisSearchResult {
  results: SdkiEntry[];
  isLoading: boolean;
  error: string | null;
}

export function useNursingDiagnosisSearch(query: string): UseNursingDiagnosisSearchResult {
  const [results, setResults] = useState<SdkiEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lowerQuery = searchQuery.toLowerCase();

      const matched = SDKI_MOCK.filter((item) => {
        const matchCode = item.code.toLowerCase().includes(lowerQuery);
        const matchDisplay = item.display.toLowerCase().includes(lowerQuery);
        const matchCategory = item.category?.toLowerCase().includes(lowerQuery) ?? false;

        return matchCode || matchDisplay || matchCategory;
      });

      matched.sort((a, b) => {
        const aCodeExact = a.code.toLowerCase() === lowerQuery;
        const bCodeExact = b.code.toLowerCase() === lowerQuery;

        if (aCodeExact && !bCodeExact) return -1;
        if (!aCodeExact && bCodeExact) return 1;

        const aDisplayExact = a.display.toLowerCase() === lowerQuery;
        const bDisplayExact = b.display.toLowerCase() === lowerQuery;

        if (aDisplayExact && !bDisplayExact) return -1;
        if (!aDisplayExact && bDisplayExact) return 1;

        return 0;
      });

      setResults(matched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during search');
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
