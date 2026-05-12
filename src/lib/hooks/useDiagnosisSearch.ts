import { useState, useEffect, useCallback } from 'react';
import { ICD10_MOCK_DATA } from '../constants/icd10-mock';

export interface ICD10Entry {
  code: string;
  display: string;
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

  // Debounce logic
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = useCallback((query: string) => {
    if (!query || query.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lowerQuery = query.toLowerCase();
      
      const matched = ICD10_MOCK_DATA.filter(
        (item) =>
          item.code.toLowerCase().includes(lowerQuery) ||
          item.display.toLowerCase().includes(lowerQuery)
      );

      // Sort exact matches first, then partial matches
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
