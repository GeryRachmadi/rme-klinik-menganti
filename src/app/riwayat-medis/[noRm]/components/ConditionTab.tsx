import { MappedCondition } from '@/lib/mappers/medical-records-mapper';
import { Activity } from 'lucide-react';
import EmptyTabState from './EmptyTabState';

interface ConditionTabProps {
  data?: MappedCondition[];
}

export default function ConditionTab({ data }: ConditionTabProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
        Kondisi Pasien
      </h2>

      {!data || data.length === 0 ? (
        <EmptyTabState
          icon={Activity}
          title="Belum Ada Catatan Kondisi"
          description="Pasien ini belum memiliki riwayat kondisi medis penyerta atau diagnosis yang tercatat dalam sistem."
        />
      ) : (
        <div className="space-y-4">
          {data.map((condition, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
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
