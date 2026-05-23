import { type MappedMedication } from "@/lib/mappers/medical-records-mapper";
import { Pill } from 'lucide-react';
import EmptyTabState from './EmptyTabState';

interface MedicationTabProps {
  data?: MappedMedication[];
}

export default function MedicationTab({ data = [] }: MedicationTabProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
        Pengobatan Rutin
      </h2>

      {data.length === 0 ? (
        <EmptyTabState
          icon={Pill}
          title="Tidak Ada Pengobatan Rutin"
          description="Pasien saat ini tidak sedang menjalani terapi pengobatan rutin atau tidak ada resep aktif yang tercatat."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((med, index) => (
            <div key={med.name} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-start space-x-4">
              <div className="bg-blue-50 p-3 rounded-full flex-shrink-0">
                <Pill className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                    {med.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      ['ACTIVE', 'AKTIF'].includes(med.status?.toUpperCase() ?? '')
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
