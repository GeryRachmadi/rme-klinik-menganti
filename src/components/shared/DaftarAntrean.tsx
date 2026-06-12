"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
  ChevronDown,
} from "lucide-react";
import EncounterRegistrationDrawer from "@/components/shared/EncounterRegistrationDrawer";
import EncounterEditDrawer from "@/components/shared/EncounterEditDrawer";
import CalendarDateDropdown from "@/components/shared/CalendarDateDropdown";
import { formatDob } from "@/lib/utils/format-dob";

type Prioritas = "Stabil" | "Cukup Berisiko" | "Berisiko" | "Berisiko Tinggi";
type StatusAntrean = "Menunggu" | "Diperiksa" | "Selesai" | "Batal";
type JenisPasien = "UMUM" | "BPJS";

interface AntreanData {
  id: string;
  noAntrean: string;
  tanggal: string;
  waktu: string;
  namaPasien: string;
  jenisKelamin: string;
  umur: number;
  noRm: string;
  tanggalLahir?: Date | string | null;
  jenisPasien: JenisPasien;
  poli: string;
  dokter: string;
  prioritas: string;
  status: string;
  syncStatus?: string;
}

interface DaftarAntreanProps {
  userRole?: string;
}

const LIMIT = 4;

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

const PRIORITAS_BADGE: Record<Prioritas, string> = {
  "Stabil":         "text-[#2BB5A0] border-[#2BB5A0] bg-white",
  "Cukup Berisiko": "text-orange-500 border-orange-500 bg-white",
  "Berisiko":       "text-yellow-500 border-yellow-500 bg-white",
  "Berisiko Tinggi":"text-red-500 border-red-500 bg-red-50",
};

const STATUS_BADGE: Record<StatusAntrean, string> = {
  "Menunggu": "text-orange-500 border-orange-500 bg-white",
  "Diperiksa": "text-blue-500 border-blue-500 bg-white",
  "Selesai":  "text-[#2BB5A0] border-[#2BB5A0] bg-white",
  "Batal":    "text-red-500 border-red-500 bg-red-50",
};

const FALLBACK_BADGE = "text-gray-500 border-gray-200 bg-white";

