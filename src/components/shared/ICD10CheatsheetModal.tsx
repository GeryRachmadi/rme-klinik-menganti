'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';

interface ICD10Row {
  id: string;
  code: string;
  display: string;
  display_id: string | null;
}

interface ICD10CheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string, display: string) => void;
}

export function ICD10CheatsheetModal({ isOpen, onClose, onSelect }: ICD10CheatsheetModalProps) {
  const [allRows, setAllRows]       = useState<ICD10Row[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setFilterQuery('');
    setIsLoading(true);
    setError(null);

    fetch('/api/icd10?all=true', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json() as Promise<ICD10Row[]>;
      })
      .then((data) => setAllRows(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat data.'))
      .finally(() => setIsLoading(false));

    setTimeout(() => searchRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = filterQuery.toLowerCase();
  const filtered = q.length === 0 ? allRows : allRows.filter(
    (row) =>
      row.code.toLowerCase().includes(q) ||
      row.display.toLowerCase().includes(q) ||
      (row.display_id ?? '').toLowerCase().includes(q)
  );

  const handleSelect = (row: ICD10Row) => {
    onSelect(row.code, row.display_id ?? row.display);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 rounded-t-2xl flex-shrink-0"
          style={{ backgroundColor: '#0F766E' }}
        >
          <h2 className="text-base font-semibold text-white" style={{ fontFamily: '"Poppins", sans-serif' }}>
            Daftar Kode ICD-10
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:opacity-75 transition-opacity cursor-pointer"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Cari kode, nama Indonesia, atau nama Inggris…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors"
              autoComplete="off"
            />
          </div>
          {!isLoading && (
            <p className="text-xs text-gray-400 mt-1.5">
              {filtered.length} kode ditemukan
            </p>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <Loader2 className="animate-spin h-5 w-5 text-[#0F766E]" />
              Memuat data…
            </div>
          ) : error ? (
            <div className="px-5 py-8 text-sm text-red-500 text-center">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-sm text-gray-400 text-center">Tidak ada kode yang cocok.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.map((row) => (
                <li
                  key={row.id}
                  onClick={() => handleSelect(row)}
                  className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-[#E6F5F4] transition-colors group"
                >
                  <span
                    className="flex-shrink-0 inline-block w-[4.5rem] text-center text-xs font-semibold text-white rounded px-1.5 py-0.5 mt-0.5"
                    style={{ backgroundColor: '#0F766E' }}
                  >
                    {row.code}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-[#0A5A54] leading-snug">
                      {row.display_id ?? row.display}
                    </p>
                    {row.display_id && (
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{row.display}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Klik baris untuk mengisi kolom diagnosis secara otomatis
          </p>
        </div>
      </div>
    </div>
  );
}
