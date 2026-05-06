import React from 'react';
import { dummyAllergies } from '@/lib/dummy-data/patient-details';

export default function AllergyHistoryTab() {
  return (
    <div className="w-full">
      {/* Judul Utama: Hitam & Bold */}
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
        Riwayat Alergi
      </h2>

      {!dummyAllergies || dummyAllergies.length === 0 ? (
        <div className="p-5 text-gray-500" style={{ fontFamily: "var(--font-jakarta)" }}>
          Tidak ada data alergi...
        </div>
      ) : (
        <div className="space-y-4">
          {dummyAllergies.map((allergy, index) => {
            let borderColor = 'border-gray-500';
            if (allergy.severity === 'Tinggi') borderColor = 'border-red-500';
            else if (allergy.severity === 'Sedang') borderColor = 'border-orange-500';
            else if (allergy.severity === 'Rendah') borderColor = 'border-blue-500';

            return (
              <div key={index} className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 ${borderColor}`}>
                {/* Nama Alergi: Hitam & Bold */}
                <h3 className="font-bold text-lg text-gray-900 mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
                  {allergy.allergen}
                </h3>
                <div className="text-sm text-gray-600 space-y-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                  <p><strong>Reaksi:</strong> {allergy.reaction}</p>
                  <p><strong>Tingkat Keparahan:</strong> {allergy.severity}</p>
                  <p><strong>Tanggal Diketahui:</strong> {allergy.dateDiscovered}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}