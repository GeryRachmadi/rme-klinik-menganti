'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import ChipsInput from './ChipsInput';

export interface AssessmentFormValues {
  penyakit: string[];
  alergi: string[];
  obat: string[];
  catatanPenyakit: string;
  catatanAlergi: string;
  catatanObat: string;
  tidakAdaPenyakit: boolean;
  tidakAdaAlergi: boolean;
  tidakAdaObat: boolean;
}

interface AssessmentFormProps {
  defaultValues?: Partial<AssessmentFormValues>;
}

// DUMMY DATA REKOMENDASI (Nanti diganti API ICD-10 / Master Obat)
const SUGGESTIONS_PENYAKIT = [
  "Hipertensi", "Diabetes Melitus Tipe 2", "Maag (Dispepsia)", "Radang Tenggorokan (Faringitis)", 
  "Asma", "Asam Urat (Gout)", "Kolesterol Tinggi", "Tuberkulosis (TBC)", "ISPA", "Diare"
];

const SUGGESTIONS_ALERGI = [
  "Amoxicillin", "Paracetamol", "Ibuprofen", "Seafood / Makanan Laut", 
  "Kacang-kacangan", "Telur", "Debu", "Cuaca Dingin", "Susu Sapi", "Penisilin"
];

const SUGGESTIONS_OBAT = [
  "Paracetamol", "Amoxicillin", "Metformin", "Amlodipine", "Simvastatin", 
  "Omeprazole", "Lansoprazole", "Ibuprofen", "Captopril", "Antasida"
];

