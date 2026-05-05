'use client';

import React, { useState } from 'react';
import { dummyEncounters, Encounter } from '@/lib/dummy-data/encounters';
import { ChevronDown, Activity, Heart, Thermometer, Wind } from 'lucide-react';

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

const EncounterCard = ({ encounter, index }: { encounter: Encounter; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mr = encounter.medicalRecord;
  const vitals = mr?.vitalSigns;
  const isLatest = index === 0;
  
  const dateObj = new Date(encounter.date);
  const monthStr = dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
  const dateNum = dateObj.toLocaleDateString('id-ID', { day: 'numeric' });
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
          aria-controls={`encounter-content-${encounter.id}`}
        >
          <div className="flex flex-row items-center gap-4 border-b border-gray-100 pb-4 mb-4">
            {/* Left section: Date Box */}
            <div className="border border-gray-200 rounded-xl flex flex-col items-center justify-center w-14 py-1.5 flex-shrink-0 bg-gray-50/30 shadow-sm" style={{ fontFamily: "var(--font-poppins)" }}>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {new Date(encounter.date).toLocaleDateString('id-ID', { month: 'short' }).replace('.', '')}
              </span>
              <span className="text-xl font-extrabold text-teal-900 leading-none my-0.5">
                {new Date(encounter.date).getDate()}
              </span>
              <span className="text-[10px] font-medium text-gray-400">
                {new Date(encounter.date).getFullYear()}
              </span>
            </div>

            {/* Middle section: Title & Subtitle */}
            <div className="flex-grow flex flex-col justify-center">
              <div className="font-bold text-lg text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                {encounter.clinic}
              </div>
              <div className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                {encounter.doctor.name} &mdash; {timeStr}
              </div>
            </div>

            {/* Right section: Badge & Chevron */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span 
                className="hidden sm:inline-block bg-teal-100 text-teal-800 text-xs font-bold uppercase px-3 py-1 rounded-full"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                RAWAT JALAN
              </span>
              <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors">
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
          
          {/* Sneak peek / Collapsed preview text (optional, but good for empty state) */}
          {!isExpanded && (
            <div className="text-sm text-gray-500 line-clamp-1 px-1" style={{ fontFamily: "var(--font-jakarta)" }}>
              {mr ? mr.assessment : 'Data rekam medis belum tersedia.'}
            </div>
          )}
        </button>

        {/* Expanded Content */}
        <div 
          id={`encounter-content-${encounter.id}`}
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="p-5 pt-0">
              {mr ? (
                <div className="flex flex-col gap-6">
                  {/* Subjective */}
                  <div>
                    <h4 className="text-teal-700 font-bold text-sm uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
                      Subjective
                    </h4>
                    <p className="text-sm text-gray-900 whitespace-pre-line leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {mr.subjective}
                    </p>
                  </div>

                  {/* Objective */}
                  <div>
                    <h4 className="text-teal-700 font-bold text-sm uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
                      Objective
                    </h4>
                    
                    {/* Vitals Dashboard Grid */}
                    {vitals && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* TD */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50 text-red-500">
                            <Activity className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500 font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>Tekanan Darah</span>
                            <div className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                              {vitals.bloodPressure} <span className="text-sm font-normal text-gray-500">mmHg</span>
                            </div>
                          </div>
                        </div>

                        {/* Nadi */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50 text-green-500">
                            <Heart className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500 font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>Nadi</span>
                            <div className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                              {vitals.heartRate} <span className="text-sm font-normal text-gray-500">bpm</span>
                            </div>
                          </div>
                        </div>

                        {/* Suhu */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-50 text-orange-500">
                            <Thermometer className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500 font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>Suhu</span>
                            <div className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                              {vitals.temperature} <span className="text-sm font-normal text-gray-500">°C</span>
                            </div>
                          </div>
                        </div>

                        {/* Napas */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-500">
                            <Wind className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500 font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>Napas</span>
                            <div className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                              {vitals.respiratoryRate} <span className="text-sm font-normal text-gray-500">/mnt</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Anthropometry / BMI */}
                    {vitals && (vitals.weight || vitals.height) && (
                      <div className="flex flex-wrap gap-3 mt-3 mb-4" style={{ fontFamily: "var(--font-jakarta)" }}>
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
                            <span className="font-normal">
                              {(vitals.weight / Math.pow(vitals.height / 100, 2)).toFixed(1)}
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Fisik Note */}
                    <div className="bg-gray-50 border-l-4 border-blue-400 p-3 rounded-r-lg text-sm" style={{ fontFamily: "var(--font-jakarta)" }}>
                      <span className="text-gray-500 mr-1">Fisik:</span>
                      <span className="font-bold text-gray-900 whitespace-pre-line">{mr.objective}</span>
                    </div>
                  </div>

                  {/* Assessment */}
                  <div>
                    <h4 className="text-teal-700 font-bold text-sm uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
                      Assessment
                    </h4>
                    <div className="bg-blue-50 rounded-xl p-4">
                      {mr.diagnoses.map((diag, idx) => (
                        <div key={idx} className="text-blue-600 font-semibold mb-1" style={{ fontFamily: "var(--font-poppins)" }}>
                          {diag.code} - {diag.name}
                        </div>
                      ))}
                      <div className="text-sm text-gray-600 mt-2" style={{ fontFamily: "var(--font-jakarta)" }}>
                        Catatan: {mr.assessment}
                      </div>
                    </div>
                  </div>

                  {/* Plan */}
                  <div>
                    <h4 className="text-teal-700 font-bold text-sm uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
                      Plan
                    </h4>
                    <div className="text-sm text-gray-900 whitespace-pre-line pl-4 leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {mr.plan.split('\n').map((line, idx) => (
                        <div key={idx} className="mb-1">{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic py-4" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Data Rekam Medis belum tersedia untuk kunjungan ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EncounterHistoryTab() {
  const [isLoading] = useState(false);

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
      {isLoading ? (
        <TimelineSkeleton />
      ) : (
        <div className="relative pl-7 sm:pl-10 py-2">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[11px] sm:left-[19px] top-6 bottom-6 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {dummyEncounters.map((encounter, index) => (
              <EncounterCard key={encounter.id} encounter={encounter} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}