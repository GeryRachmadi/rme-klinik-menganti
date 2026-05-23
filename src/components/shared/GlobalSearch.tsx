"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-items";

interface GlobalSearchProps {
  userRole: string;
}

export default function GlobalSearch({ userRole }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const allowedItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole as "ADMIN" | "PENDAFTARAN" | "PERAWAT" | "DOKTER")
  );

  const results =
    query.trim().length === 0
      ? []
      : allowedItems.filter((item) => {
          const q = query.toLowerCase();
          return (
            item.label.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
          );
        });

  // Reset highlight when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results.length]);

  // Close on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    setShowDropdown(true);
  }

  function handleFocus() {
    if (query.trim().length > 0) setShowDropdown(true);
  }

  function handleBlur() {
    setTimeout(() => setShowDropdown(false), 150);
  }

  function handleSelect(href: string) {
    setQuery("");
    setShowDropdown(false);
    router.push(href);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex].href);
      }
    } else if (e.key === "Escape") {
      setQuery("");
      setShowDropdown(false);
    }
  }

  const isOpen = showDropdown && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      {/* Input */}
      <Search
        size={15}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Cari menu atau halaman…"
        autoComplete="off"
        className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2BB5A0]/30 transition"
        style={{ fontFamily: "var(--font-jakarta)" }}
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
          {results.length === 0 ? (
            <p
              className="px-4 py-3 text-sm text-gray-400 text-center"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Tidak ada hasil untuk &quot;{query}&quot;
            </p>
          ) : (
            <ul>
              {results.map((item, idx) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(item.href)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                      idx === selectedIndex
                        ? "bg-[#E6F5F4] text-[#0F766E]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    <span className="text-sm font-semibold">{item.label}</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      className={idx === selectedIndex ? "text-[#0F766E]" : "text-gray-300"}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
