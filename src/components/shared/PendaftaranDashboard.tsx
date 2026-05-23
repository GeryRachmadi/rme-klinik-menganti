import Link from "next/link";
import {
  Users,
  Ticket,
  UserPlus,
  ClipboardPlus,
  Stethoscope,
} from "lucide-react";
import type { Prisma } from "@/generated/prisma";

type EncounterWithPatient = Prisma.EncounterGetPayload<{
  include: { patient: { select: { namaLengkap: true } } };
}>;

type PractitionerItem = {
  id: string;
  name: string;
  speciality: string | null;
};

interface PendaftaranDashboardProps {
  name: string;
  totalEncountersToday: number;
  sisaAntrean: number;
  encounters: EncounterWithPatient[];
  practitioners: PractitionerItem[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getGreeting(): string {
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

function getPoliLabel(queueNumber: string): string {
  const prefix = queueNumber.charAt(0).toUpperCase();
  if (prefix === "U") return "Poli Umum";
  if (prefix === "G") return "Poli Gigi";
  return "-";
}

const encounterStatusConfig: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  MENUNGGU: {
    label: "Menunggu",
    bgClass: "bg-orange-50",
    textClass: "text-orange-500",
  },
  DIPERIKSA: {
    label: "Diperiksa",
    bgClass: "bg-teal-50",
    textClass: "text-teal-600",
  },
  SELESAI: {
    label: "Selesai",
    bgClass: "bg-gray-100",
    textClass: "text-gray-500",
  },
};

const jadwalStatusConfig: Record<
  string,
  { label: string; borderColor: string; textColor: string }
> = {
  TERSEDIA: {
    label: "Tersedia",
    borderColor: "#2BB5A0",
    textColor: "#2BB5A0",
  },
  ISTIRAHAT: {
    label: "Istirahat",
    borderColor: "#F97316",
    textColor: "#F97316",
  },
  BERHALANGAN: {
    label: "Berhalangan",
    borderColor: "#EF4444",
    textColor: "#EF4444",
  },
};

export default function PendaftaranDashboard({
  name,
  totalEncountersToday,
  sisaAntrean,
  encounters,
  practitioners,
}: PendaftaranDashboardProps) {
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
            DASHBOARD PENDAFTARAN
          </p>
          <h1
            className="text-4xl font-bold mb-3 leading-tight"
            style={{ fontFamily: "var(--font-poppins)", color: "#DA567B" }}
          >
            {greeting}, {name}!
          </h1>
          <p
            className="text-gray-500 text-sm"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Selamat bertugas! Saat ini terdapat{" "}
            <span className="font-semibold text-gray-700">{sisaAntrean}</span>{" "}
            antrean aktif hari ini.
          </p>
        </div>
        <div
          className="flex-shrink-0 opacity-20 select-none"
          style={{ color: "#2BB5A0" }}
        >
          <Stethoscope size={140} strokeWidth={2} />
        </div>
      </div>

      {/* ── Row 2: KPI + Action Cards ── */}

      {/* Card 1 – Total Kunjungan Hari Ini */}
      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Users size={22} className="text-blue-400" strokeWidth={2} />
        </div>
        <div>
          <p
            className="text-xs text-gray-400 mb-1 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Total Kunjungan Hari Ini
          </p>
          <p
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {totalEncountersToday}
          </p>
        </div>
      </div>

      {/* Card 2 – Sisa Antrean */}
      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#F0FDF9" }}
        >
          <Ticket size={22} strokeWidth={2} style={{ color: "#2BB5A0" }} />
        </div>
        <div>
          <p
            className="text-xs text-gray-400 mb-1 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Sisa Antrean
          </p>
          <p
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {sisaAntrean}
          </p>
        </div>
      </div>

      {/* Card 3 – Action: Tambah Pasien */}
      <Link
        href="/rekam-medis"
        className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#FAF5FF" }}
        >
          <UserPlus size={22} strokeWidth={2} style={{ color: "#A855F7" }} />
        </div>
        <div>
          <p
            className="text-sm font-bold text-gray-800 leading-snug"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Tambah Pasien
          </p>
          <p
            className="text-xs text-gray-400 mt-0.5"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Tambahkan pasien baru
          </p>
        </div>
      </Link>

      {/* Card 4 – Action: Kunjungan */}
      <Link
        href="/rawat-jalan"
        className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <ClipboardPlus
            size={22}
            strokeWidth={2}
            className="text-orange-400"
          />
        </div>
        <div>
          <p
            className="text-sm font-bold text-gray-800 leading-snug"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Kunjungan
          </p>
          <p
            className="text-xs text-gray-400 mt-0.5"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Daftarkan pasien ke antrean
          </p>
        </div>
      </Link>

      {/* ── Row 3 Left: Tabel Antrean ── */}
      <div className="col-span-8 bg-white rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-[#2BB5A0]" />
            <h2
              className="text-sm font-bold text-gray-800 tracking-widest"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              ANTREAN RAWAT JALAN AKTIF
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-1.5 rounded-full border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Filter
            </button>
            <Link
              href="/rawat-jalan"
              className="px-4 py-1.5 rounded-full text-sm text-white transition-colors hover:opacity-90"
              style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
            >
              Selengkapnya
            </Link>
          </div>
        </div>

        {encounters.length === 0 ? (
          <div
            className="text-center py-16 text-gray-300 text-sm"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Belum ada antrean hari ini.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                {["NO.ANTREAN", "WAKTU", "NAMA", "POLI TUJUAN", "STATUS"].map(
                  (col) => (
                    <th
                      key={col}
                      className="pb-3 text-xs font-semibold text-gray-400 tracking-wider"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {encounters.map((enc) => {
                const statusCfg =
                  encounterStatusConfig[enc.status] ??
                  encounterStatusConfig["MENUNGGU"];
                return (
                  <tr
                    key={enc.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td
                      className="py-3 text-sm font-bold"
                      style={{
                        fontFamily: "var(--font-poppins)",
                        color: "#2BB5A0",
                      }}
                    >
                      {enc.queueNumber}
                    </td>
                    <td
                      className="py-3 text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {formatWIB(enc.periodStart)}
                    </td>
                    <td
                      className="py-3 text-sm text-gray-700"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {enc.patient.namaLengkap}
                    </td>
                    <td
                      className="py-3 text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {getPoliLabel(enc.queueNumber ?? "")}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bgClass} ${statusCfg.textClass}`}
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Row 3 Right: Jadwal Bertugas ── */}
      <div className="col-span-4 bg-white rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-5 rounded-full bg-[#2BB5A0]" />
          <h2
            className="text-sm font-bold text-gray-800 tracking-widest"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            JADWAL BERTUGAS
          </h2>
        </div>

        {practitioners.length === 0 ? (
          <div
            className="text-center py-10 text-gray-300 text-sm"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Tidak ada dokter bertugas hari ini.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {practitioners.map((prac) => {
              // Default status — no schedule model yet in schema
              const statusKey = "TERSEDIA";
              const statusCfg = jadwalStatusConfig[statusKey];
              const initials = getInitials(prac.name);
              const poliLabel = prac.speciality ?? "Umum";

              return (
                <div
                  key={prac.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-gray-100"
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #4DD9C0 0%, #2BB5A0 100%)",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold text-gray-800 truncate leading-snug"
                      style={{ fontFamily: "var(--font-poppins)" }}
                    >
                      {prac.name}
                    </p>
                    <p
                      className="text-xs text-gray-400 truncate"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      Dokter &bull; Poli {poliLabel}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                    style={{
                      borderColor: statusCfg.borderColor,
                      color: statusCfg.textColor,
                      fontFamily: "var(--font-jakarta)",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: statusCfg.borderColor }}
                    />
                    {statusCfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
