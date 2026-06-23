"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import QueueFilterDropdown from "./QueueFilterDropdown";
import { formatJenisKelamin } from "@/lib/utils/format-gender";

interface QueuePatient {
  namaLengkap: string;
  jenisKelamin?: string;
  tanggalLahir?: Date;
}

export interface QueueEncounterItem {
  id: string;
  queueNumber: string | null;
  periodStart: Date;
  status: string;
  priority: string;
  reasonCode?: string | null;
  patient: QueuePatient;
}

type Variant = "pendaftaran" | "perawat" | "dokter";

interface DashboardQueueTableProps {
  title: string;
  encounters: QueueEncounterItem[];
  variant: Variant;
  emptyMessage?: string;
}

// DB-stored priority values → display config
const PRIORITAS_CONFIG: Record<string, { label: string; className: string }> = {
  STABIL:          { label: "Stabil",         className: "text-[#2BB5A0] border-[#2BB5A0]" },
  CUKUP_BERISIKO:  { label: "Cukup Berisiko", className: "text-orange-500 border-orange-500" },
  BERISIKO:        { label: "Berisiko",        className: "text-yellow-500 border-yellow-500" },
  BERISIKO_TINGGI: { label: "Berisiko Tinggi", className: "text-red-500 border-red-500 bg-red-50" },
};

const STATUS_STYLE: Record<string, { bgClass: string; textClass: string }> = {
  MENUNGGU:  { bgClass: "bg-orange-50", textClass: "text-orange-500" },
  DIPERIKSA: { bgClass: "bg-teal-50",   textClass: "text-teal-600"   },
  SELESAI:   { bgClass: "bg-gray-100",  textClass: "text-gray-500"   },
  BATAL:     { bgClass: "bg-red-50",    textClass: "text-red-500"    },
};

const STATUS_LABEL: Record<Variant, Record<string, string>> = {
  pendaftaran: { MENUNGGU: "Menunggu",         DIPERIKSA: "Diperiksa",        SELESAI: "Selesai", BATAL: "Batal" },
  perawat:     { MENUNGGU: "Menunggu Asesmen", DIPERIKSA: "Siap Diperiksa",   SELESAI: "Selesai", BATAL: "Batal" },
  dokter:      { MENUNGGU: "Menunggu",         DIPERIKSA: "Sedang Diperiksa", SELESAI: "Selesai", BATAL: "Batal" },
};

const ACTION_LABEL: Record<Variant, string> = {
  pendaftaran: "",
  perawat:     "Asesmen",
  dokter:      "Periksa",
};


function formatWIB(date: Date): string {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function calcAge(birthdate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const m = now.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthdate.getDate())) age--;
  return age;
}

function getPoliLabel(q: string): string {
  const p = q.charAt(0).toUpperCase();
  if (p === "U") return "Poli Umum";
  if (p === "G") return "Poli Gigi";
  return "-";
}

const LIMIT = 4;

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

const PRIORITY_LABEL_TO_DB: Record<string, string> = {
  "Stabil":         "STABIL",
  "Cukup Berisiko": "CUKUP_BERISIKO",
  "Berisiko":       "BERISIKO",
  "Berisiko Tinggi":"BERISIKO_TINGGI",
};

const STATUS_LABEL_TO_DB: Record<string, string> = {
  "Menunggu":  "MENUNGGU",
  "Diperiksa": "DIPERIKSA",
  "Selesai":   "SELESAI",
  "Batal":     "BATAL",
};

