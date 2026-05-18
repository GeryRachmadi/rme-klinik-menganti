"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, CheckCircle2, Loader2, User, X } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";

const encounterEditSchema = z.object({
  priority: z.enum(["STABIL", "CUKUP_BERISIKO", "BERISIKO", "BERISIKO_TINGGI"], {
    error: "Prioritas wajib dipilih.",
  }),
  practitionerId: z.string().min(1, "Dokter wajib dipilih."),
  reasonCode: z
    .string()
    .trim()
    .min(1, "Keluhan Utama wajib diisi.")
    .max(500, "Keluhan Utama maksimal 500 karakter."),
  patientType: z.enum(["UMUM", "BPJS"], { error: "Jenis Pasien wajib dipilih." }),
});

type EncounterEditFormData = z.infer<typeof encounterEditSchema>;

interface EncounterEditDrawerProps {
  encounterId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

export default function EncounterEditDrawer({
  encounterId,
  isOpen,
  onClose,
  onUpdated,
}: EncounterEditDrawerProps) {
  const [rendered, setRendered] = useState(false);
  const [encounter, setEncounter] = useState<any>(null);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      4000
    );
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EncounterEditFormData>({
    resolver: zodResolver(encounterEditSchema),
    defaultValues: {
      priority: undefined,
      practitionerId: "",
      reasonCode: "",
      patientType: "UMUM",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
    } else {
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !encounterId) return;

    setIsLoadingDetail(true);
    setIsLoadingDoctors(true);

    Promise.all([
      fetch(`/api/encounters/${encounterId}`).then((r) => r.json()),
      fetch("/api/accounts?role=DOKTER").then((r) => r.json()),
    ])
      .then(([encJson, docJson]) => {
        if (encJson.success) {
          setEncounter(encJson.data);
          reset({
            priority: encJson.data.priority,
            practitionerId: encJson.data.practitionerId ?? "",
            reasonCode: encJson.data.reasonCode ?? "",
            patientType: encJson.data.patientType,
          });
        }
        const list =
          docJson.data?.accounts ||
          docJson.data ||
          docJson.accounts ||
          (Array.isArray(docJson) ? docJson : []);
        if (Array.isArray(list)) {
          setPractitioners(
            list.filter((a: any) => a.practitioner).map((a: any) => a.practitioner)
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingDetail(false);
        setIsLoadingDoctors(false);
      });
  }, [isOpen, encounterId, reset]);

  useEffect(() => {
    if (!isOpen) {
      setEncounter(null);
      reset();
      setToast((t) => ({ ...t, visible: false }));
      if (toastTimer.current) clearTimeout(toastTimer.current);
    }
  }, [isOpen, reset]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  if (!rendered) return null;

  const inputBase =
    "w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-300 outline-none focus:bg-white focus:border-[#2BB5A0] transition-colors";

  const onSubmit = async (data: EncounterEditFormData) => {
    if (!encounterId) return;
    try {
      const res = await fetch(`/api/encounters/${encounterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error ?? "Gagal menyimpan perubahan.", "error");
        return;
      }
      await onUpdated();
      showToast("Data kunjungan berhasil diperbarui.", "success");
      setTimeout(() => onClose(), 1500);
    } catch {
      showToast("Terjadi kesalahan tidak terduga.", "error");
    }
  };

  const patient = encounter?.patient;
  const age = patient
    ? Math.floor((Date.now() - new Date(patient.tanggalLahir).getTime()) / 3.15576e10)
    : null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={isSubmitting ? undefined : onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2
              className="text-xl font-bold text-gray-800 leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Edit Kunjungan
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              Ubah informasi kunjungan pasien yang dipilih
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors mt-0.5 disabled:opacity-50"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-20 gap-2 text-sm text-gray-400">
              <Loader2 size={18} className="animate-spin" /> Memuat data kunjungan...
            </div>
          ) : (
            <form id="encounter-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Patient info (read-only) */}
              {patient && (
                <div className="space-y-4">
                  <SectionTitle>INFORMASI PASIEN</SectionTitle>
                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-[#E6F5F4] border-[#4DD9C0]/50">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg bg-[#2BB5A0] text-white flex-shrink-0">
                      {patient.namaLengkap.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#009E95]">{patient.namaLengkap}</p>
                      <p className="text-xs text-[#2BB5A0] mt-0.5">
                        {patient.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"} •{" "}
                        {age} thn
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs px-2 py-1 rounded-md font-medium bg-white text-[#2BB5A0] border border-[#2BB5A0]/20">
                          RM: {patient.noRm}
                        </span>
                        <span className="text-xs text-[#2BB5A0]">NIK: {patient.nik}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable fields */}
              <div className="space-y-6 pt-4 border-t border-gray-100">
                <SectionTitle>DETAIL KUNJUNGAN</SectionTitle>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Prioritas */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Prioritas Pasien <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <>
                          <div className="relative">
                            <select
                              {...field}
                              value={field.value || ""}
                              className={`${inputBase} appearance-none cursor-pointer ${
                                errors.priority ? "border-red-500" : ""
                              }`}
                            >
                              <option value="" disabled>Pilih prioritas...</option>
                              <option value="STABIL">Stabil</option>
                              <option value="CUKUP_BERISIKO">Cukup Berisiko</option>
                              <option value="BERISIKO">Berisiko</option>
                              <option value="BERISIKO_TINGGI">Berisiko Tinggi</option>
                            </select>
                            <ChevronDown
                              size={15}
                              strokeWidth={2}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                          </div>
                          {errors.priority && (
                            <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  {/* Jenis Pasien */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Jenis Pasien <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="patientType"
                      control={control}
                      render={({ field }) => (
                        <div className="flex gap-3 h-[42px]">
                          <label
                            onClick={() => field.onChange("UMUM")}
                            className={`flex-1 flex items-center justify-center border rounded-xl cursor-pointer transition-colors text-sm font-semibold ${
                              field.value === "UMUM"
                                ? "bg-[#E6F5F4] border-[#2BB5A0] text-[#009E95]"
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            Umum
                          </label>
                          <label
                            onClick={() => field.onChange("BPJS")}
                            className={`flex-1 flex items-center justify-center border rounded-xl cursor-pointer transition-colors text-sm font-semibold ${
                              field.value === "BPJS"
                                ? "bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            BPJS Kesehatan
                          </label>
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* Dokter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Dokter <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="practitionerId"
                    control={control}
                    render={({ field }) => (
                      <>
                        <div className="relative">
                          <User
                            size={15}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                            strokeWidth={2}
                          />
                          <select
                            {...field}
                            disabled={isLoadingDoctors}
                            className={`${inputBase} pl-10 appearance-none cursor-pointer ${
                              errors.practitionerId ? "border-red-500" : ""
                            }`}
                          >
                            <option value="" disabled>
                              {isLoadingDoctors
                                ? "Memuat dokter..."
                                : practitioners.length === 0
                                ? "Tidak ada dokter tersedia"
                                : "Pilih Dokter..."}
                            </option>
                            {practitioners.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={15}
                            strokeWidth={2}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>
                        {errors.practitionerId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.practitionerId.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                {/* Keluhan Utama */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Keluhan Utama <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="reasonCode"
                    control={control}
                    render={({ field }) => (
                      <>
                        <textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Deskripsikan keluhan utama pasien..."
                          rows={3}
                          autoComplete="off"
                          className={`${inputBase} resize-none ${
                            errors.reasonCode ? "border-red-500" : ""
                          }`}
                        />
                        {errors.reasonCode && (
                          <p className="text-red-500 text-xs mt-1">{errors.reasonCode.message}</p>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-5 flex justify-end gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="encounter-edit-form"
            disabled={isSubmitting || isLoadingDetail}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#2BB5A0" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-white rounded-2xl shadow-lg px-5 py-3.5 border ${
            toast.type === "error" ? "border-red-200" : "border-green-200"
          }`}
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {toast.type === "error" ? (
            <X size={18} strokeWidth={2} className="text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={18} strokeWidth={2} className="text-green-500 flex-shrink-0" />
          )}
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </div>
      )}
    </>
  );
}
