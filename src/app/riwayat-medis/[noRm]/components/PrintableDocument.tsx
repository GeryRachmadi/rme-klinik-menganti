"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { RingkasanData } from "@/lib/mappers/medical-records-mapper";
import { formatDob } from "@/lib/utils/format-dob";
import { formatDoctorName } from "@/lib/utils/format-doctor-name";

// Only the identity fields the document actually renders — keeps this reusable
// from both the riwayat-medis page (full Patient) and the asesmen page (a
// partial Prisma `select`).
interface PrintablePatient {
  namaLengkap: string;
  noRm: string;
  nik: string;
  tanggalLahir: Date | string;
  jenisKelamin: string;
  noBpjs?: string | null;
}

interface PrintableDocumentProps {
  patient: PrintablePatient;
  data: RingkasanData;
}

const TIMES = { fontFamily: '"Times New Roman", Times, serif' } as const;

// Waktu konsumsi → Latin prescription abbreviation. Unmatched values render
// as-is (no abbreviation) rather than disappearing.
const WAKTU_ABBR: Record<string, string> = {
  "Sesudah Makan": "p.c.",
  "Sebelum Makan": "a.c.",
  "Saat Makan": "d.c.",
  "Perut Kosong": "a.c.",
  "Sebelum Tidur": "h.s.",
  "Bila Perlu (PRN)": "p.r.n.",
  "Setiap 6 Jam": "6 hourly",
  "Setiap 8 Jam": "8 hourly",
  "Setiap 12 Jam": "12 hourly",
};

function abbrevWaktu(waktu: string | null | undefined): string {
  if (!waktu) return "";
  return WAKTU_ABBR[waktu] ?? waktu;
}

// "22 Juni 2026" — Indonesian long-form date, WIB.
function formatTanggalIndonesia(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));
}

