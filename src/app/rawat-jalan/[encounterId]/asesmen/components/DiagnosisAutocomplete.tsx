import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useDiagnosisSearch } from '@/lib/hooks/useDiagnosisSearch';
import { X, Search, Loader2 } from 'lucide-react';

export interface DiagnosisAutocompleteProps {
  onSelectDiagnosis: (code: string, display: string) => void;
  encounterId?: string;
}

export function DiagnosisAutocomplete({ onSelectDiagnosis, encounterId }: DiagnosisAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { results, isLoading, error } = useDiagnosisSearch(searchQuery);

  const handleBlur = () => {
    // Small delay to allow click events on dropdown items to fire before hiding
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1);
    if (!showDropdown) {
      setShowDropdown(true);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedIndex(-1);
    setShowDropdown(false);
  };

  const handleSelect = (code: string, display: string) => {
    onSelectDiagnosis(code, display);
    setSearchQuery(''); // Clear search after selection
    setShowDropdown(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const item = results[selectedIndex];
        handleSelect(item.code, item.display);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Cari kode ICD-10 atau deskripsi (min. 3 huruf)..."
          className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] text-sm transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && searchQuery.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-xl py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-[300px] sm:text-sm border border-gray-100">
          {searchQuery.length < 3 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Masukkan minimal 3 karakter
            </div>
          ) : isLoading ? (
            <div className="px-4 py-3 flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="animate-spin h-5 w-5 mr-2 text-[#0F766E]" />
              Mencari...
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-sm text-red-500">
              Terjadi kesalahan: {error}
            </div>
          ) : results.length > 0 ? (
            <ul className="m-0 p-0 list-none">
              {results.map((item, index) => (
                <li
                  key={item.code}
                  className={`cursor-pointer select-none relative py-2 px-4 ${
                    index === selectedIndex
                      ? 'bg-[#E6F5F4] text-[#0F766E]'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(item.code, item.display)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="font-semibold">[{item.code}]</span> - {item.display}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              Tidak ada hasil
            </div>
          )}
        </div>
      )}
    </div>
  );
}
