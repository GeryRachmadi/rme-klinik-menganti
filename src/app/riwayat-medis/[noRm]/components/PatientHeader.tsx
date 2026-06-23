import type { Patient } from "@/generated/prisma";
import MulaiAsesmenButton from "./MulaiAsesmenButton";
import CetakButton from "./CetakButton";
import { formatDob } from "@/lib/utils/format-dob";
import { formatJenisKelamin } from "@/lib/utils/format-gender";

export default function PatientHeader({
  patient,
  userRole,
  latestDiagnosis,
  latestTreatment,
}: {
  patient: Patient;
  userRole: string;
  latestDiagnosis?: string | null;
  latestTreatment?: string | null;
}) {
  const dob = new Date(patient.tanggalLahir);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  const genderLabel = formatJenisKelamin(patient.jenisKelamin);
  const genderColor = patient.jenisKelamin === "LAKI_LAKI"
    ? "bg-blue-100 text-blue-700"
    : "bg-pink-100 text-pink-700";

  const initials = patient.namaLengkap
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // Visible to clinical/admin roles; hidden for PENDAFTARAN (front desk has no
  // access to clinical workflows — least-privilege / medical privacy).
  const canStartAssessment = ["ADMIN", "DOKTER", "PERAWAT"].includes(
    (userRole ?? "").toUpperCase()
  );

  // "Cetak" is for clinicians/admin only, and only once a completed (SELESAI)
  // encounter exists. latestDiagnosis is a reliable proxy: it is non-null only
  // when the latest visit produced a diagnosis (i.e. an assessment finished).
  const canPrint =
    ["ADMIN", "DOKTER"].includes((userRole ?? "").toUpperCase()) &&
    !!latestDiagnosis;

  return (
    <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex flex-col md:flex-row justify-between items-center gap-4">
      {/* Left Section */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full border-2 border-teal-500 bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-2xl flex-shrink-0">
          {initials}
        </div>
        
        {/* Info */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-2xl font-bold text-gray-900 leading-tight"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {patient.namaLengkap}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="bg-[#006B4E] text-white px-3 py-0.5 rounded-full text-xs font-semibold"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {patient.noRm}
            </span>
            <span
              className="bg-gray-100 text-gray-600 px-3 py-0.5 rounded-full text-xs font-medium"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              NIK: {patient.nik}
            </span>
            {patient.tanggalLahir && (
              <span
                className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-xs font-medium"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                {formatDob(patient.tanggalLahir)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-medium ${genderColor}`}
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {genderLabel}
            </span>
            <span
              className="bg-teal-50 text-teal-700 px-3 py-0.5 rounded-full text-xs font-medium"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {age} tahun
            </span>
          </div>

          {(latestDiagnosis || latestTreatment) && (
            <div className="flex flex-wrap items-center gap-2">
              {latestDiagnosis && (
                <span
                  className="bg-red-50 text-red-700 border border-red-700 px-4 py-1 rounded-full text-sm font-medium"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Dx: {latestDiagnosis}
                </span>
              )}
              {latestTreatment && (
                <span
                  className="bg-purple-50 text-purple-700 border border-purple-700 px-4 py-1 rounded-full text-sm font-medium"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Tx: {latestTreatment}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      {(canStartAssessment || canPrint) && (
        <div className="flex items-center gap-3 shrink-0">
          {canPrint && <CetakButton />}
          {canStartAssessment && (
            <MulaiAsesmenButton
              patientId={patient.id}
              patientName={patient.namaLengkap}
            />
          )}
        </div>
      )}
    </div>
  );
}