// "Senin, 22 Juni 2026" — Indonesian long-form date with day name, WIB.
function formatTanggalDenganHari(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatTanggalJamWib(date: Date): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

/**
 * Always-rendered (but screen-hidden) print document for the Kunjungan Terakhir
 * view. Portaled directly onto <body> so it becomes a top-level sibling of the
 * app shell (DashboardLayout). The print stylesheet removes every OTHER body
 * child via `body > *:not(.print-root)`, hiding sidebar/navbar/tabs/buttons at
 * once. display:none (not visibility:hidden) removes box height too, so there
 * are no trailing blank pages.
 *
 * Dedicated single-page A4 layout — does not reuse the on-screen RingkasanTab,
 * which carries UI chrome unsuited to a formal clinical document.
 */
export default function PrintableDocument({
  patient,
  data,
}: PrintableDocumentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Portal target (document.body) only exists on the client.
  if (!mounted) return null;

  const episodic = data.episodic;
  if (!episodic) return null;

  // Age from DoB.
  const dob = new Date(patient.tanggalLahir);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  const genderLabel =
    patient.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";

  const jenisPenjaminLabel =
    episodic.patientType === "BPJS" ? "BPJS Kesehatan" : "Umum";
  const showNoBpjs = episodic.patientType === "BPJS" && !!patient.noBpjs;

  const vitals = episodic.vitals;
  const hasFisikLine1 =
    vitals &&
    (vitals.systolic != null ||
      vitals.diastolic != null ||
      vitals.heartRate != null ||
      vitals.temperature != null ||
      vitals.respiratoryRate != null);
  const hasFisikLine2 =
    vitals && vitals.height != null && vitals.weight != null && vitals.bmi != null;

  const primaryDiagnosis = episodic.diagnoses[0] || null;

  const instruksiLabValue = (episodic.instruksiLab || "").trim();
  const showInstruksiLab =
    instruksiLabValue.length > 0 &&
    instruksiLabValue !== "-" &&
    !/^tidak ada/i.test(instruksiLabValue);

  return createPortal(
    <div className="print-root hidden print:block" style={TIMES}>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          .print-root, .print-root * { color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-root { font-size: 11px; }
          .print-footer { position: fixed; bottom: 0; left: 0; right: 0; }
        }
      `}</style>

      {/* Clinic letterhead */}
      <div className="mb-3 text-center">
        <h1 className="text-base font-bold">KLINIK PRATAMA MENGANTI</h1>
        <p className="text-[10px]">
          Hendrosari, Perumahan Siwalan Indah No.AA-1, Kepatihan, Kec. Menganti,
          Kabupaten Gresik, Jawa Timur 61174 | Telp: 0811-3210-xxxx
        </p>
      </div>
      <hr className="mb-3 border-t-2 border-black" />

      {/* Doctor + date row */}
      <div className="mb-3 flex items-start justify-between text-[11px]">
        <p>
          {episodic.practitionerName
            ? formatDoctorName(episodic.practitionerName, episodic.practitionerSpeciality)
            : "-"}
          <br />
          SIP: ____________________
        </p>
        <p>Gresik, {formatTanggalDenganHari(new Date())}</p>
      </div>

      {/* Title */}
      <h2 className="mb-3 text-center text-[13px] font-bold underline">
        RINGKASAN KUNJUNGAN MEDIS
      </h2>

      {/* Patient info box */}
      <table className="mb-3 w-full border border-black text-[11px]">
        <tbody>
          <tr>
            <td className="w-1/2 border border-black px-2 py-1">
              <span className="inline-block w-32">Nama Pasien</span>: {patient.namaLengkap}
            </td>
            <td className="w-1/2 border border-black px-2 py-1">
              <span className="inline-block w-32">No. RM</span>: {patient.noRm}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">
              <span className="inline-block w-32">Tgl. Lahir / Usia</span>: {formatDob(patient.tanggalLahir)} ({age} tahun)
            </td>
            <td className="border border-black px-2 py-1">
              <span className="inline-block w-32">NIK</span>: {patient.nik}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">
              <span className="inline-block w-32">Jenis Kelamin</span>: {genderLabel}
            </td>
            <td className="border border-black px-2 py-1">
              <span className="inline-block w-32">Jenis Penjamin</span>: {jenisPenjaminLabel}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">
              <span className="inline-block w-32">Tanggal Kunjungan</span>: {formatTanggalIndonesia(episodic.encounterDate)}
            </td>
            <td className="border border-black px-2 py-1">
              {showNoBpjs && (
                <>
                  <span className="inline-block w-32">No. BPJS</span>: {patient.noBpjs}
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Clinical table */}
      <table className="mb-3 w-full text-[11px]">
        <tbody>
          <tr className="border-t border-black align-top">
            <td className="w-[30%] border-b border-black py-1 pr-2 font-semibold">Keluhan Awal</td>
            <td className="w-[70%] border-b border-black py-1">{episodic.keluhanAwal || "-"}</td>
          </tr>
          <tr className="align-top">
            <td className="w-[30%] border-b border-black py-1 pr-2 font-semibold">Pemeriksaan Fisik</td>
            <td className="w-[70%] border-b border-black py-1">
              {hasFisikLine1 ? (
                <>
                  TD {vitals!.systolic ?? "-"}/{vitals!.diastolic ?? "-"} mmHg · Nadi {vitals!.heartRate ?? "-"} x/menit · Suhu {vitals!.temperature ?? "-"}°C · RR {vitals!.respiratoryRate ?? "-"} x/menit
                </>
              ) : (
                "-"
              )}
              {hasFisikLine2 && (
                <>
                  <br />
                  TB {vitals!.height} cm · BB {vitals!.weight} kg · BMI {vitals!.bmi}
                </>
              )}
            </td>
          </tr>
          <tr className="align-top">
            <td className="w-[30%] border-b border-black py-1 pr-2 font-semibold">Diagnosa Utama</td>
            <td className="w-[70%] border-b border-black py-1">
              {primaryDiagnosis ? `${primaryDiagnosis.code} — ${primaryDiagnosis.display}` : "-"}
            </td>
          </tr>
          <tr className="align-top">
            <td className="w-[30%] border-b border-black py-1 pr-2 font-semibold">Tindakan</td>
            <td className="w-[70%] border-b border-black py-1">
              {episodic.procedures.length > 0 ? (
                episodic.procedures.map((p, i) => (
                  <div key={i}>{p.code ? `${p.code} — ${p.display}` : p.display}</div>
                ))
              ) : (
                "-"
              )}
            </td>
          </tr>
          <tr className="align-top">
            <td className="w-[30%] border-b border-black py-1 pr-2 font-semibold">Resep Obat</td>
            <td className="w-[70%] border-b border-black py-1">
              {episodic.medications.length === 0 ? (
                "-"
              ) : (
                episodic.medications.map((item, i) => (
                  <div
                    key={i}
                    className={i > 0 ? "mt-1 border-t border-dashed border-black pt-1" : ""}
                  >
                    {item.type === "tidak-ada" ? (
                      <p className="italic">Tidak ada resep obat untuk kunjungan ini.</p>
                    ) : item.type === "non-racikan" ? (
                      <>
                        <p className="italic">
                          R/ {item.namaObat} {item.dosis} {item.bentukSediaan} No. {item.jumlah}
                        </p>
                        <p className="italic" style={{ paddingLeft: "1.5rem" }}>
                          S. {item.aturanPakai} ({abbrevWaktu(item.waktuKonsumsi)})
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="italic">R/ {item.namaRacikan}</p>
                        {item.ingredients.map((ing, j) => (
                          <p key={j} className="italic" style={{ paddingLeft: "1.5rem" }}>
                            {ing.namaObat} {ing.dosis}
                          </p>
                        ))}
                        <p className="italic" style={{ paddingLeft: "1.5rem" }}>
                          m.f.l.a. {item.bentukSediaan} d.t.d. No. {item.jumlah}
                        </p>
                        <p className="italic" style={{ paddingLeft: "1.5rem" }}>
                          S. {item.aturanPakai} ({abbrevWaktu(item.waktuKonsumsi)})
                        </p>
                      </>
                    )}
                  </div>
                ))
              )}
            </td>
          </tr>
          {showInstruksiLab && (
            <tr className="align-top">
              <td className="w-[30%] border-b border-black py-1 pr-2 font-semibold">Instruksi Lab</td>
              <td className="w-[70%] border-b border-black py-1">{instruksiLabValue}</td>
            </tr>
          )}
          <tr className="align-top">
            <td className="w-[30%] border-b border-black py-1 pr-2 font-semibold">Edukasi/Anjuran</td>
            <td className="w-[70%] border-b border-black py-1">{episodic.education || "-"}</td>
          </tr>
          <tr className="align-top">
            <td className="w-[30%] border-b border-black py-1 pr-2 font-semibold">Rujukan Lain</td>
            <td className="w-[70%] border-b border-black py-1">
              {episodic.referral ? (
                <>
                  <p className="font-bold">Dirujuk ke: {episodic.referral.tujuan}</p>
                  <p className="text-gray-600">Alasan: {episodic.referral.alasan || "-"}</p>
                </>
              ) : (
                <p className="italic text-gray-600">Tidak ada rujukan</p>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signature block */}
      <div className="mt-8 flex justify-end text-[11px]">
        <div className="flex flex-col items-end gap-1">
          <p>Dokter Pemeriksa,</p>
          <div className="mt-14 w-48 border-b border-black" />
          <p className="font-semibold">
            {episodic.practitionerName
              ? formatDoctorName(episodic.practitionerName, episodic.practitionerSpeciality)
              : "-"}
          </p>
          <p>SIP: ____________________</p>
        </div>
      </div>

      {/* Footer — pinned to the bottom of the page via .print-footer (fixed
          positioning in print media) so it always sits at the page bottom
          regardless of content length, instead of trailing the content. */}
      <p className="print-footer mt-6 text-center text-[9px] text-gray-500">
        Dicetak dari Sistem RME Klinik Pratama Menganti · {patient.noRm} · {formatTanggalJamWib(new Date())}
      </p>
    </div>,
    document.body
  );
}
