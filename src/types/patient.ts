export type PatientStatus = "Aktif" | "Arsip";
export type JenisPasien = "UMUM" | "BPJS";

export interface Patient {
  id: string;
  namaLengkap: string;
  jenisKelamin: "Laki-laki" | "Perempuan";
  umur: number;
  nik: string;
  ihs?: string;
  noRm: string;
  noHp: string;
  jenisPasien: JenisPasien;
  status: PatientStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PatientListResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
