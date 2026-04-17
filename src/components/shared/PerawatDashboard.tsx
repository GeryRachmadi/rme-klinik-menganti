import Link from "next/link";
import {
  Users,
  ClipboardCheck,
  UserSearch,
  MapPin,
  Stethoscope,
  CheckCircle,
} from "lucide-react";
import type { Prisma } from "@/generated/prisma";

type EncounterWithPatientDetail = Prisma.EncounterGetPayload<{
  include: {
    patient: { select: { name: true; gender: true; birthdate: true } };
  };
}>;

type EncounterSelesaiItem = Prisma.EncounterGetPayload<{
  include: {
    patient: { select: { name: true } };
  };
}>;

type PractitionerItem = {
  id: string;
  name: string;
  speciality: string | null;
};

interface PerawatDashboardProps {
  name: string;
  antreanMenunggu: number;
  selesaiAsesmen: number;
  ruangPenugasan: string;
  encounters: EncounterWithPatientDetail[];
  partnerDokter: PractitionerItem[];
  selesaiList: EncounterSelesaiItem[];
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

function calcAge(birthdate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const m = now.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthdate.getDate())) age--;
  return age;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getPoliLabel(queueNumber: string): string {
  const prefix = queueNumber.charAt(0).toUpperCase();
  if (prefix === "U") return "Poli Umum";
  if (prefix === "G") return "Poli Gigi";
  return "-";
}

const AVATAR_COLORS = [
  { bg: "#EFF6FF", color: "#3B82F6" },
  { bg: "#F0FDF4", color: "#22C55E" },
  { bg: "#FFF7ED", color: "#F97316" },
  { bg: "#FAF5FF", color: "#A855F7" },
  { bg: "#FFF1F2", color: "#F43F5E" },
  { bg: "#F0FDFA", color: "#14B8A6" },
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const genderLabel: Record<string, string> = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
};

const encounterStatusConfig: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  MENUNGGU: {
    label: "Menunggu Asesmen",
    bgClass: "bg-orange-50",
    textClass: "text-orange-500",
  },
  DIPERIKSA: {
    label: "Siap Diperiksa",
    bgClass: "bg-teal-50",
    textClass: "text-teal-600",
  },
  SELESAI: {
    label: "Selesai",
    bgClass: "bg-gray-100",
    textClass: "text-gray-500",
  },
};

