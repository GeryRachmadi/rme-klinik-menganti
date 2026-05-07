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
}

interface AssessmentFormProps {
  defaultValues?: Partial<AssessmentFormValues>;
}

export default function AssessmentForm({ defaultValues }: AssessmentFormProps) {
  const [alergiSeverity, setAlergiSeverity] = useState("Sedang");
  const [obatDosage, setObatDosage] = useState("");

  const { control, handleSubmit, register } = useForm<AssessmentFormValues>({
    defaultValues: {
      penyakit: defaultValues?.penyakit || [],
      alergi: defaultValues?.alergi || [],
      obat: defaultValues?.obat || [],
      catatanPenyakit: defaultValues?.catatanPenyakit || '',
      catatanAlergi: defaultValues?.catatanAlergi || '',
      catatanObat: defaultValues?.catatanObat || '',
    },
  });

  const onSubmitForm = (data: AssessmentFormValues) => {
    console.log("Form Data:", data);
    alert("Data tersimpan di console!");
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="w-full font-jakarta">
      {/* HEADER IS OUTSIDE THE WHITE CARD */}
      <h2 className="mb-6 text-xl font-bold text-teal-800 uppercase tracking-wide font-poppins">
        Kajian Awal Keperawatan
      </h2>
      
      {/* THE MAIN WHITE CARD */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
        <div className="flex flex-col gap-10">
          
          {/* SECTION: PENYAKIT */}
          <div className="flex flex-col">
            <Controller
              name="penyakit"
              control={control}
              render={({ field }) => (
                <ChipsInput
                  label="Riwayat Penyakit Terdahulu"
                  addLabel="Riwayat"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Contoh: Maag, Radang Tenggorokan"
                />
              )}
            />
            <textarea {...register("catatanPenyakit")} placeholder="Tambahkan catatan disini..." className="w-full mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-y" />
          </div>

          <hr className="border-gray-100" />

          {/* SECTION: ALERGI */}
          <div className="flex flex-col">
            <Controller
              name="alergi"
              control={control}
              render={({ field }) => (
                <ChipsInput
                  label="Riwayat Alergi"
                  addLabel="Riwayat"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Contoh: Amoxicillin"
                  extraInputNode={
                    <select 
                      value={alergiSeverity} 
                      onChange={(e) => setAlergiSeverity(e.target.value)} 
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option>Tinggi</option>
                      <option>Sedang</option>
                      <option>Rendah</option>
                    </select>
                  }
                  formatOnAdd={(val) => `${val} (${alergiSeverity})`}
                  getChipColor={(chip) => 
                    chip.includes('Tinggi') ? 'bg-red-50 border border-red-200 text-red-800' : 
                    chip.includes('Sedang') ? 'bg-orange-50 border border-orange-200 text-orange-800' : 
                    chip.includes('Rendah') ? 'bg-blue-50 border border-blue-200 text-blue-800' : 
                    'bg-teal-50 border border-teal-200 text-teal-800'
                  }
                />
              )}
            />
            <textarea {...register("catatanAlergi")} placeholder="Tambahkan catatan disini..." className="w-full mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-y" />
          </div>

          <hr className="border-gray-100" />

          {/* SECTION: OBAT */}
          <div className="flex flex-col">
            <Controller
              name="obat"
              control={control}
              render={({ field }) => (
                <ChipsInput
                  label="Pengobatan Rutin"
                  addLabel="Riwayat"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Contoh: Paracetamol"
                  extraInputNode={
                    <input 
                      type="text" 
                      value={obatDosage} 
                      onChange={(e) => setObatDosage(e.target.value)} 
                      placeholder="Dosis (opsional)" 
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 w-36" 
                    />
                  }
                  formatOnAdd={(val) => obatDosage ? `${val} (${obatDosage})` : val}
                />
              )}
            />
            <textarea {...register("catatanObat")} placeholder="Tambahkan catatan disini..." className="w-full mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-y" />
          </div>

        </div>
      </div>

      {/* ACTION BUTTONS (OUTSIDE THE CARD) */}
      <div className="flex justify-end gap-4 mt-8">
        <button type="button" className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm">
          Batal
        </button>
        <button type="submit" className="px-8 py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm">
          Simpan
        </button>
      </div>
    </form>
  );
}
