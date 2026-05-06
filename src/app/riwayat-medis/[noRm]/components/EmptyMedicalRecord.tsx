import { FolderOpen, Plus } from "lucide-react";

export default function EmptyMedicalRecord({ userRole }: { userRole: string }) {
  // RBAC Logic
  const allowedAssessmentRoles = ["admin", "dokter", "suster"];
  const canStartAssessment = allowedAssessmentRoles.includes(userRole?.toLowerCase());

  return (
    <div className="bg-white rounded-lg p-12 shadow-sm max-w-md mx-auto mt-8 text-center border border-gray-100">
      <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
        Belum Ada Riwayat Medis
      </h2>
      
      <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-jakarta)" }}>
        Pasien ini belum memiliki catatan kunjungan atau rekam medis di klinik.
      </p>

      {canStartAssessment && (
        <button 
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium shrink-0 transition-colors mx-auto"
          style={{ fontFamily: "var(--font-poppins)" }}
          onClick={() => {
            // TODO: TR-56 Wire this button to assessment workflow (/riwayat-medis/[noRm]/asesmen)
            console.log("Navigasi ke halaman form asesmen disiapkan di TR-56");
          }}
        >
          <Plus className="w-5 h-5" />
          Mulai Asesmen Pertama
        </button>
      )}
    </div>
  );
}