export default function DashboardQueueTable({
  title,
  encounters,
  variant,
  emptyMessage = "Belum ada antrean hari ini.",
}: DashboardQueueTableProps) {
  const [filters, setFilters] = useState({ prioritas: "Semua", status: "Semua", tanggal: "semua" });
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (newFilters: { prioritas: string; status: string; tanggal: string }) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const filtered = encounters.filter((e) => {
    const matchPrioritas = filters.prioritas === "Semua" || e.priority === PRIORITY_LABEL_TO_DB[filters.prioritas];
    const matchStatus    = filters.status === "Semua"    || e.status   === STATUS_LABEL_TO_DB[filters.status];

    let matchTanggal = true;
    if (filters.tanggal !== "semua") {
      const d = new Date(e.periodStart);
      d.setHours(0, 0, 0, 0);
      const dTime = d.getTime();

      if (filters.tanggal === "hari-ini") {
        matchTanggal = dTime === todayTime;
      } else if (filters.tanggal === "minggu-lalu") {
        const from = new Date(today);
        from.setDate(today.getDate() - 7);
        matchTanggal = dTime >= from.getTime() && dTime <= todayTime;
      } else if (filters.tanggal === "bulan-lalu") {
        const from = new Date(today);
        from.setDate(today.getDate() - 30);
        matchTanggal = dTime >= from.getTime() && dTime <= todayTime;
      } else if (filters.tanggal === "tahun-lalu") {
        const from = new Date(today);
        from.setFullYear(today.getFullYear() - 1);
        matchTanggal = dTime >= from.getTime() && dTime <= todayTime;
      } else {
        // YYYY-MM-DD specific date
        const [y, m, day] = filters.tanggal.split("-").map(Number);
        matchTanggal = dTime === new Date(y, m - 1, day).getTime();
      }
    }

    return matchPrioritas && matchStatus && matchTanggal;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
  const rangeEnd = Math.min(currentPage * LIMIT, filtered.length);

  const showWaktu   = variant !== "dokter";
  const showPoli    = variant === "pendaftaran";
  const showKeluhan = variant === "dokter";
  const showAction  = variant === "perawat" || variant === "dokter";
  const statusLabels = STATUS_LABEL[variant];

  return (
    <div className="col-span-8 bg-white rounded-3xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#2BB5A0]" />
          <h2
            className="text-sm font-bold text-gray-800 tracking-widest"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <QueueFilterDropdown onFilterChange={handleFilterChange} />
          <Link
            href="/rawat-jalan"
            className="px-4 py-1.5 rounded-full text-sm text-white transition-colors hover:opacity-90"
            style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
          >
            Selengkapnya
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-gray-300 text-sm"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {encounters.length === 0 ? emptyMessage : "Tidak ada antrean dengan filter ini."}
        </div>
      ) : (
        <>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-100">
              {[
                "NO.ANTREAN",
                ...(showWaktu   ? ["WAKTU"]        : []),
                "NAMA",
                ...(showPoli    ? ["POLI TUJUAN"]  : []),
                ...(showKeluhan ? ["KELUHAN AWAL"] : []),
                "PRIORITAS",
                "STATUS",
                ...(showAction  ? ["ACTION"]       : []),
              ].map((col) => (
                <th
                  key={col}
                  className="pb-3 text-xs font-semibold text-gray-400 tracking-wider"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((enc) => {
              const statusStyle  = STATUS_STYLE[enc.status] ?? STATUS_STYLE["MENUNGGU"];
              const statusLabel  = statusLabels[enc.status] ?? enc.status;
              const prioritasCfg = PRIORITAS_CONFIG[enc.priority] ?? {
                label: enc.priority,
                className: "text-gray-500 border-gray-200",
              };
              const age    = enc.patient.tanggalLahir ? calcAge(enc.patient.tanggalLahir) : null;
              const gender = enc.patient.jenisKelamin
                ? formatJenisKelamin(enc.patient.jenisKelamin)
                : null;

              return (
                <tr key={enc.id} className="border-b border-gray-50 last:border-0">
                  <td
                    className="py-3 text-sm font-bold"
                    style={{ fontFamily: "var(--font-poppins)", color: "#2BB5A0" }}
                  >
                    {enc.queueNumber}
                  </td>

                  {showWaktu && (
                    <td
                      className="py-3 text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {formatWIB(enc.periodStart)}
                    </td>
                  )}

                  <td className="py-3">
                    <p
                      className="text-sm font-semibold text-gray-800 leading-snug"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {enc.patient.namaLengkap}
                    </p>
                    {(gender || age !== null) && (
                      <p
                        className="text-xs text-gray-400 mt-0.5"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {[gender, age !== null ? `${age} tahun` : null]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    )}
                  </td>

                  {showPoli && (
                    <td
                      className="py-3 text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {getPoliLabel(enc.queueNumber ?? "")}
                    </td>
                  )}

                  {showKeluhan && (
                    <td className="py-3 max-w-[180px]">
                      <p
                        className="text-sm text-gray-600 line-clamp-2"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {enc.reasonCode ?? "-"}
                      </p>
                    </td>
                  )}

                  <td className="py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border bg-white ${prioritasCfg.className}`}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {prioritasCfg.label}
                    </span>
                  </td>

                  <td className="py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bgClass} ${statusStyle.textClass}`}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {statusLabel}
                    </span>
                  </td>

                  {showAction && (
                    <td className="py-3">
                      {enc.status === "BATAL" ? (
                        // Cancelled encounters carry no assessable action.
                        <span className="text-xs text-gray-300">—</span>
                      ) : (
                        <Link
                          href={`/rawat-jalan/${enc.id}/asesmen`}
                          className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                          style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
                        >
                          {ACTION_LABEL[variant]}
                        </Link>
                      )}
                    </td>
                  )}
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
          {`Menampilkan ${rangeStart}–${rangeEnd} dari ${filtered.length} antrean`}
        </p>
        </>
      )}
    </div>
  );
}
