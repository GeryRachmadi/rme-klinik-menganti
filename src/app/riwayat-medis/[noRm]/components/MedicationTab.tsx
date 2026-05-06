import React from 'react';
import { dummyMeds } from '@/lib/dummy-data/patient-details';
import { Pill } from 'lucide-react';

export default function MedicationTab() {
  return (
    <div className="w-full">
      {/* Judul Utama: Hitam & Bold */}
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
        Pengobatan Rutin
      </h2>

      {!dummyMeds || dummyMeds.length === 0 ? (
        <div className="p-5 text-gray-500" style={{ fontFamily: "var(--font-jakarta)" }}>
          Tidak ada data pengobatan rutin...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dummyMeds.map((med, index) => (
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
                      med.status === 'Aktif' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    {med.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                  <p><strong>Dosis:</strong> {med.dosage}</p>
                  <p><strong>Frekuensi:</strong> {med.frequency}</p>
                  <p><strong>Diresepkan Oleh:</strong> {med.prescribedBy}</p>
                  <p><strong>Mulai:</strong> {med.startDate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}