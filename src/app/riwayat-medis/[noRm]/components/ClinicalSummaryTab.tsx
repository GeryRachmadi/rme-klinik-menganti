"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Activity, Pill, Stethoscope, Info, AlertCircle, Calendar } from "lucide-react";
import { 
  ClinicalSummary, 
  dummyClinicalSummary,
  Diagnosis,
  LatestVitals,
  RoutineMed,
  RiskFactor,
  SpecialNote
} from "@/lib/dummy-data/clinical-summary";
import { dummyEncounters } from "@/lib/dummy-data/encounters";
import { EncounterCard } from "./EncounterHistoryTab";

// --- Skeleton Component ---
const SummarySkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full animate-pulse">
      {/* Left Column Skeleton */}
      <div className="col-span-1 lg:col-span-7">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="pl-6 border-l-2 border-gray-200">
          <div className="bg-white rounded-2xl border border-gray-200 h-64 w-full"></div>
        </div>
      </div>
      
      {/* Right Column Skeleton */}
      <div className="col-span-1 lg:col-span-5">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="flex flex-col space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 h-48">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Atomic Components ---

const ActiveDiagnosisCard = ({ diagnoses }: { diagnoses: Diagnosis[] }) => {
  const displayLimit = 5;
  const displayed = diagnoses.slice(0, displayLimit);
  const remaining = diagnoses.length - displayLimit;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope className="text-blue-600 w-5 h-5" />
        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
          Diagnosis Aktif
        </h3>
      </div>
      
      {diagnoses.length === 0 ? (
        <p className="text-gray-500 italic text-sm mt-auto mb-auto" style={{ fontFamily: "var(--font-jakarta)" }}>
          Tidak ada diagnosis aktif.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2" style={{ fontFamily: "var(--font-jakarta)" }}>
          {displayed.map((diag, idx) => (
            <span 
              key={idx}
              className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm font-medium border border-blue-100"
              title={`${diag.code} - ${new Date(diag.dateDiagnosed).toLocaleDateString('id-ID')}`}
            >
              {diag.name}
            </span>
          ))}
          {remaining > 0 && (
            <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">
              +{remaining} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const LatestVitalsCard = ({ vitals }: { vitals: LatestVitals | null }) => {
  if (!vitals) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
         <div className="flex items-center gap-2 mb-4">
          <Activity className="text-teal-600 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
            Pengecekan Fisik
          </h3>
        </div>
        <p className="text-gray-500 italic text-sm mt-auto mb-auto" style={{ fontFamily: "var(--font-jakarta)" }}>
          Data pengecekan fisik belum dicatat.
        </p>
      </div>
    );
  }

  const formattedDate = new Date(vitals.lastUpdated).toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'short', year: 'numeric' 
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-teal-600 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
            Pengukuran Fisik
          </h3>
        </div>
        <span className="text-xs text-gray-500 flex items-center gap-1" style={{ fontFamily: "var(--font-jakarta)" }}>
          <Calendar className="w-3 h-3" />
          (Per {formattedDate})
        </span>
      </div>

      <h4 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
        Tanda Vital
      </h4>
      <div className="grid grid-cols-2 gap-4" style={{ fontFamily: "var(--font-jakarta)" }}>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Tekanan Darah</p>
          <p className="font-semibold text-gray-900">{vitals.bloodPressure} <span className="text-xs font-normal text-gray-500">mmHg</span></p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Nadi</p>
          <p className="font-semibold text-gray-900">{vitals.heartRate} <span className="text-xs font-normal text-gray-500">x/mnt</span></p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Suhu</p>
          <p className="font-semibold text-gray-900">{vitals.temperature} <span className="text-xs font-normal text-gray-500">°C</span></p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Pernapasan</p>
          <p className="font-semibold text-gray-900">{vitals.respiratoryRate} <span className="text-xs font-normal text-gray-500">x/mnt</span></p>
        </div>
      </div>

      {(vitals.weight || vitals.height || vitals.bmi) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
            Antropometri
          </h4>
          <div className="flex flex-wrap gap-3" style={{ fontFamily: "var(--font-jakarta)" }}>
            {vitals.weight && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EFF6FF] border border-blue-100 rounded-lg text-sm text-blue-900 shadow-sm">
                <span className="text-blue-600 font-bold">BB:</span>
                <span className="font-normal">{vitals.weight} kg</span>
              </span>
            )}
            {vitals.height && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EFF6FF] border border-blue-100 rounded-lg text-sm text-blue-900 shadow-sm">
                <span className="text-blue-600 font-bold">TB:</span>
                <span className="font-normal">{vitals.height} cm</span>
              </span>
            )}
            {vitals.bmi && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EFF6FF] border border-blue-100 rounded-lg text-sm text-blue-900 shadow-sm">
                <span className="text-blue-600 font-bold">BMI:</span>
                <span className="font-normal">{vitals.bmi}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RoutineMedsCard = ({ meds }: { meds: RoutineMed[] }) => {
  const latestDate = meds.length > 0 
    ? new Date(Math.max(...meds.map(m => new Date(m.lastUpdated).getTime()))) 
    : null;
    
  const formattedDate = latestDate 
    ? latestDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pill className="text-purple-600 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
            Pengobatan Rutin
          </h3>
        </div>
        {formattedDate && (
          <span className="text-xs text-gray-500 flex items-center gap-1" style={{ fontFamily: "var(--font-jakarta)" }}>
             <Calendar className="w-3 h-3" />
             (Diperbarui: {formattedDate})
          </span>
        )}
      </div>

      {meds.length === 0 ? (
        <p className="text-gray-500 italic text-sm mt-auto mb-auto" style={{ fontFamily: "var(--font-jakarta)" }}>
          Tidak ada pengobatan rutin.
        </p>
      ) : (
        <ul className="space-y-3" style={{ fontFamily: "var(--font-jakarta)" }}>
          {meds.map((med, idx) => (
            <li key={idx} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <div>
                <p className="font-medium text-gray-900">{med.name}</p>
                <p className="text-sm text-gray-500">{med.instructions}</p>
              </div>
              <span className="text-sm font-semibold bg-purple-50 text-purple-700 px-2 py-1 rounded">
                {med.dosage}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AlertNotesCard = ({ riskFactors, specialNotes }: { riskFactors: RiskFactor[], specialNotes: SpecialNote[] }) => {
  const hasItems = riskFactors.length > 0 || specialNotes.length > 0;

  const getSeverityStyle = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-l-4 border-red-500';
      case 'warning':
        return 'bg-orange-50 text-orange-700 border-l-4 border-orange-500';
      case 'info':
        return 'bg-teal-50 text-teal-700 border-l-4 border-teal-500';
      default:
        return 'bg-gray-50 text-gray-700 border-l-4 border-gray-500';
    }
  };

  const getIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-teal-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-gray-600 shrink-0" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-red-500 w-5 h-5" />
        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
          Faktor Risiko & Catatan
        </h3>
      </div>

      {!hasItems ? (
        <p className="text-gray-500 italic text-sm mt-auto mb-auto" style={{ fontFamily: "var(--font-jakarta)" }}>
          Tidak ada faktor risiko/catatan.
        </p>
      ) : (
        <div className="space-y-3" style={{ fontFamily: "var(--font-jakarta)" }}>
          {/* Risk Factors */}
          {riskFactors.map((risk, idx) => (
            <div key={`risk-${idx}`} className={`p-3 rounded-r-lg flex items-start gap-2 ${getSeverityStyle(risk.severity)}`}>
              <div className="mt-0.5">{getIcon(risk.severity)}</div>
              <div>
                <p className="text-sm font-medium">{risk.description}</p>
                <p className="text-xs opacity-75 mt-0.5 uppercase tracking-wide font-semibold">Faktor Risiko</p>
              </div>
            </div>
          ))}
          
          {/* Special Notes */}
          {specialNotes.map((note, idx) => (
            <div key={`note-${idx}`} className={`p-3 rounded-r-lg flex items-start gap-2 ${getSeverityStyle(note.severity)}`}>
               <div className="mt-0.5">{getIcon(note.severity)}</div>
               <div>
                  <p className="text-sm font-medium">{note.text}</p>
                  <p className="text-xs opacity-75 mt-0.5">Catatan Khusus &bull; {new Date(note.dateAdded).toLocaleDateString('id-ID')}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// --- Main Tab Component ---

export default function ClinicalSummaryTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<ClinicalSummary | null>(null);

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setSummaryData(dummyClinicalSummary);
      setIsLoading(false);
    }, 600); 

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !summaryData) {
    return <SummarySkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
      {/* Left Column: Last Encounter */}
      <div className="col-span-1 lg:col-span-7">
        <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
          Kunjungan Terakhir
        </h2>
        <div className="pl-6 border-l-2 border-gray-200 ml-4 lg:ml-0">
          <EncounterCard encounter={dummyEncounters[0]} index={0} defaultExpanded={true} />
        </div>
      </div>

      {/* Right Column: Clinical Summary Sidebar */}
      <div className="col-span-1 lg:col-span-5">
        <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
          Ringkasan Klinis
        </h2>
        <div className="flex flex-col space-y-6">
          <ActiveDiagnosisCard diagnoses={summaryData.diagnoses} />
          <LatestVitalsCard vitals={summaryData.latestVitals} />
          <RoutineMedsCard meds={summaryData.routineMeds} />
          <AlertNotesCard 
            riskFactors={summaryData.riskFactors} 
            specialNotes={summaryData.specialNotes} 
          />
        </div>
      </div>
    </div>
  );
}
