import Link from "next/link";
import { Users, UserPlus, Database, Wifi, Stethoscope } from "lucide-react";
import type { Prisma } from "@/generated/prisma";

type ActivityLogEntry = Prisma.ActivityLogGetPayload<{
  include: {
    account: {
      select: {
        role: true;
        username: true;
        practitioner: { select: { name: true } };
      };
    };
  };
}>;

interface AdminDashboardProps {
  name: string;
  totalAccounts: number;
  totalPatients: number;
  activityLogs: ActivityLogEntry[];
}

function getGreeting(): string {
  // UTC+7 (WIB – Waktu Indonesia Barat)
  const hour = (new Date().getUTCHours() + 7) % 24;
  if (hour >= 5 && hour < 12) return "Selamat Pagi";
  if (hour >= 12 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function formatWIB(date: Date): string {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  PENDAFTARAN: "Pendaftaran",
  PERAWAT: "Perawat",
  DOKTER: "Dokter",
};

export default function AdminDashboard({
  name,
  totalAccounts,
  totalPatients,
  activityLogs,
}: AdminDashboardProps) {
  const greeting = getGreeting();

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* ── Row 1: Welcome Card ── */}
      <div className="col-span-12 bg-white rounded-3xl px-10 py-8 flex items-center justify-between overflow-hidden">
        <div>
          <p
            className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            DASHBOARD ADMIN
          </p>
          <h1
            className="text-4xl font-bold mb-3 leading-tight"
            style={{ fontFamily: "var(--font-poppins)", color: "#F97168" }}
          >
            {greeting}, {name}!
          </h1>
          <p
            className="text-gray-500 text-sm"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Selamat Bertugas! Apa yang ingin anda lakukan saat ini?
          </p>
        </div>
        <div className="flex-shrink-0 opacity-20 select-none" style={{ color: "#2BB5A0" }}>
          <Stethoscope size={140} strokeWidth={0.75} />
        </div>
      </div>

      {/* ── Row 2: KPI Cards ── */}

      {/* Card 1 – Total Pengguna */}
      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Users size={22} className="text-blue-400" strokeWidth={2} />
        </div>
        <div>
          <p
            className="text-xs text-gray-400 mb-1 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Total Pengguna Saat Ini
          </p>
          <p
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {totalAccounts}
          </p>
        </div>
      </div>

      {/* Card 2 – Tambah Pengguna (action) */}
      <Link
        href="/manajemen-pengguna"
        className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#ECFDF5" }}
        >
          <UserPlus size={22} strokeWidth={2} style={{ color: "#10B981" }} />
        </div>
        <div>
          <p
            className="text-sm font-bold text-gray-800 leading-snug"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Tambah Pengguna
          </p>
          <p
            className="text-xs text-gray-400 mt-0.5"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Tambahkan pengguna baru
          </p>
        </div>
      </Link>

      {/* Card 3 – Total Pasien */}
      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
          <Database size={22} className="text-purple-400" strokeWidth={2} />
        </div>
        <div>
          <p
            className="text-xs text-gray-400 mb-1 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Total Pasien Terdaftar
          </p>
          <p
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {totalPatients}
          </p>
        </div>
      </div>

      {/* Card 4 – Status SATUSEHAT */}
      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <Wifi size={22} className="text-orange-400" strokeWidth={2} />
        </div>
        <div>
          <p
            className="text-xs text-gray-400 mb-1 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Status SATUSEHAT
          </p>
          <p
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-poppins)", color: "#2BB5A0" }}
          >
            TERHUBUNG
          </p>
        </div>
      </div>

      {/* ── Row 3 Left: Log Aktivitas ── */}
      <div className="col-span-8 bg-white rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-[#2BB5A0]" />
            <h2
              className="text-sm font-bold text-gray-800 tracking-widest"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              LOG AKTIVITAS TERBARU
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-1.5 rounded-full border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Filter
            </button>
            <button
              className="px-4 py-1.5 rounded-full text-sm text-white transition-colors hover:opacity-90"
              style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
            >
              Selengkapnya
            </button>
          </div>
        </div>

        {activityLogs.length === 0 ? (
          <div
            className="text-center py-16 text-gray-300 text-sm"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Belum ada log aktivitas.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th
                  className="pb-3 text-xs font-semibold text-gray-400 tracking-wider"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  WAKTU
                </th>
                <th
                  className="pb-3 text-xs font-semibold text-gray-400 tracking-wider"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  NAMA
                </th>
                <th
                  className="pb-3 text-xs font-semibold text-gray-400 tracking-wider"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  ROLE
                </th>
                <th
                  className="pb-3 text-xs font-semibold text-gray-400 tracking-wider"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  AKTIVITAS
                </th>
                <th
                  className="pb-3 text-xs font-semibold text-gray-400 tracking-wider"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log) => {
                const actorName =
                  log.account.practitioner?.name ?? log.account.username;
                const roleLabel =
                  roleLabels[log.account.role] ?? log.account.role;
                const isSuccess =
                  log.status.toUpperCase() === "SUCCESS";

                return (
                  <tr key={log.id} className="border-b border-gray-50 last:border-0">
                    <td
                      className="py-3 text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {formatWIB(log.createdAt)}
                    </td>
                    <td
                      className="py-3 text-sm text-gray-700"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {actorName}
                    </td>
                    <td
                      className="py-3 text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {roleLabel}
                    </td>
                    <td
                      className="py-3 text-sm text-gray-700"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {log.action}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          isSuccess
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-500"
                        }`}
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {isSuccess ? "Success" : "Failed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Row 3 Right: Kesehatan Sistem ── */}
      <div className="col-span-4 bg-white rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-5 rounded-full bg-[#2BB5A0]" />
          <h2
            className="text-sm font-bold text-gray-800 tracking-widest"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            KESEHATAN SISTEM
          </h2>
        </div>

        <div className="space-y-5">
          {/* Database Status */}
          <div className="flex items-center justify-between">
            <span
              className="text-sm font-semibold text-gray-700"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Database Status
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                color: "#2BB5A0",
                borderColor: "#2BB5A0",
                fontFamily: "var(--font-jakarta)",
              }}
            >
              Online
            </span>
          </div>

          {/* SATUSEHAT API Status */}
          <div className="flex items-center justify-between">
            <span
              className="text-sm font-semibold text-gray-700"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              SATUSEHAT API Status
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                color: "#2BB5A0",
                borderColor: "#2BB5A0",
                fontFamily: "var(--font-jakarta)",
              }}
            >
              Terhubung
            </span>
          </div>

          {/* Kapasitas Server */}
          <div>
            <span
              className="text-sm font-semibold text-gray-700 block mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Kapasitas Server
            </span>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-400"
                style={{ width: "50%" }}
              />
            </div>
            <p
              className="text-xs text-gray-400 mt-1.5"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Terpakai 250GB dari 500GB
            </p>
          </div>

          {/* Info sistem */}
          <div className="border-t border-gray-100 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span
                className="text-xs text-gray-500"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Versi Sistem:
              </span>
              <span
                className="text-xs text-gray-500"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                v1.0.0 (Next.JS/PG)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-xs text-gray-500"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Pencadangan:
              </span>
              <span
                className="text-xs text-gray-500"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Hari ini, 02:30 WIB
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
