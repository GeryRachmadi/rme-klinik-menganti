'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ProcedureFormSchema, type ProcedureFormValues, type ProcedureItem } from '@/lib/schemas/procedure-schema';
import { transformProcedurePayload } from '@/lib/utils/transform-procedure';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { useFormToast } from '@/hooks/useFormToast';
import { PlanProcedureAutocomplete, type SelectedProcedure } from './PlanProcedureAutocomplete';
import { ICD9CMCheatsheetModal } from '@/components/shared/ICD9CMCheatsheetModal';

const getProcedureDraftKey = (encounterId: string) => `draft_procedure_${encounterId}`;

export interface PlanProcedureFormRef {
  submitForm: () => Promise<ProcedureItem[]>;
  resetForm: () => void;
  getValues: () => ProcedureFormValues;
}

interface PlanProcedureFormProps {
  encounterId: string;
  isReadOnly?: boolean;
  defaultValues?: Array<{ codeIcd9: string; display: string; notes: string }>;
  /** Validation error surfaced from the central PlanFormSchema (Tindakan is mandatory). */
  externalError?: string | null;
}

const PlanProcedureForm = forwardRef<PlanProcedureFormRef, PlanProcedureFormProps>(({
  encounterId,
  isReadOnly = false,
  defaultValues,
  externalError,
}, ref) => {
  const draftKey = getProcedureDraftKey(encounterId);
  const { toast, showWarning } = useFormToast();

  const {
    watch,
    setValue,
    reset,
    getValues,
    formState: { isDirty },
  } = useForm<ProcedureFormValues>({
    resolver: zodResolver(ProcedureFormSchema) as Resolver<ProcedureFormValues>,
    mode: 'onChange',
    defaultValues: {
      procedures: defaultValues ?? [],
      useManual: false,
      manualText: '',
      manualNote: '',
    },
  });

  useEffect(() => {
    if (isReadOnly) return;
    const saved = localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const { data } = JSON.parse(saved);
      if (data) {
        // Migrate legacy draft: codeCpt → codeIcd9 (TR-77 rename)
        if (Array.isArray(data.procedures)) {
          data.procedures = data.procedures.map((p: Record<string, unknown>) => ({
            ...p,
            codeIcd9: p.codeIcd9 ?? p.codeCpt ?? 'MANUAL',
          }));
        }
        reset(data);
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, reset, isReadOnly]);

  const procedures = watch('procedures') ?? [];

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const data = getValues();
      const hasManual = data.procedures.some(p => p.codeIcd9 === 'MANUAL');
      if (hasManual) {
        showWarning('⚠️ Terdapat tindakan manual yang disimpan tanpa validasi kode ICD-9-CM');
      }
      return transformProcedurePayload(data);
    },
    resetForm: () => {
      reset({ procedures: [], useManual: false, manualText: '', manualNote: '' });
    },
    getValues: () => getValues(),
  }));

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData, isReadOnly, isDirty);

  const [isICD9CMCheatsheetOpen, setIsICD9CMCheatsheetOpen] = useState(false);

  const handleProcedureChange = (proc: SelectedProcedure) => {
    const updated: ProcedureItem[] = [...procedures, {
      codeIcd9: proc.code,
      display: proc.display,
      notes: proc.notes || '',
    }];
    setValue('procedures', updated);
  };

  const handleRemoveProcedure = (index: number) => {
    const updated = procedures.filter((_, i) => i !== index);
    setValue('procedures', updated);
  };

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-top-5 duration-300 ${
          toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          toast.type === 'success' ? 'bg-[#E6F5F4] border border-[#B2DFDB]' :
          'bg-red-50 border border-red-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={20} strokeWidth={2} className="text-[#0F766E] flex-shrink-0" />
          ) : (
            <AlertCircle size={20} strokeWidth={2} className={
              toast.type === 'warning' ? 'text-yellow-600 flex-shrink-0' : 'text-red-500 flex-shrink-0'
            } />
          )}
          <span className={`font-medium text-sm ${
            toast.type === 'warning' ? 'text-yellow-700' :
            toast.type === 'success' ? 'text-[#0F766E]' :
            'text-red-600'
          }`}>
            {toast.text}
          </span>
        </div>
      )}

      <h3
        className="text-sm font-bold text-[#0F766E] uppercase tracking-wider mb-3"
        style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
      >
        Tindakan Medis
        <span className="text-red-500 ml-1" style={{ WebkitTextStroke: '0' }}>*</span>
      </h3>

      {/* Selected procedure chips */}
      {procedures.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(procedures || []).map((proc, index) => (
            <span
              key={`${proc.codeIcd9}-${proc.display}`}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-sm font-bold border ${
                proc.codeIcd9 === 'MANUAL'
                  ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                  : 'bg-[#F0FDFA] text-[#006B5F] border-[#14B8A6]'
              }`}
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              <span className="font-semibold">[{proc.codeIcd9 === 'MANUAL' ? 'Manual' : proc.codeIcd9}]</span>
              <span>–</span>
              <span>{proc.display}</span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveProcedure(index)}
                  aria-label="Hapus tindakan"
                  className="hover:bg-black/10 rounded-full p-0.5 ml-0.5 leading-none cursor-pointer"
                >
                  <span className="text-base leading-none">×</span>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {!isReadOnly && (
        <>
          <ICD9CMCheatsheetModal
            isOpen={isICD9CMCheatsheetOpen}
            onClose={() => setIsICD9CMCheatsheetOpen(false)}
            onSelect={(code, display, category) => {
              handleProcedureChange({ code, display, category: category ?? 'Lainnya', notes: '' });
              setIsICD9CMCheatsheetOpen(false);
            }}
          />
          <PlanProcedureAutocomplete
            onProcedureChange={handleProcedureChange}
          />
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => setIsICD9CMCheatsheetOpen(true)}
              className="text-sm px-3 py-1 rounded bg-[#0F766E] text-white hover:opacity-90 transition-opacity cursor-pointer"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Lihat Daftar Kode ICD-9-CM
            </button>
            <button
              type="button"
              onClick={() => setValue('procedures', [])}
              className="text-blue-500 hover:text-blue-700 underline cursor-pointer font-medium text-sm italic"
            >
              Kosongkan Input
            </button>
          </div>
        </>
      )}

      {externalError && <p className="text-red-500 text-[13px] mt-1.5">{externalError}</p>}
    </div>
  );
});

PlanProcedureForm.displayName = 'PlanProcedureForm';

export default PlanProcedureForm;