export default function PerawatDashboard({
  name,
  antreanMenunggu,
  selesaiAsesmen,
  ruangPenugasan,
  encounters,
  partnerDokter,
  selesaiList,
}: PerawatDashboardProps) {
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
            DASHBOARD PERAWAT
          </p>
          <h1
            className="text-4xl font-bold mb-3 leading-tight"
            style={{ fontFamily: "var(--font-poppins)", color: "#DA567B" }}
          >
            {greeting}, {name}!
          </h1>
          <p
            className="text-gray-500 text-sm truncate"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Selamat bertugas! Silakan pilih pasien dari daftar antrean di bawah untuk memulai sesi pemeriksaan.
          </p>
        </div>
        <div
          className="flex-shrink-0 opacity-20 select-none"
          style={{ color: "#2BB5A0" }}
        >
          <Stethoscope size={140} strokeWidth={0.75} />
        </div>
      </div>

      {/* ── Row 2: KPI + Action Cards ── */}

      {/* Card 1 – Antrean Menunggu */}
      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Users size={22} className="text-blue-400" strokeWidth={2} />
        </div>
        <div>
          <p
            className="text-xs text-gray-400 mb-1 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Antrean Menunggu
          </p>
          <p
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {antreanMenunggu}
          </p>
        </div>
      </div>

      {/* Card 2 – Selesai Asesmen */}
      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#F0FDF9" }}
        >
          <ClipboardCheck
            size={22}
            strokeWidth={2}
            style={{ color: "#2BB5A0" }}
          />
        </div>
        <div>
          <p
            className="text-xs text-gray-400 mb-1 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Selesai Asesmen
          </p>
          <p
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {selesaiAsesmen}
          </p>
        </div>
      </div>

      {/* Card 3 – Action: Cari Data Pasien */}
      <Link
        href="/rekam-medis"
        className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#FAF5FF" }}
        >
          <UserSearch size={22} strokeWidth={2} style={{ color: "#A855F7" }} />
        </div>
        <div>
          <p
            className="text-sm font-bold text-gray-800 leading-snug"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Cari Data Pasien
          </p>
          <p
            className="text-xs text-gray-400 mt-0.5"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Cari informasi pasien
          </p>
        </div>
      </Link>

      {/* Card 4 – Info: Ruang Penugasan */}
      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#FFF7ED" }}
        >
          <MapPin size={22} strokeWidth={2} style={{ color: "#F97316" }} />
        </div>
        <div>
          <p
            className="text-xs text-gray-400 mb-1 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Ruang Penugasan
          </p>
          <p
            className="text-sm font-bold uppercase"
            style={{ fontFamily: "var(--font-poppins)", color: "#2BB5A0" }}
          >
            Poli {ruangPenugasan}
          </p>
        </div>
      </div>

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
              className="px-4 py-1.5 rounded-full border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Filter
            </button>
            <Link
              href="/rawat-jalan"
              className="px-4 py-1.5 rounded-full text-sm text-white transition-colors hover:opacity-90"
              style={{
                background: "#2BB5A0",
                fontFamily: "var(--font-jakarta)",
              }}
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
            Belum ada antrean aktif hari ini.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                {["NO.ANTREAN", "WAKTU", "NAMA", "STATUS", "ACTION"].map(
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
                const age = calcAge(enc.patient.birthdate);
                const gender = genderLabel[enc.patient.gender] ?? enc.patient.gender;

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
                    <td className="py-3">
                      <p
                        className="text-sm font-semibold text-gray-800 leading-snug"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {enc.patient.name}
                      </p>
                      <p
                        className="text-xs text-gray-400 mt-0.5"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {gender} &bull; {age} tahun
                      </p>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bgClass} ${statusCfg.textClass}`}
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/asesmen/${enc.id}`}
                        className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                        style={{
                          background: "#2BB5A0",
                          fontFamily: "var(--font-jakarta)",
                        }}
                      >
                        Asesmen
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Row 3 Right: Partner Dokter + Baru Saja Selesai ── */}
      <div className="col-span-4 bg-white rounded-3xl p-6 flex flex-col gap-5">

        {/* Partner Dokter Header */}
        <div>
          <h2
            className="text-base font-bold text-gray-800 leading-tight"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Partner Dokter
          </h2>
          <p
            className="text-xs font-semibold text-gray-400 tracking-widest uppercase mt-0.5"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Dokter Jaga Hari Ini
          </p>
        </div>

        {/* Doctor List */}
        <div className="flex flex-col gap-3">
          {partnerDokter.length === 0 ? (
            <p
              className="text-sm text-gray-300 text-center py-4"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Tidak ada dokter bertugas hari ini.
            </p>
          ) : (
            partnerDokter.map((doc) => {
              const initials = getInitials(doc.name);
              return (
                <div
                  key={doc.id}
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
                      {doc.name}
                    </p>
                    <p
                      className="text-xs text-gray-400 truncate"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      Dokter &bull; Poli {doc.speciality ?? "Umum"}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                    style={{
                      borderColor: "#2BB5A0",
                      color: "#2BB5A0",
                      fontFamily: "var(--font-jakarta)",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "#2BB5A0" }}
                    />
                    Praktik
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Divider + Baru Saja Selesai */}
        <div className="border-t border-gray-100 pt-4">
          <p
            className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Baru Saja Selesai Diasesmen
          </p>

          {selesaiList.length === 0 ? (
            <p
              className="text-sm text-gray-300 text-center py-4"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Belum ada asesmen selesai hari ini.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {selesaiList.map((enc) => {
                const initials = getInitials(enc.patient.name);
                const { bg, color } = getAvatarColor(enc.patient.name);
                const selesaiTime = formatWIB(enc.periodEnd ?? enc.updatedAt);
                const poli = getPoliLabel(enc.queueNumber);

                return (
                  <div key={enc.id} className="flex items-center gap-3 py-1">
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: bg,
                        color,
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold text-gray-800 truncate leading-snug"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {enc.patient.name}
                      </p>
                      <p
                        className="text-xs text-gray-400 truncate"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {enc.queueNumber} &bull; {poli}
                      </p>
                    </div>

                    {/* Selesai time */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <CheckCircle
                        size={12}
                        style={{ color: "#2BB5A0" }}
                        strokeWidth={2.5}
                      />
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: "#2BB5A0",
                          fontFamily: "var(--font-jakarta)",
                        }}
                      >
                        Selesai {selesaiTime}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
