"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import type { Prisma } from "@/generated/prisma";
import { formatDoctorName } from "@/lib/utils/format-doctor-name";

export type ActivityLogEntry = Prisma.ActivityLogGetPayload<{
  include: {
    account: {
      select: {
        username: true;
        role: true;
        practitioner: { select: { name: true; speciality: true } };
      };
    };
  };
}>;

interface ParsedAction {
  type: string;
  desc: string;
  detail?: string;
}

function parseAction(raw: string): ParsedAction {
  try {
    const parsed = JSON.parse(raw) as ParsedAction;
    if (parsed.type && parsed.desc) return parsed;
  } catch {
    // fall through
  }
  return { type: raw, desc: raw };
}

const ACTION_TITLES: Record<string, string> = {
  ENCOUNTER_CREATED:    "Antrean Kunjungan Ditambahkan",
  ENCOUNTER_UPDATED:    "Data Kunjungan Diperbarui",
  ENCOUNTER_CANCELLED:  "Antrean Kunjungan Dibatalkan",
  ENCOUNTER_DELETED:    "Kunjungan Dihapus",
  PATIENT_CREATED:   "Pasien Baru Didaftarkan",
  PATIENT_UPDATED:   "Data Pasien Diperbarui",
  PATIENT_DELETED:   "Pasien Dihapus",
  VIEW_MEDICAL_RECORD:  "Rekam Medis Dilihat",
  ASSESSMENT_SAVED:    "Kajian Awal Dicatat",
  PHYSICAL_EXAM_SAVED: "Pemeriksaan Fisik Dicatat",
  SOAP_COMPLETED:      "Asesmen SOAP Diselesaikan",
};

const ROLE_OPTIONS = ["ADMIN", "PENDAFTARAN", "PERAWAT", "DOKTER"] as const;

const ROLE_LABELS: Record<string, string> = {
  ADMIN:       "Admin",
  PENDAFTARAN: "Pendaftaran",
  PERAWAT:     "Perawat",
  DOKTER:      "Dokter",
};

function formatTimeWIB(date: Date): string {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function formatDateWIB(date: Date): string {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

const LIMIT = 4;

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

interface ActivityLogTableProps {
  logs: ActivityLogEntry[];
  total: number;
}

export default function ActivityLogTable({ logs, total }: ActivityLogTableProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [filterOpen]);

  const isFilterActive = selectedRole !== null;
  const filtered = isFilterActive
    ? logs.filter((log) => log.account?.role === selectedRole)
    : logs;

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
  const rangeEnd = Math.min(currentPage * LIMIT, filtered.length);

  return (
    <div className="bg-white rounded-3xl p-6" style={{ fontFamily: "var(--font-jakarta)" }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-[#009E95] -mx-6 -mt-6 px-6 py-3 mb-6 rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-transparent" />
          <h2
            className="text-sm font-bold text-white tracking-widest"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            LOG AKTIVITAS TERBARU
          </h2>
        </div>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-white/30 text-[#475569] hover:bg-white/80 transition-colors"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            <SlidersHorizontal size={12} strokeWidth={2.5} />
            Filter
            {isFilterActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#2DD4BF]" />
            )}
          </button>

          {filterOpen && (
            <div
              className="absolute right-0 top-full mt-2 z-30 bg-white border border-gray-100 rounded-2xl shadow-lg p-2"
              style={{ minWidth: 160, fontFamily: "var(--font-jakarta)" }}
            >
              <p className="text-xs font-bold text-gray-400 tracking-widest uppercase px-3 py-1.5">
                Peran
              </p>

              <button
                type="button"
                onClick={() => { setSelectedRole(null); setCurrentPage(1); setFilterOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedRole === null
                    ? "bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-[#006B5F]"
                    : "text-gray-700 hover:bg-[#F4F4F4] hover:text-[#50555C]"
                }`}
              >
                Semua
              </button>

              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setSelectedRole(role); setCurrentPage(1); setFilterOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedRole === role
                      ? "bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-[#006B5F]"
                      : "text-gray-600 hover:bg-[#F4F4F4] hover:text-[#50555C]"
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <ClipboardList size={36} className="text-gray-200" strokeWidth={1.5} />
          <p className="text-sm text-gray-300">
            Belum ada aktivitas tercatat.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-300 text-sm">
          Tidak ada aktivitas untuk filter ini.
        </div>
      ) : (
        <>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 w-[90px]">
                Waktu
              </th>
              <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Log
              </th>
              <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 w-[130px]">
                Oleh
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((log) => {
              const parsed = parseAction(log.action);
              const title = ACTION_TITLES[parsed.type] ?? parsed.desc;
              const actorRawName =
                log.account?.practitioner?.name ?? log.account?.username ?? "-";
              const actorName =
                log.account?.role === "DOKTER" && log.account.practitioner?.name
                  ? formatDoctorName(log.account.practitioner.name, log.account.practitioner.speciality)
                  : actorRawName;
              const actorRoleLabel = ROLE_LABELS[log.account?.role ?? ""] ?? "-";

              return (
                <tr key={log.id} className="border-b border-gray-100 last:border-0">
                  {/* Waktu */}
                  <td className="py-3 align-top">
                    <p className="text-sm font-semibold text-gray-700 leading-snug">
                      {formatTimeWIB(log.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDateWIB(log.createdAt)}
                    </p>
                  </td>

                  {/* Log */}
                  <td className="py-3 align-top">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                      {title}
                    </p>
                    {parsed.detail && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {parsed.detail}
                      </p>
                    )}
                  </td>

                  {/* Oleh */}
                  <td className="py-3 align-top">
                    <p className="text-sm font-semibold text-gray-800 leading-snug truncate max-w-[120px]">
                      {actorName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {actorRoleLabel}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-6">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
              Sebelum
            </button>

            {getPageNumbers(currentPage, totalPages).map((p, i) =>
              p === "…" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-gray-300 text-sm select-none"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    p === currentPage
                      ? "text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={{
                    fontFamily: "var(--font-jakarta)",
                    background: p === currentPage ? "#2BB5A0" : undefined,
                  }}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Selanjutnya
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Record count */}
        <p
          className="text-center text-xs text-gray-300 mt-4"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {filtered.length === 0
            ? "Tidak ada aktivitas untuk filter ini."
            : `Menampilkan ${rangeStart}–${rangeEnd} dari ${total} aktivitas`}
        </p>
        </>
      )}
    </div>
  );
}