export default function DaftarAntrean({ userRole }: DaftarAntreanProps) {
  const [antreanData, setAntreanData] = useState<AntreanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEncounterOpen, setIsAddEncounterOpen] = useState(false);
  const [editEncounterId, setEditEncounterId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; namaPasien: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; noAntrean: string; namaPasien: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("semua");
  const [filterPrioritas, setFilterPrioritas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [mounted, setMounted]           = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarPos, setCalendarPos]   = useState<{ top: number; left: number } | null>(null);
  const tanggalBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close calendar on outside click
  useEffect(() => {
    if (!calendarOpen) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Element;
      if (
        !tanggalBtnRef.current?.contains(t) &&
        !t.closest("[data-calendar-portal]")
      ) {
        setCalendarOpen(false);
        setCalendarPos(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [calendarOpen]);

  function openCalendar() {
    if (tanggalBtnRef.current) {
      const r = tanggalBtnRef.current.getBoundingClientRect();
      setCalendarPos({ top: r.bottom + 6, left: r.left });
    }
    setCalendarOpen(true);
  }

  function tanggalDisplayLabel(v: string): string {
    if (!v || v === "semua") return "Semua Tanggal";
    if (v === "hari-ini")    return "Hari Ini";
    if (v === "minggu-ini") return "Minggu Ini";
    if (v === "bulan-ini")  return "Bulan Ini";
    if (v === "tahun-ini")  return "Tahun Ini";
    if (v.includes("|")) {
      const [from, to] = v.split("|");
      const fmt = (s: string) => s.split("-").reverse().join("/");
      return `${fmt(from)} – ${fmt(to)}`;
    }
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }

  const isAuthorized = userRole === "PENDAFTARAN" || userRole === "ADMIN";
  const canAssess = userRole === "ADMIN" || userRole === "DOKTER" || userRole === "PERAWAT";
  const router = useRouter();

  const fetchAntrean = useCallback(async () => {
    try {
      const res = await fetch("/api/encounters");
      const json = await res.json();
      if (json.success) {
        setAntreanData(json.data);
      } else {
        console.error("Gagal memuat antrean:", json.error);
      }
    } catch (error) {
      console.error("Terjadi kesalahan jaringan:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAntrean();
    const interval = setInterval(fetchAntrean, 5000);
    return () => clearInterval(interval);
  }, [fetchAntrean]);

  const showActionToast = (message: string, type: "success" | "error") => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/encounters/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showActionToast(json.error ?? "Gagal menghapus antrean.", "error");
        return;
      }
      setDeleteTarget(null);
      await fetchAntrean();
      showActionToast("Antrean berhasil dihapus.", "success");
    } catch {
      showActionToast("Terjadi kesalahan tidak terduga.", "error");
    } finally {
      setIsDeleting(false);
    }
  };


  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/encounters/${cancelTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "BATAL" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showActionToast(json.error ?? "Gagal membatalkan antrean.", "error");
        return;
      }
      setCancelTarget(null);
      await fetchAntrean();
      showActionToast("Antrean berhasil dibatalkan.", "success");
    } catch {
      showActionToast("Terjadi kesalahan tidak terduga.", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredData = antreanData.filter((item) => {
    const matchSearch =
      item.namaPasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noRm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noAntrean.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTanggal = (() => {
      if (!filterTanggal || filterTanggal === "semua") return true;
      const todayStr = new Date().toISOString().split("T")[0];
      if (filterTanggal === "hari-ini") return item.tanggal === todayStr;
      if (filterTanggal === "minggu-ini") {
        const now = new Date();
        const dow = (now.getDay() + 6) % 7; // Mon=0…Sun=6
        const mon = new Date(now); mon.setDate(now.getDate() - dow); mon.setHours(0, 0, 0, 0);
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        return item.tanggal >= mon.toISOString().split("T")[0] && item.tanggal <= sun.toISOString().split("T")[0];
      }
      if (filterTanggal === "bulan-ini") {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return item.tanggal >= from.toISOString().split("T")[0] && item.tanggal <= to.toISOString().split("T")[0];
      }
      if (filterTanggal === "tahun-ini") {
        const year = new Date().getFullYear();
        return item.tanggal >= `${year}-01-01` && item.tanggal <= `${year}-12-31`;
      }
      if (filterTanggal.includes("|")) {
        const [fromStr, toStr] = filterTanggal.split("|");
        return item.tanggal >= fromStr && item.tanggal <= toStr;
      }
      return item.tanggal === filterTanggal;
    })();
    const matchPrioritas = filterPrioritas ? item.prioritas  === filterPrioritas : true;
    const matchStatus    = filterStatus    ? item.status     === filterStatus    : true;

    return matchSearch && matchTanggal && matchPrioritas && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / LIMIT));
  const paginatedData = filteredData.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);

  return (
    <div className="grid grid-cols-12 gap-6" style={{ fontFamily: "var(--font-jakarta)" }}>
      <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-800 leading-tight"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Daftar Antrean dan Kunjungan
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Kelola informasi dan rekam medis pasien
          </p>
        </div>

        {isAuthorized && (
          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#2BB5A0" }}
            onClick={() => setIsAddEncounterOpen(true)}
          >
            <UserPlus size={15} strokeWidth={2} />
            + Tambah Kunjungan Baru
          </button>
        )}
      </div>

      <div className="col-span-12 bg-white rounded-3xl px-8 py-7">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-5 mb-7">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Cari Pasien
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" strokeWidth={2} />
              <input
                type="text"
                placeholder="Cari Nama, No.RM, atau No. Antrean…"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 placeholder-gray-300 outline-none focus:border-[#2BB5A0]"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Tanggal
            </label>
            <button
              ref={tanggalBtnRef}
              type="button"
              onClick={() => calendarOpen ? (setCalendarOpen(false), setCalendarPos(null)) : openCalendar()}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                filterTanggal !== "semua"
                  ? "border-[#2BB5A0] bg-[#E6F5F4] text-[#2BB5A0] font-semibold"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#2BB5A0]"
              }`}
            >
              <span className="truncate">{tanggalDisplayLabel(filterTanggal)}</span>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`ml-2 flex-shrink-0 transition-transform ${calendarOpen ? "rotate-180" : ""}`}
              />
            </button>
            {mounted && calendarOpen && calendarPos && createPortal(
              <div
                data-calendar-portal
                style={{
                  position: "fixed",
                  top: calendarPos.top,
                  left: calendarPos.left,
                  zIndex: 9999,
                  fontFamily: "var(--font-jakarta)",
                }}
              >
                <CalendarDateDropdown
                  value={filterTanggal}
                  onChange={(v) => {
                    setFilterTanggal(v);
                    setCurrentPage(1);
                    setCalendarOpen(false);
                    setCalendarPos(null);
                  }}
                  onClose={() => { setCalendarOpen(false); setCalendarPos(null); }}
                />
              </div>,
              document.body
            )}
          </div>

          <div className="w-48">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Prioritas
            </label>
            <select
              value={filterPrioritas}
              onChange={(e) => { setFilterPrioritas(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
            >
              <option value="">Semua</option>
              <option value="Stabil">Stabil</option>
              <option value="Cukup Berisiko">Cukup Berisiko</option>
              <option value="Berisiko">Berisiko</option>
              <option value="Berisiko Tinggi">Berisiko Tinggi</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
            >
              <option value="">Semua</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Diperiksa">Diperiksa</option>
              <option value="Selesai">Selesai</option>
              <option value="Batal">Batal</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  { label: "NO. ANTREAN",   width: "w-[10%]", align: "text-left"   },
                  { label: "PASIEN",        width: "w-[21%]", align: "text-left"   },
                  { label: "POLI & DOKTER", width: "w-[15%]", align: "text-left"   },
                  { label: "PRIORITAS",     width: "w-[11%]", align: "text-center"  },
                  { label: "STATUS",        width: "w-[12%]", align: "text-center"  },
                  ...((canAssess || isAuthorized) ? [{ label: "ASESMEN", width: "w-[23%]", align: "text-center" }] : []),
                  ...(isAuthorized ? [{ label: "ACTION", width: "w-[8%]",  align: "text-center" }] : []),
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`pb-3 px-2 text-xs font-semibold text-gray-400 tracking-widest ${col.width} ${col.align}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5 + ((canAssess || isAuthorized) ? 1 : 0) + (isAuthorized ? 1 : 0)} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Loader2 size={16} className="animate-spin" /> Memuat data…
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5 + ((canAssess || isAuthorized) ? 1 : 0) + (isAuthorized ? 1 : 0)} className="py-16 text-center">
                    <p className="text-sm text-gray-400">
                      Tidak ada antrean yang ditemukan.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors"
                  >
                    <td className="py-4 px-2 align-top">
                      <p className="text-base font-bold text-[#2BB5A0]" style={{ fontFamily: "var(--font-poppins)" }}>
                        {row.noAntrean}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{row.waktu}</p>
                    </td>

                    <td className="py-4 px-2 align-top">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{row.namaPasien}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {row.jenisKelamin} • {row.umur} tahun
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDob(row.tanggalLahir)}
                          </p>
                          <p className="text-xs font-bold text-[#2BB5A0] mt-0.5">{row.noRm}</p>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide border shrink-0 ${
                            row.jenisPasien === "UMUM"
                              ? "bg-green-50 text-[#2BB5A0] border-[#2BB5A0]"
                              : "bg-blue-50 text-blue-500 border-blue-500"
                          }`}
                        >
                          {row.jenisPasien}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-2 align-top">
                      <p className="text-sm font-bold text-gray-800">{row.poli}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{row.dokter}</p>
                    </td>

                    <td className="py-4 px-2 align-top text-center">
                      <span
                        className={`inline-block px-4 py-1 rounded-full text-xs font-bold border ${
                          PRIORITAS_BADGE[row.prioritas as Prioritas] ?? FALLBACK_BADGE
                        }`}
                      >
                        {row.prioritas}
                      </span>
                    </td>

                    <td className="py-4 px-2 align-top text-center">
                      <span
                        className={`inline-block px-4 py-1 rounded-full text-xs font-bold border ${
                          STATUS_BADGE[row.status as StatusAntrean] ?? FALLBACK_BADGE
                        }`}
                      >
                        {row.status}
                      </span>
                      {row.syncStatus === "FAILED_SYNC" && (
                        <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 border border-red-200">
                          ⚠ Gagal: Sinkronisasi SATUSEHAT
                        </span>
                      )}
                    </td>

                    {(canAssess || isAuthorized) && (
                      <td className="py-4 px-2 align-top">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {canAssess && (
                            row.status === "Selesai" ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/rawat-jalan/${row.id}/asesmen`)}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#3B82F6] hover:bg-blue-600 text-white transition-colors cursor-pointer"
                                style={{ fontFamily: "var(--font-poppins)" }}
                              >
                                {userRole === "ADMIN" ? "Edit Asesmen" : "Lihat Asesmen"}
                              </button>
                            ) : (row.status === "Menunggu" || row.status === "Diperiksa") ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/rawat-jalan/${row.id}/asesmen`)}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
                                style={{ fontFamily: "var(--font-poppins)" }}
                              >
                                {row.status === "Diperiksa" ? "Edit Asesmen" : "Mulai Asesmen"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )
                          )}
                          {(userRole === "ADMIN"
                            ? row.status !== "Batal"
                            : userRole === "PENDAFTARAN"
                            ? row.status === "Menunggu" || row.status === "Diperiksa"
                            : false) && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget({ id: row.id, noAntrean: row.noAntrean, namaPasien: row.namaPasien })}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#AE0000] hover:bg-[#A00909] text-white transition-colors cursor-pointer"
                              style={{ fontFamily: "var(--font-poppins)" }}
                              title="Batalkan antrean"
                            >
                              Batalkan
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {isAuthorized && (
                      <td className="py-4 px-2 align-top">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditEncounterId(row.id)}
                            className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors cursor-pointer"
                            title="Edit kunjungan"
                          >
                            <Pencil size={15} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => (userRole === "ADMIN" || row.status === "Menunggu") && setDeleteTarget({ id: row.id, namaPasien: row.namaPasien })}
                            disabled={userRole !== "ADMIN" && row.status !== "Menunggu"}
                            title={userRole !== "ADMIN" && row.status !== "Menunggu" ? "Hanya antrean Menunggu yang dapat dihapus" : "Hapus antrean"}
                            className={`p-2 rounded-lg transition-colors ${
                              userRole === "ADMIN" || row.status === "Menunggu"
                                ? "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
                                : "bg-gray-50 text-gray-200 cursor-not-allowed"
                            }`}
                          >
                            <Trash2 size={15} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-8">
            <button
              type="button"
              disabled={currentPage === 1 || isLoading}
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
                  disabled={isLoading}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                    p === currentPage ? "text-white" : "text-gray-500 hover:bg-gray-50"
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
              disabled={currentPage === totalPages || isLoading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Selanjutnya
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <p
          className="text-center text-xs text-gray-300 mt-4"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {isLoading
            ? "Memuat data…"
            : `Menampilkan ${paginatedData.length} dari ${filteredData.length} antrean`}
        </p>
      </div>

      <EncounterRegistrationDrawer
        isOpen={isAddEncounterOpen}
        onClose={() => setIsAddEncounterOpen(false)}
        onEncounterCreated={fetchAntrean}
      />

      <EncounterEditDrawer
        encounterId={editEncounterId}
        isOpen={!!editEncounterId}
        onClose={() => setEditEncounterId(null)}
        onUpdated={fetchAntrean}
      />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={isDeleting ? undefined : () => setDeleteTarget(null)} />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" strokeWidth={2} />
              </div>
              <h3
                className="text-base font-bold text-gray-800 text-center mb-1"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Hapus Antrean?
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Antrean <span className="font-semibold text-gray-700">{deleteTarget.namaPasien}</span> akan dihapus secara permanen dan tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <><Loader2 size={14} className="animate-spin" /> Menghapus…</>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={isCancelling ? undefined : () => setCancelTarget(null)} />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mx-auto mb-4">
                <Trash2 size={22} className="text-orange-500" strokeWidth={2} />
              </div>
              <h3
                className="text-base font-bold text-gray-800 text-center mb-1"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Batalkan Antrean?
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Antrean <span className="font-semibold text-gray-700">{cancelTarget.noAntrean}</span> atas nama{" "}
                <span className="font-semibold text-gray-700">{cancelTarget.namaPasien}</span> akan dibatalkan. Tindakan ini tidak dapat diurungkan.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <><Loader2 size={14} className="animate-spin" /> Membatalkan…</>
                  ) : (
                    "Ya, Batalkan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action toast */}
      {actionToast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-white rounded-2xl shadow-lg px-5 py-3.5 border ${
            actionToast.type === "error" ? "border-red-200" : "border-green-200"
          }`}
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {actionToast.type === "error" ? (
            <span className="text-red-500 text-sm font-medium">{actionToast.message}</span>
          ) : (
            <span className="text-green-600 text-sm font-medium">{actionToast.message}</span>
          )}
        </div>
      )}
    </div>
  );
}
