import Link from "next/link";
import {
  Users,
  ClipboardCheck,
  BookOpen,
  CalendarClock,
  Stethoscope,
  CheckCircle,
} from "lucide-react";
import type { Prisma } from "@/generated/prisma";
import DashboardQueueTable, { type QueueEncounterItem } from "@/components/shared/DashboardQueueTable";

type EncounterForDokter = Prisma.EncounterGetPayload<{
  include: {
    patient: { select: { namaLengkap: true; jenisKelamin: true; tanggalLahir: true } };
  };
}>;

type RiwayatItem = Prisma.EncounterGetPayload<{
  include: {
    patient: { select: { namaLengkap: true } };
    conditionDiagnoses: { select: { codeIcd10: true; display: true } };
  };
}>;

interface DokterDashboardProps {
  name: string;
  antreanMenunggu: number;
  selesaiDiperiksa: number;
  jadwalPraktik: string;
  encounters: EncounterForDokter[];
  riwayatPemeriksaan: RiwayatItem[];
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

function formatDateWIB(): string {
  const MONTHS = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER",
  ];
  const d = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `HARI INI, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
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

export default function DokterDashboard({
  name,
  antreanMenunggu,
  selesaiDiperiksa,
  jadwalPraktik,
  encounters,
  riwayatPemeriksaan,
}: DokterDashboardProps) {
  const greeting = getGreeting();
  const todayLabel = formatDateWIB();

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* ── Row 1: Welcome Card ── */}
      <div className="col-span-12 bg-white rounded-3xl px-10 py-8 flex items-center justify-between overflow-hidden">
        <div>
          <p
            className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            DASHBOARD DOKTER
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
            Selamat bertugas! Silakan pilih pasien dari daftar antrean di bawah dan lengkapi diagnosa rekam medis untuk hari ini.
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

      {/* Card 2 – Selesai Diperiksa */}
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
            Selesai Diperiksa
          </p>
          <p
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {selesaiDiperiksa}
          </p>
        </div>
      </div>

      {/* Card 3 – Action: Arsip Rekam Medis */}
      <Link
        href="/rekam-medis"
        className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#FAF5FF" }}
        >
          <BookOpen size={22} strokeWidth={2} style={{ color: "#A855F7" }} />
        </div>
        <div>
          <p
            className="text-sm font-bold text-gray-800 leading-snug"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Arsip Rekam Medis
          </p>
          <p
            className="text-xs text-gray-400 mt-0.5"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Lihat riwayat rekam medis
          </p>
        </div>
      </Link>

      {/* Card 4 – Info: Jadwal Praktik */}
      <div className="col-span-3 bg-white rounded-3xl p-6 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#FFF7ED" }}
        >
          <CalendarClock
            size={22}
            strokeWidth={2}
            style={{ color: "#F97316" }}
          />
        </div>
        <div>
          <p
            className="text-xs text-gray-400 mb-1 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Jadwal Praktik
          </p>
          <p
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-poppins)", color: "#2BB5A0" }}
          >
            {jadwalPraktik}
          </p>
        </div>
      </div>

      {/* ── Row 3 Left: Tabel Pemeriksaan Pasien ── */}
      <DashboardQueueTable
        title="DAFTAR PEMERIKSAAN PASIEN"
        encounters={encounters as QueueEncounterItem[]}
        variant="dokter"
        emptyMessage="Belum ada pasien terdaftar hari ini."
      />

      {/* ── Row 3 Right: Riwayat Pemeriksaan ── */}
      <div className="col-span-4 bg-white rounded-3xl p-6 flex flex-col">

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-1 h-5 rounded-full bg-[#2BB5A0] flex-shrink-0 mt-0.5" />
          <div>
            <h2
              className="text-sm font-bold text-gray-800 tracking-widest leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              RIWAYAT PEMERIKSAAN
            </h2>
            <p
              className="text-xs font-semibold text-gray-400 tracking-widest uppercase mt-0.5"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {todayLabel}
            </p>
          </div>
        </div>

        {/* List */}
        {riwayatPemeriksaan.length === 0 ? (
          <div
            className="flex-1 flex items-center justify-center text-gray-300 text-sm text-center py-10"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Belum ada pemeriksaan selesai hari ini.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {riwayatPemeriksaan.map((enc) => {
              const initials = getInitials(enc.patient.namaLengkap);
              const { bg, color } = getAvatarColor(enc.patient.namaLengkap);
              const selesaiTime = formatWIB(enc.periodEnd ?? enc.updatedAt);
              const diagnosis = enc.conditionDiagnoses[0];

              return (
                <div key={enc.id} className="flex items-start gap-3 py-3">
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
                      {enc.patient.namaLengkap}
                    </p>
                    <p
                      className="text-xs text-gray-400 truncate mt-0.5"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {diagnosis
                        ? `${diagnosis.codeIcd10} - ${diagnosis.display}`
                        : "Diagnosa belum dicatat"}
                    </p>
                  </div>

                  {/* Time + Tinjau */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <CheckCircle
                        size={11}
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
                    <Link
                      href={`/rawat-jalan/${enc.id}/asesmen`}
                      className="text-xs font-semibold hover:underline"
                      style={{
                        color: "#2BB5A0",
                        fontFamily: "var(--font-jakarta)",
                      }}
                    >
                      Tinjau
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
