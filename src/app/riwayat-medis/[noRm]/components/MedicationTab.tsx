import React from 'react';
import { type MappedMedication } from "@/lib/mappers/medical-records-mapper";
import { Pill } from 'lucide-react';

// 1. Buat keranjang untuk menerima data dari parent
interface MedicationTabProps {
  data?: MappedMedication[];
}

// 2. Buka pintu props: terima { data }
export default function MedicationTab({ data = [] }: MedicationTabProps) {
  return (
    <div className="w-full">
      {/* Judul Utama: Hitam & Bold */}
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
        Pengobatan Rutin
      </h2>

      {/* 3. Ganti dummyMeds jadi data */}
      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 border border-slate-200 rounded-3xl mt-4">
          <div className="bg-white w-16 h-16 flex items-center justify-center rounded-full shadow-sm border border-slate-100 mb-5">
            <Pill className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
            Tidak Ada Pengobatan Rutin
          </h3>
          <p className="text-slate-500 max-w-md text-sm leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
            Pasien saat ini tidak sedang menjalani terapi pengobatan rutin atau tidak ada resep aktif yang tercatat.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 3. Ganti dummyMeds jadi data */}
          {data.map((med, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-start space-x-4">
              <div className="bg-blue-50 p-3 rounded-full flex-shrink-0">
                <Pill className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  {/* Nama Obat: Hitam & Bold */}
                  <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                    {med.name}
                  </h3>
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      // Sesuaikan warna status, biasanya di DB aslinya bahasa Inggris "Active" atau "ACTIVE"
                      med.status?.toUpperCase() === 'ACTIVE' || med.status?.toUpperCase() === 'AKTIF' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                    }`}
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    {med.status || "Unknown"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                  <p><strong>Dosis:</strong> {med.dosage || "-"}</p>
                  <p><strong>Frekuensi:</strong> {med.frequency || "-"}</p>
                  {/* 4. prescribedBy dan startDate dihapus karena tidak ada di schema tabel MedicationStatement DB aslimu */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}