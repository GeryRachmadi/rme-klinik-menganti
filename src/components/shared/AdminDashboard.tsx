import Link from "next/link";
import { Users, UserPlus, Database, Wifi, Stethoscope } from "lucide-react";
import ActivityLogTable, { type ActivityLogEntry } from "./ActivityLogTable";

interface AdminDashboardProps {
  name: string;
  totalAccounts: number;
  totalPatients: number;
  activityLogs: ActivityLogEntry[];
  activityLogTotal: number;
  failedSyncs: number;
  satusehatMockMode: boolean;
}

function getGreeting(): string {
  const hour = (new Date().getUTCHours() + 7) % 24;
  if (hour >= 5 && hour < 12) return "Selamat Pagi";
  if (hour >= 12 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export default function AdminDashboard({
  name,
  totalAccounts,
  totalPatients,
  activityLogs,
  activityLogTotal,
  failedSyncs,
  satusehatMockMode,
}: AdminDashboardProps) {
  const greeting = getGreeting();

  const satusehatCard = satusehatMockMode
    ? { bg: "#FFFBEB", iconColor: "#F59E0B", label: "MODE SIMULASI", color: "#F59E0B" }
    : failedSyncs > 0
    ? { bg: "#FEF2F2", iconColor: "#EF4444", label: `${failedSyncs} GAGAL SINKRONISASI`, color: "#EF4444" }
    : { bg: "#ECFDF5", iconColor: "#10B981", label: "TERSAMBUNG", color: "#10B981" };

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* ── Row 1: Welcome Card ── */}
      <div className="col-span-12 bg-[#009E95] rounded-3xl px-10 py-8 flex items-center justify-between overflow-hidden">
        <div>
          <p
            className="text-xs font-bold tracking-widest text-white uppercase mb-3"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            DASHBOARD ADMIN
          </p>
          <h1
            className="text-4xl font-bold mb-3 leading-tight text-white"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {greeting}, {name}!
          </h1>
          <p
            className="text-white text-sm"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Selamat Bertugas! Apa yang ingin anda lakukan saat ini?
          </p>
        </div>
        <div className="flex-shrink-0 opacity-20 select-none text-white">
          <Stethoscope size={140} strokeWidth={2} />
        </div>
      </div>

      {/* ── Row 2: KPI Cards ── */}

      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Users size={22} className="text-blue-400" strokeWidth={2} />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1 leading-snug" style={{ fontFamily: "var(--font-jakarta)" }}>
            Total Pengguna Saat Ini
          </p>
          <p className="text-2xl font-bold text-gray-800" style={{ fontFamily: "var(--font-poppins)" }}>
            {totalAccounts}
          </p>
        </div>
      </div>

      <Link
        href="/manajemen-pengguna"
        className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#ECFDF5" }}>
          <UserPlus size={22} strokeWidth={2} style={{ color: "#10B981" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 leading-snug" style={{ fontFamily: "var(--font-poppins)" }}>
            Tambah Pengguna
          </p>
          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
            Tambahkan pengguna baru
          </p>
        </div>
      </Link>

      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
          <Database size={22} className="text-purple-400" strokeWidth={2} />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1 leading-snug" style={{ fontFamily: "var(--font-jakarta)" }}>
            Total Pasien Terdaftar
          </p>
          <p className="text-2xl font-bold text-gray-800" style={{ fontFamily: "var(--font-poppins)" }}>
            {totalPatients}
          </p>
        </div>
      </div>

      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: satusehatCard.bg }}>
          <Wifi size={22} strokeWidth={2} style={{ color: satusehatCard.iconColor }} />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1 leading-snug" style={{ fontFamily: "var(--font-jakarta)" }}>
            Status SATUSEHAT
          </p>
          <p className="text-sm font-bold" style={{ fontFamily: "var(--font-poppins)", color: satusehatCard.color }}>
            {satusehatCard.label}
          </p>
        </div>
      </div>

      {/* ── Row 3 Left: Log Aktivitas ── */}
      <div className="col-span-8">
        <ActivityLogTable logs={activityLogs} total={activityLogTotal} />
      </div>

      {/* ── Row 3 Right: Kesehatan Sistem ── */}
      <div className="col-span-4 bg-white rounded-3xl p-6">
        <div className="flex items-center gap-3 bg-[#009E95] -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-3xl">
          <div className="w-1 h-5 rounded-full bg-transparent" />
          <h2
            className="text-sm font-semibold text-white tracking-widest"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            KESEHATAN SISTEM
          </h2>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: "var(--font-jakarta)" }}>
              Database Status
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ color: "#2BB5A0", borderColor: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
            >
              Online
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: "var(--font-jakarta)" }}>
              SATUSEHAT API Status
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                color: satusehatMockMode ? "#F59E0B" : failedSyncs === 0 ? "#2BB5A0" : "#EF4444",
                borderColor: satusehatMockMode ? "#F59E0B" : failedSyncs === 0 ? "#2BB5A0" : "#EF4444",
                fontFamily: "var(--font-jakarta)",
              }}
            >
              {satusehatMockMode ? "Simulasi" : failedSyncs === 0 ? "Sehat" : `${failedSyncs} Gagal`}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-jakarta)" }}>
                Versi Sistem:
              </span>
              <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-jakarta)" }}>
                v1.0.0 (Next.JS/PG)
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
