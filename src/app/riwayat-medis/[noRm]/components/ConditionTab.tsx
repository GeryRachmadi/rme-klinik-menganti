import React from 'react';
import { MappedCondition } from '@/lib/mappers/medical-records-mapper';
import { Activity } from 'lucide-react';

interface Props {
  data?: MappedCondition[];
}

export default function ConditionTab({ data }: Props) {
  return (
    <div className="w-full">
      {/* Judul Utama: Hitam & Bold */}
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
        Kondisi Pasien
      </h2>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 border border-slate-200 rounded-3xl mt-4">
          <div className="bg-white w-16 h-16 flex items-center justify-center rounded-full shadow-sm border border-slate-100 mb-5">
            <Activity className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
            Belum Ada Catatan Kondisi
          </h3>
          <p className="text-slate-500 max-w-md text-sm leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
            Pasien ini belum memiliki riwayat kondisi medis penyerta atau diagnosis yang tercatat dalam sistem.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((condition, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                {/* Judul Penyakit: Hitam & Bold */}
                <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                  {condition.name} {condition.icd10 && <span className="text-gray-500 text-sm font-normal">({condition.icd10})</span>}
                </h3>
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    condition.status?.toLowerCase() === 'sembuh' || condition.status?.toLowerCase() === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {condition.status || 'Aktif'}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                {condition.dateDiagnosed && <p><strong>Tanggal Diagnosis:</strong> {new Date(condition.dateDiagnosed).toLocaleDateString('id-ID')}</p>}
                {condition.notes && <p><strong>Catatan:</strong> {condition.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}