export default function AssessmentForm({ defaultValues }: AssessmentFormProps) {
  const [alergiSeverity, setAlergiSeverity] = useState("Sedang");
  const [obatDosage, setObatDosage] = useState("");

  const { control, handleSubmit, register, watch, setValue } = useForm<AssessmentFormValues>({
    defaultValues: {
      penyakit: defaultValues?.penyakit || [],
      alergi: defaultValues?.alergi || [],
      obat: defaultValues?.obat || [],
      catatanPenyakit: defaultValues?.catatanPenyakit || '',
      catatanAlergi: defaultValues?.catatanAlergi || '',
      catatanObat: defaultValues?.catatanObat || '',
      tidakAdaPenyakit: false,
      tidakAdaAlergi: false,
      tidakAdaObat: false,
    },
  });

  const isPenyakitNull = watch("tidakAdaPenyakit");
  const isAlergiNull = watch("tidakAdaAlergi");
  const isObatNull = watch("tidakAdaObat");

  const onSubmitForm = (data: AssessmentFormValues) => {
    console.log("Form Data:", data);
    alert("Data tersimpan di console! Silakan cek.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="w-full font-jakarta">
      <h2 
        className="mb-5 text-[22px] font-bold text-[#0F766E] uppercase tracking-wide font-poppins"
        style={{ WebkitTextStroke: '0.4px #0F766E' }}
      >
        Kajian Awal Keperawatan
      </h2>
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
        <div className="flex flex-col gap-10">
          
          {/* SECTION: PENYAKIT */}
          <div className="flex flex-col">
            <h3 
              className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins mb-3"
              style={{ WebkitTextStroke: '0.2px #0F766E' }}
            >
              Riwayat Penyakit Terdahulu
            </h3>
            <Controller
              name="penyakit"
              control={control}
              render={({ field }) => (
                <ChipsInput
                  addLabel="Riwayat"
                  value={field.value}
                  suggestions={SUGGESTIONS_PENYAKIT}
                  disabled={isPenyakitNull}
                  negationLabel="Pasien menyangkal ada riwayat penyakit"
                  negationChecked={isPenyakitNull}
                  onNegationChange={(checked) => {
                    setValue("tidakAdaPenyakit", checked);
                    if (checked) {
                      setValue("penyakit", []);
                      setValue("catatanPenyakit", "");
                    }
                  }}
                  onChange={(newVal) => {
                    field.onChange(newVal);
                    if (newVal.length > 0) setValue("tidakAdaPenyakit", false);
                  }}
                  placeholder="Contoh: Maag, Radang Tenggorokan"
                />
              )}
            />
            <textarea 
              {...register("catatanPenyakit")} 
              disabled={isPenyakitNull}
              placeholder={isPenyakitNull ? "Tidak ada catatan" : "Tambahkan catatan disini..."} 
              className={`w-full mt-2 border rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] min-h-[90px] transition-colors
                ${isPenyakitNull ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#F9FAFB] border-gray-200 text-gray-900 placeholder-gray-400'}`} 
            />
          </div>

          {/* SECTION: ALERGI */}
          <div className="flex flex-col">
            <h3 
              className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins mb-3"
              style={{ WebkitTextStroke: '0.2px #0F766E' }}
            >
              Riwayat Alergi
            </h3>
            <Controller
              name="alergi"
              control={control}
              render={({ field }) => (
                <ChipsInput
                  addLabel="Riwayat"
                  value={field.value}
                  suggestions={SUGGESTIONS_ALERGI}
                  disabled={isAlergiNull}
                  negationLabel="No Known Allergies (NKA)"
                  negationChecked={isAlergiNull}
                  onNegationChange={(checked) => {
                    setValue("tidakAdaAlergi", checked);
                    if (checked) {
                      setValue("alergi", []);
                      setValue("catatanAlergi", "");
                    }
                  }}
                  onChange={(newVal) => {
                    field.onChange(newVal);
                    if (newVal.length > 0) setValue("tidakAdaAlergi", false);
                  }}
                  placeholder="Contoh: Amoxicillin"
                  extraInputNode={
                    <select 
                      value={alergiSeverity} 
                      onChange={(e) => setAlergiSeverity(e.target.value)} 
                      disabled={isAlergiNull}
                      className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] bg-white disabled:bg-gray-100"
                    >
                      <option>Tinggi</option>
                      <option>Sedang</option>
                      <option>Rendah</option>
                    </select>
                  }
                  formatOnAdd={(val) => `${val} (${alergiSeverity})`}
                  getChipColor={(chip) => 
                    chip.includes('Tinggi') ? 'bg-red-50 border-red-200 text-red-800' : 
                    chip.includes('Sedang') ? 'bg-orange-50 border-orange-200 text-orange-800' : 
                    chip.includes('Rendah') ? 'bg-blue-50 border-blue-200 text-blue-800' : 
                    'bg-[#E6F5F4] border-[#B2DFDB] text-[#0F766E]'
                  }
                />
              )}
            />
            <textarea 
              {...register("catatanAlergi")} 
              disabled={isAlergiNull}
              placeholder={isAlergiNull ? "Tidak ada catatan" : "Tambahkan catatan disini..."} 
              className={`w-full mt-2 border rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] min-h-[90px] transition-colors
                ${isAlergiNull ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#F9FAFB] border-gray-200 text-gray-900 placeholder-gray-400'}`} 
            />
          </div>

          {/* SECTION: OBAT */}
          <div className="flex flex-col">
            <h3 
              className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins mb-3"
              style={{ WebkitTextStroke: '0.2px #0F766E' }}
            >
              Pengobatan Rutin
            </h3>
            <Controller
              name="obat"
              control={control}
              render={({ field }) => (
                <ChipsInput
                  addLabel="Riwayat"
                  value={field.value}
                  suggestions={SUGGESTIONS_OBAT}
                  disabled={isObatNull}
                  negationLabel="Tidak ada pengobatan rutin"
                  negationChecked={isObatNull}
                  onNegationChange={(checked) => {
                    setValue("tidakAdaObat", checked);
                    if (checked) {
                      setValue("obat", []);
                      setValue("catatanObat", "");
                    }
                  }}
                  onChange={(newVal) => {
                    field.onChange(newVal);
                    if (newVal.length > 0) setValue("tidakAdaObat", false);
                  }}
                  placeholder="Contoh: Paracetamol"
                  extraInputNode={
                    <input 
                      type="text" 
                      value={obatDosage} 
                      onChange={(e) => setObatDosage(e.target.value)} 
                      placeholder="Dosis (opsional)" 
                      disabled={isObatNull}
                      className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] w-36 disabled:bg-gray-100" 
                    />
                  }
                  formatOnAdd={(val) => obatDosage ? `${val} (${obatDosage})` : val}
                />
              )}
            />
            <textarea 
              {...register("catatanObat")} 
              disabled={isObatNull}
              placeholder={isObatNull ? "Tidak ada catatan" : "Tambahkan catatan disini..."} 
              className={`w-full mt-2 border rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] min-h-[90px] transition-colors
                ${isObatNull ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#F9FAFB] border-gray-200 text-gray-900 placeholder-gray-400'}`} 
            />
          </div>

        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8 mb-10">
        <button type="button" className="px-8 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm">
          Batal
        </button>
        <button type="submit" className="px-8 py-2.5 bg-[#0F766E] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm">
          Simpan
        </button>
      </div>
    </form>
  );
}