import React from 'react';
import { dummyConditions } from '@/lib/dummy-data/patient-details';

export default function ConditionTab() {
  return (
    <div className="w-full">
      {/* Judul Utama: Hitam & Bold */}
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
        Kondisi Pasien
      </h2>

      {!dummyConditions || dummyConditions.length === 0 ? (
        <div className="p-5 text-gray-500" style={{ fontFamily: "var(--font-jakarta)" }}>
          Tidak ada data kondisi medis...
        </div>
      ) : (
        <div className="space-y-4">
          {dummyConditions.map((condition, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                {/* Judul Penyakit: Hitam & Bold */}
                <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                  {condition.name} <span className="text-gray-500 text-sm font-normal">({condition.icd10})</span>
                </h3>
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    condition.status === 'Sembuh' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {condition.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                <p><strong>Tanggal Diagnosis:</strong> {condition.dateDiagnosed}</p>
                {condition.notes && <p><strong>Catatan:</strong> {condition.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}