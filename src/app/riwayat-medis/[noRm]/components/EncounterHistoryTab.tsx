'use client';

import React, { useState } from 'react';
import { MappedEncounter } from '@/lib/mappers/medical-records-mapper';
import { ChevronDown, Activity, Heart, Thermometer, Wind, FileX, Plus } from 'lucide-react';

const TimelineSkeleton = () => {
  const heights = ['h-24', 'h-32', 'h-48'];
  
  return (
    <div className="relative pl-7 sm:pl-10 py-6">
      <div className="absolute left-[11px] sm:left-[19px] top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <div className="space-y-8">
        {heights.map((h, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[28px] sm:-left-[40px] mt-1.5 w-4 h-4 rounded-full bg-gray-200 animate-pulse"></div>
            <div className={`w-full bg-gray-100 rounded-2xl animate-pulse ${h}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EncounterCard = ({ encounter, index, defaultExpanded = false }: { encounter: MappedEncounter; index: number; defaultExpanded?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isLatest = index === 0;
  
  const dateObj = encounter.date ? new Date(encounter.date) : new Date();
  const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  return (
    <div className="relative">
      {/* Timeline Dot */}
      <div className={`absolute -left-[32px] sm:-left-[44px] mt-5 w-4 h-4 rounded-full border-4 border-white shadow-sm box-content ${isLatest ? 'bg-teal-700' : 'bg-gray-300'}`}></div>
      
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Header / Collapsed State */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left p-5 focus:outline-none"
          aria-expanded={isExpanded}
        >
          <div className="flex flex-row items-center gap-4 border-b border-gray-100 pb-4 mb-4">
            {/* Left section: Date Box */}
            <div className="border border-gray-200 rounded-xl flex flex-col items-center justify-center w-14 py-1.5 flex-shrink-0 bg-gray-50/30 shadow-sm" style={{ fontFamily: "var(--font-poppins)" }}>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {dateObj.toLocaleDateString('id-ID', { month: 'short' }).replace('.', '')}
              </span>
              <span className="text-xl font-extrabold text-teal-900 leading-none my-0.5">
                {dateObj.getDate()}
              </span>
              <span className="text-[10px] font-medium text-gray-400">
                {dateObj.getFullYear()}
              </span>
            </div>

            {/* Middle section: Title & Subtitle */}
            <div className="flex-grow flex flex-col justify-center">
              <div className="font-bold text-lg text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                Kunjungan
              </div>
              <div className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                {encounter.practitionerName || 'Dokter Tidak Diketahui'} &mdash; {timeStr}
              </div>
            </div>

            {/* Right section: Badge & Chevron */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span 
                className={`hidden sm:inline-block text-xs font-bold uppercase px-3 py-1 rounded-full ${
                  encounter.status?.toLowerCase() === 'finished' ? 'bg-green-100 text-green-800' : 'bg-teal-100 text-teal-800'
                }`}
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                {encounter.status || 'RAWAT JALAN'}
              </span>
              <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors">
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
          
          {/* Sneak peek / Collapsed preview text */}
          {!isExpanded && (
            <div className="text-sm text-gray-500 line-clamp-1 px-1" style={{ fontFamily: "var(--font-jakarta)" }}>
              Diagnosis Utama: {encounter.primaryDiagnosis || 'Belum ada diagnosis'}
            </div>
          )}
        </button>

        {/* Expanded Content */}
        <div 
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="p-5 pt-0">
               <div className="text-sm text-gray-700" style={{ fontFamily: "var(--font-jakarta)" }}>
                 <p><strong>Diagnosis Utama:</strong> {encounter.primaryDiagnosis || 'Belum ada diagnosis'}</p>
                 <p><strong>Status:</strong> {encounter.status || '-'}</p>
                 <p className="mt-2 text-gray-500 italic">Rincian rekam medis lengkap belum diimplementasikan untuk data mapping saat ini.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Props {
  data?: MappedEncounter[];
}

export default function EncounterHistoryTab({ data }: Props) {
  return (
    <div className="w-full py-2">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>Riwayat Kunjungan</h2>
          <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "var(--font-jakarta)" }}>Daftar riwayat kunjungan dan rekam medis pasien</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            disabled 
            title="Available in upcoming update"
            className="opacity-50 cursor-not-allowed inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 h-[44px] min-w-[44px]"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Filter by Year
          </button>
          <button 
            disabled 
            title="Available in upcoming update"
            className="opacity-50 cursor-not-allowed inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 h-[44px] min-w-[44px]"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Filter by Poli
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 border border-slate-200 rounded-3xl mt-4">
          <div className="bg-white w-16 h-16 flex items-center justify-center rounded-full shadow-sm border border-slate-100 mb-5">
            <FileX className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
            Belum Ada Riwayat Kunjungan
          </h3>
          <p className="text-slate-500 mb-6 max-w-md text-sm leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
            Pasien belum memiliki riwayat kunjungan atau rekam medis di sistem. Silakan buat asesmen baru untuk memulai pencatatan SOAP.
          </p>
          <button 
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-sm hover:shadow-md"
            style={{ fontFamily: "var(--font-poppins)" }}
            onClick={() => console.log("Arahkan ke form SOAP baru!")}
          >
            Buat Asesmen Pertama
          </button>
        </div>
      ) : (
        <div className="relative pl-7 sm:pl-10 py-2">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[11px] sm:left-[19px] top-6 bottom-6 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {data.map((encounter, index) => (
              <EncounterCard key={index} encounter={encounter} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}