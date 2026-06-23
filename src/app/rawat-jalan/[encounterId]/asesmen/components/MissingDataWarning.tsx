import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface MissingDataWarningProps {
  missingAssessment: boolean;
  missingVitals: boolean;
  missingNursing?: boolean;
}

export default function MissingDataWarning({ missingAssessment, missingVitals, missingNursing = false }: MissingDataWarningProps) {
  if (!missingAssessment && !missingVitals && !missingNursing) return null;

  return (
    <div className="flex flex-col gap-2">
      {missingAssessment && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4 rounded-r-xl flex items-start gap-3">
          <AlertTriangle size={20} color="#D97706" className="flex-shrink-0 mt-0.5" />
          <p
            className="text-amber-800 text-sm font-medium font-sans"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Peringatan: Data Kajian Awal belum dilengkapi oleh Perawat
          </p>
        </div>
      )}
      {missingVitals && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4 rounded-r-xl flex items-start gap-3">
          <AlertTriangle size={20} color="#D97706" className="flex-shrink-0 mt-0.5" />
          <p
            className="text-amber-800 text-sm font-medium font-sans"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Peringatan: Pemeriksaan Fisik belum dilengkapi oleh Perawat
          </p>
        </div>
      )}
      {missingNursing && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4 rounded-r-xl flex items-start gap-3">
          <AlertTriangle size={20} color="#D97706" className="flex-shrink-0 mt-0.5" />
          <p
            className="text-amber-800 text-sm font-medium font-sans"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Peringatan: Asesmen Keperawatan belum dilengkapi oleh Perawat
          </p>
        </div>
      )}
    </div>
  );
}
