'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { SDKI_MOCK, type SdkiEntry } from '@/lib/constants/sdki-mock';

interface SDKICheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string, display: string, category: string) => void;
}

const CATEGORY_ORDER = [
  'Fisiologis',
  'Psikologis',
  'Perilaku',
  'Relasional',
  'Lingkungan',
];

export function SDKICheatsheetModal({ isOpen, onClose, onSelect }: SDKICheatsheetModalProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFilterQuery('');
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
  const filtered: SdkiEntry[] = q.length === 0
    ? SDKI_MOCK
    : SDKI_MOCK.filter(
        (row) =>
          row.code.toLowerCase().includes(q) ||
          row.display.toLowerCase().includes(q) ||
          row.category.toLowerCase().includes(q)
      );

  const grouped = filtered.reduce<Record<string, SdkiEntry[]>>((acc, row) => {
    if (!acc[row.category]) acc[row.category] = [];
    acc[row.category].push(row);
    return acc;
  }, {});

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const handleSelect = (row: SdkiEntry) => {
    onSelect(row.code, row.display, row.category);
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
            Daftar Kode SDKI
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
              placeholder="Cari kode, nama diagnosis, atau kategori…"
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors"
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {filtered.length} diagnosis ditemukan
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-sm text-gray-400 text-center">Tidak ada diagnosis yang cocok.</div>
          ) : (
            <div>
              {sortedCategories.map((cat) => (
                <div key={cat}>
                  <div className="px-5 py-2 bg-gray-50 border-y border-gray-100 sticky top-0">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {cat}
                    </span>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {grouped[cat].map((row) => (
                      <li
                        key={row.code}
                        onClick={() => handleSelect(row)}
                        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[#E6F5F4] transition-colors group"
                      >
                        <span
                          className="flex-shrink-0 inline-block w-[4.5rem] text-center text-xs font-semibold text-white rounded px-1.5 py-0.5"
                          style={{ backgroundColor: '#0F766E' }}
                        >
                          {row.code}
                        </span>
                        <p className="text-sm text-gray-800 group-hover:text-[#0A5A54] leading-snug">
                          {row.display}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Klik baris untuk mengisi kolom diagnosis keperawatan secara otomatis
          </p>
        </div>
      </div>
    </div>
  );
}
