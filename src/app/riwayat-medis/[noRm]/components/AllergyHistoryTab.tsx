import React from 'react';
import { MappedAllergy } from '@/lib/mappers/medical-records-mapper';
import { ShieldAlert } from 'lucide-react';

interface AllergyHistoryTabProps {
  data?: MappedAllergy[];
}

export default function AllergyHistoryTab({ data }: AllergyHistoryTabProps) {
  return (
    <div className="w-full">
      {/* Judul Utama: Hitam & Bold */}
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
        Riwayat Alergi
      </h2>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 border border-slate-200 rounded-3xl mt-4">
          <div className="bg-white w-16 h-16 flex items-center justify-center rounded-full shadow-sm border border-slate-100 mb-5">
            <ShieldAlert className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
            Tidak Ada Riwayat Alergi
          </h3>
          <p className="text-slate-500 max-w-md text-sm leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
            Berdasarkan rekam medis, pasien ini tidak memiliki riwayat alergi terhadap obat, makanan, maupun lingkungan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((allergy, index) => {
            let borderColor = 'border-gray-500';
            const severity = allergy.severity?.toLowerCase();
            if (severity === 'tinggi' || severity === 'severe') borderColor = 'border-red-500';
            else if (severity === 'sedang' || severity === 'moderate') borderColor = 'border-orange-500';
            else if (severity === 'rendah' || severity === 'mild') borderColor = 'border-blue-500';

            return (
              <div key={index} className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 ${borderColor}`}>
                {/* Nama Alergi: Hitam & Bold */}
                <h3 className="font-bold text-lg text-gray-900 mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
                  {allergy.allergen}
                </h3>
                <div className="text-sm text-gray-600 space-y-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                  {allergy.reaction && <p><strong>Reaksi:</strong> {allergy.reaction}</p>}
                  {allergy.severity && <p><strong>Tingkat Keparahan:</strong> {allergy.severity}</p>}
                  {allergy.dateDiscovered && <p><strong>Tanggal Diketahui:</strong> {new Date(allergy.dateDiscovered).toLocaleDateString('id-ID')}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}