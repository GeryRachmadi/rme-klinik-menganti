'use client';

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { useNursingDiagnosisSearch } from '@/lib/hooks/useNursingDiagnosisSearch';

const HTML_TAG_REGEX = /<[^>]*>/g;

export interface SelectedNursingDiagnosis {
  code: string;
  display: string;
  category: string;
}

interface NursingDiagnosisAutocompleteProps {
  onDiagnosisChange: (diagnosis: SelectedNursingDiagnosis) => void;
}

export function NursingDiagnosisAutocomplete({
  onDiagnosisChange,
}: NursingDiagnosisAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualText, setManualText] = useState('');

  const { results, isLoading } = useNursingDiagnosisSearch(searchQuery);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleSelect = (diagnosis: SelectedNursingDiagnosis) => {
    onDiagnosisChange(diagnosis);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleAddManual = () => {
    const sanitized = manualText.replace(HTML_TAG_REGEX, '').trim();
    if (sanitized.length < 3) return;
    onDiagnosisChange({ code: 'MANUAL', display: sanitized, category: 'Manual' });
    setManualText('');
    setIsManualMode(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1);
    setShowDropdown(true);
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
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
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // ── Manual mode (mirrors PlanProcedureAutocomplete pattern) ──────────────
  if (isManualMode) {
    const sanitizedLength = manualText.replace(HTML_TAG_REGEX, '').trim().length;
    const isAddDisabled = sanitizedLength < 3;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-600">
              Diagnosis keperawatan manual
            </span>
            <span className={`text-[12px] font-medium ${sanitizedLength > 200 ? 'text-red-500' : 'text-gray-400'}`}>
              {sanitizedLength}/200 karakter
            </span>
          </div>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Masukkan diagnosis keperawatan secara manual (min. 3 karakter)…"
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white text-gray-900 placeholder-gray-400 resize-y focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] min-h-[80px] transition-colors"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          />
          {sanitizedLength > 0 && sanitizedLength < 3 && (
            <p className="text-red-500 text-[12px]">Minimal 3 karakter</p>
          )}
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
            onClick={() => { setIsManualMode(false); setManualText(''); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Pencarian
          </button>
        </div>
      </div>
    );
  }

  // ── Normal search mode ───────────────────────────────────────────────────
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
          placeholder="Cari diagnosis keperawatan…"
          className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] text-sm transition-colors"
          autoComplete="off"
        />
      </div>

      {showDropdown && searchQuery.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-md max-h-[300px] overflow-y-auto">
          {searchQuery.length < 3 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Masukkan minimal 3 karakter
            </div>
          ) : isLoading ? (
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="animate-spin h-4 w-4 text-[#0F766E]" />
              Mencari…
            </div>
          ) : results.length > 0 ? (
            <>
              <ul className="m-0 p-0 list-none">
                {results.map((item, index) => (
                  <li
                    key={item.code}
                    className={`cursor-pointer select-none py-2.5 px-4 ${
                      index === selectedIndex
                        ? 'bg-[#E6F5F4] text-[#0F766E]'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="text-sm font-medium">
                      <span className="font-semibold">{item.code}</span>
                      {' — '}
                      {item.display}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.category}</div>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-2 border-t border-gray-100">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setIsManualMode(true); setSearchQuery(''); setShowDropdown(false); }}
                  className="text-xs text-[#0F766E] hover:underline cursor-pointer"
                >
                  Kode SDKI tidak ditemukan? Input manual
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
                  Kode SDKI tidak ditemukan? Input manual
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
