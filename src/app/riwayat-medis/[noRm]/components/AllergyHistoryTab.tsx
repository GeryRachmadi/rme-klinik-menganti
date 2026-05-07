import { MappedAllergy } from '@/lib/mappers/medical-records-mapper';
import { ShieldAlert } from 'lucide-react';
import EmptyTabState from './EmptyTabState';

const SEVERITY_BORDER: Record<string, string> = {
  tinggi: 'border-red-500',    severe: 'border-red-500',
  sedang: 'border-orange-500', moderate: 'border-orange-500',
  rendah: 'border-blue-500',   mild: 'border-blue-500',
};

interface AllergyHistoryTabProps {
  data?: MappedAllergy[];
}

export default function AllergyHistoryTab({ data }: AllergyHistoryTabProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
        Riwayat Alergi
      </h2>

      {!data || data.length === 0 ? (
        <EmptyTabState
          icon={ShieldAlert}
          title="Tidak Ada Riwayat Alergi"
          description="Berdasarkan rekam medis, pasien ini tidak memiliki riwayat alergi terhadap obat, makanan, maupun lingkungan."
        />
      ) : (
        <div className="space-y-4">
          {data.map((allergy, index) => {
            const borderColor = SEVERITY_BORDER[allergy.severity?.toLowerCase() ?? ''] ?? 'border-gray-500';

            return (
              <div key={index} className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 ${borderColor}`}>
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
