import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useDiagnosisSearch } from '@/lib/hooks/useDiagnosisSearch';
import { X, Search, Loader2, ArrowLeft } from 'lucide-react';

const HTML_TAG_REGEX = /<[^>]*>/g;

export interface AssessmentDiagnosisFormProps {
  onSelectDiagnosis: (code: string, display: string, notes?: string) => void;
  encounterId?: string;
}

export function AssessmentDiagnosisForm({ onSelectDiagnosis, encounterId }: AssessmentDiagnosisFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualNote, setManualNote] = useState('');

  const { results, isLoading, error } = useDiagnosisSearch(searchQuery);

  const handleBlur = () => {
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
    setSearchQuery('');
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

  const handleAddManual = () => {
    const sanitized = manualText.replace(HTML_TAG_REGEX, '').trim();
    if (sanitized.length < 5) return;
    if (sanitized.length > 500) return;
    const note = manualNote.trim() || 'Manual diagnosis - kode ICD-10 tidak ditemukan';
    onSelectDiagnosis('MANUAL', sanitized, note);
    setManualText('');
    setManualNote('');
    setIsManualMode(false);
  };

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  if (isManualMode) {
    const sanitizedLength = manualText.replace(HTML_TAG_REGEX, '').trim().length;
    const isAddDisabled = sanitizedLength < 5 || sanitizedLength > 500;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-600">
              Deskripsi diagnosis manual
            </span>
            <span className={`text-[12px] font-sans font-medium ${sanitizedLength > 500 ? 'text-red-500' : 'text-gray-400'}`}>
              {sanitizedLength}/500 karakter
            </span>
          </div>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Masukkan diagnosis secara manual (min. 5 karakter)..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white text-gray-900 placeholder-gray-400 resize-y focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] min-h-[80px] transition-colors"
          />
          {sanitizedLength > 0 && sanitizedLength < 5 && (
            <p className="text-red-500 text-[12px]">Minimal 5 karakter</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
            Catatan <span className="text-gray-400 font-normal normal-case tracking-normal ml-1">(Opsional)</span>
          </label>
          <textarea
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            placeholder="Tambahkan catatan untuk diagnosis ini..."
            rows={2}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-[#F9FAFB] text-gray-900 placeholder-gray-400 resize-y focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAddManual}
            disabled={isAddDisabled}
            className="px-4 py-2 bg-[#0F766E] hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Tambahkan Diagnosis
          </button>
          <button
            type="button"
            onClick={() => { setIsManualMode(false); setManualText(''); setManualNote(''); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Pencarian
          </button>
        </div>
      </div>
    );
  }

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
            <>
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
              <div className="px-4 py-2 border-t border-gray-100">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setIsManualMode(true); setSearchQuery(''); setShowDropdown(false); }}
                  className="text-xs text-[#0F766E] hover:underline cursor-pointer"
                >
                  Kode tidak ditemukan? Input manual
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 text-sm text-gray-500">
                Tidak ada hasil
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setIsManualMode(true); setSearchQuery(''); setShowDropdown(false); }}
                  className="text-xs text-[#0F766E] hover:underline cursor-pointer"
                >
                  Kode tidak ditemukan? Input manual
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
