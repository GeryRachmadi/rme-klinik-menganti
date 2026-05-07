'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import ChipsInput from './ChipsInput';

export interface AssessmentFormValues {
  penyakit: string[];
  alergi: string[];
  obat: string[];
  catatan: string;
}

interface AssessmentFormProps {
  defaultValues?: Partial<AssessmentFormValues>;
  onSubmit: (data: AssessmentFormValues) => void;
}

export default function AssessmentForm({ defaultValues, onSubmit }: AssessmentFormProps) {
  const { control, handleSubmit, register } = useForm<AssessmentFormValues>({
    defaultValues: {
      penyakit: defaultValues?.penyakit || [],
      alergi: defaultValues?.alergi || [],
      obat: defaultValues?.obat || [],
      catatan: defaultValues?.catatan || '',
    },
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-bold text-gray-800">Kajian Awal Kunjungan</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form is just structure for now - fields added in next prompt */}
        
        {/* Example placeholder to ensure imports are used and structure is clear */}
        {/* 
        <Controller
          name="penyakit"
          control={control}
          render={({ field }) => (
            <ChipsInput
              label="Riwayat Penyakit"
              value={field.value}
              onChange={field.onChange}
              placeholder="Masukkan riwayat penyakit"
            />
          )}
        />
        */}
      </form>
    </div>
  );
}
