"use client";

import React from "react";
// Import Plus ditambahkan ke sini
import { AlertTriangle, Activity, Pill, Stethoscope, Info, AlertCircle, Calendar, Plus } from "lucide-react";
import { ClinicalSummary } from "@/lib/mappers/medical-records-mapper";

// --- Atomic Components ---

const ActiveDiagnosisCard = ({ primaryDiagnosis }: { primaryDiagnosis: any | null }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope className="text-blue-600 w-5 h-5" />
        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
          Diagnosis Aktif (Utama)
        </h3>
      </div>
      
      {!primaryDiagnosis ? (
        <p className="text-gray-500 italic text-sm mt-auto mb-auto" style={{ fontFamily: "var(--font-jakarta)" }}>
          Tidak ada diagnosis aktif.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2" style={{ fontFamily: "var(--font-jakarta)" }}>
          <span 
            className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm font-medium border border-blue-100"
            title={`${primaryDiagnosis.codeIcd10 || primaryDiagnosis.code || ''}`}
          >
            {primaryDiagnosis.display || primaryDiagnosis.name || primaryDiagnosis.codeIcd10 || 'Diagnosis Tidak Diketahui'}
          </span>
        </div>
      )}
    </div>
  );
};

const LatestVitalsCard = ({ vitals }: { vitals: any | null }) => {
  if (!vitals) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
         <div className="flex items-center gap-2 mb-4">
          <Activity className="text-teal-600 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
            Pengukuran Fisik
          </h3>
        </div>
        <p className="text-gray-500 italic text-sm mt-auto mb-auto" style={{ fontFamily: "var(--font-jakarta)" }}>
          Data pengukuran fisik belum dicatat.
        </p>
      </div>
    );
  }

  const formattedDate = vitals.createdAt ? new Date(vitals.createdAt).toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'short', year: 'numeric' 
  }) : '';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-teal-600 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
            Pengukuran Fisik
          </h3>
        </div>
        {formattedDate && (
          <span className="text-xs text-gray-500 flex items-center gap-1" style={{ fontFamily: "var(--font-jakarta)" }}>
            <Calendar className="w-3 h-3" />
            (Per {formattedDate})
          </span>
        )}
      </div>

      <h4 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
        Tanda Vital
      </h4>
      <div className="grid grid-cols-2 gap-4" style={{ fontFamily: "var(--font-jakarta)" }}>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Tekanan Darah</p>
          <p className="font-semibold text-gray-900">{vitals.systolic && vitals.diastolic ? `${vitals.systolic}/${vitals.diastolic}` : '-'} <span className="text-xs font-normal text-gray-500">mmHg</span></p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Nadi</p>
          <p className="font-semibold text-gray-900">{vitals.heartRate || '-'} <span className="text-xs font-normal text-gray-500">x/mnt</span></p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Suhu</p>
          <p className="font-semibold text-gray-900">{vitals.temperature || '-'} <span className="text-xs font-normal text-gray-500">°C</span></p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Pernapasan</p>
          <p className="font-semibold text-gray-900">{vitals.respiratoryRate || '-'} <span className="text-xs font-normal text-gray-500">x/mnt</span></p>
        </div>
      </div>

      {(vitals.weight || vitals.height) && (
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
            {vitals.weight && vitals.height && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EFF6FF] border border-blue-100 rounded-lg text-sm text-blue-900 shadow-sm">
                <span className="text-blue-600 font-bold">BMI:</span>
                <span className="font-normal">{(Number(vitals.weight) / Math.pow(Number(vitals.height) / 100, 2)).toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Tab Component ---

interface Props {
  data?: ClinicalSummary;
}

export default function ClinicalSummaryTab({ data }: Props) {
  // Variabel untuk mengecek apakah tidak ada data sama sekali
  const hasNoData = !data?.latestVitals && !data?.primaryDiagnosis;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
      <div className="col-span-1 lg:col-span-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
          Ringkasan Klinis
        </h2>
        
        {/* Render 2 Kartu (Akan menunjukkan 'kosong' jika tidak ada data) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActiveDiagnosisCard primaryDiagnosis={data?.primaryDiagnosis} />
          <LatestVitalsCard vitals={data?.latestVitals} />
        </div>

        {/* --- UI EMPTY STATE + TOMBOL --- */}
        {hasNoData && (
          <div className="mt-8 flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
              Belum Ada Rekam Medis
            </h3>
            <p className="text-slate-500 mb-6 max-w-md text-sm leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
              Mulai pencatatan SOAP pertama untuk pasien ini dengan membuat asesmen baru.
            </p>
            <button 
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-sm hover:shadow-md"
              style={{ fontFamily: "var(--font-poppins)" }}
              onClick={() => console.log("Arahkan ke form SOAP baru!")}
            >
              <Plus className="w-5 h-5" />
              <span>Buat Asesmen Pertama</span>
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}