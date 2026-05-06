import { Plus } from "lucide-react";
import type { Patient } from "@/generated/prisma";

export default function PatientHeader({
  patient,
  userRole,
}: {
  patient: Patient;
  userRole: string;
}) {
  const dob = new Date(patient.tanggalLahir);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  const genderLabel = patient.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";
  
  const initials = patient.namaLengkap
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const canStartAssessment = ["admin", "dokter", "suster"].includes(userRole.toLowerCase());

  return (
    <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex flex-col md:flex-row justify-between items-center gap-4">
      {/* Left Section */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full border-2 border-teal-500 bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-2xl flex-shrink-0">
          {initials}
        </div>
        
        {/* Info */}
        <div className="flex flex-col items-start gap-1">
          <h1
            className="text-2xl font-bold text-gray-900 leading-tight"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {patient.namaLengkap}
          </h1>
          
          <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-jakarta)" }}>
            {genderLabel} • {age} tahun • {patient.nik}
          </p>
          
          <div className="bg-[#006B4E] text-white px-3 py-1 rounded-full text-xs font-semibold mt-1" style={{ fontFamily: "var(--font-jakarta)" }}>
            {patient.noRm}
          </div>
        </div>
      </div>

      {/* Right Section */}
      {canStartAssessment && (
        <button
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium shrink-0"
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          <Plus className="w-5 h-5" />
          Mulai Asesmen
        </button>
      )}
    </div>
  );
}