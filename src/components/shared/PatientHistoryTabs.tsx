"use client";

import { useState } from "react";
import Tabs, { type TabItem } from "./Tabs";
import { User, Phone, MapPin, CreditCard, HeartPulse } from "lucide-react";
import type { Patient } from "@/generated/prisma";

const TABS: TabItem[] = [
  { id: "ringkasan",          label: "Ringkasan" },
  { id: "riwayat-kunjungan",  label: "Riwayat Kunjungan" },
  { id: "kondisi",            label: "Kondisi" },
  { id: "riwayat-alergi",     label: "Riwayat Alergi" },
  { id: "pengobatan-rutin",   label: "Pengobatan Rutin" },
];

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-xs font-semibold tracking-widest uppercase text-gray-400"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {label}
      </span>
      <span
        className="text-sm text-gray-700 font-medium"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {value || "-"}
      </span>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-6">
        <span className="text-[#2BB5A0]">{icon}</span>
        <h2
          className="text-base font-bold text-gray-800"
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">{children}</div>
    </div>
  );
}

function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

function calcAge(dob: Date | string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function genderLabel(g: string) {
  return g === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";
}

function maritalLabel(s: string) {
  const map: Record<string, string> = {
    BELUM_MENIKAH: "Belum Menikah",
    MENIKAH: "Menikah",
    CERAI_HIDUP: "Cerai Hidup",
    CERAI_MATI: "Cerai Mati",
  };
  return map[s] ?? s;
}

function agamaLabel(a: string) {
  const map: Record<string, string> = {
    ISLAM: "Islam",
    KRISTEN: "Kristen",
    KATOLIK: "Katolik",
    HINDU: "Hindu",
    BUDDHA: "Buddha",
    KHONGHUCU: "Khonghucu",
  };
  return map[a] ?? a;
}

function PlaceholderTab({ message }: { message: string }) {
  return (
    <div className="py-20 flex items-center justify-center">
      <p
        className="text-sm text-gray-300"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {message}
      </p>
    </div>
  );
}

export default function PatientHistoryTabs({ patient }: { patient: Patient }) {
  const [activeTab, setActiveTab] = useState("ringkasan");

  return (
    <div className="col-span-12 bg-white rounded-3xl overflow-hidden">
      <div className="px-8 pt-6">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="px-8 py-8">
        {activeTab === "ringkasan" && (
          <div className="space-y-10">
            <Section title="Identitas Pasien" icon={<User size={18} strokeWidth={2} />}>
              <DetailRow label="NIK"                 value={patient.nik} />
              <DetailRow label="IHS"                 value={patient.ihs} />
              <DetailRow label="Jenis Kelamin"       value={genderLabel(patient.jenisKelamin)} />
              <DetailRow label="Tempat Lahir"        value={patient.tempatLahir} />
              <DetailRow
                label="Tanggal Lahir"
                value={`${formatDate(patient.tanggalLahir)} (${calcAge(patient.tanggalLahir)} tahun)`}
              />
              <DetailRow label="Agama"               value={agamaLabel(patient.agama)} />
              <DetailRow label="Status Pernikahan"   value={maritalLabel(patient.statusPernikahan)} />
            </Section>

            <Section title="Alamat" icon={<MapPin size={18} strokeWidth={2} />}>
              <div className="col-span-2 sm:col-span-3">
                <DetailRow label="Alamat KTP" value={patient.alamatKtp} />
              </div>
              <DetailRow label="Desa / Kelurahan"   value={patient.desa} />
              <DetailRow label="Kecamatan"           value={patient.kecamatan} />
              <DetailRow label="Kabupaten / Kota"   value={patient.kabupatenKota} />
              <DetailRow label="Provinsi"            value={patient.provinsi} />
            </Section>

            <Section title="Kontak & Pekerjaan" icon={<Phone size={18} strokeWidth={2} />}>
              <DetailRow label="No. HP"     value={patient.noHp} />
              <DetailRow label="Pekerjaan"  value={patient.pekerjaan} />
              <DetailRow label="Perusahaan" value={patient.perusahaan} />
            </Section>

            {(patient.namaWali || patient.hubunganWali || patient.noHpWali) && (
              <Section
                title="Data Wali / Penanggung Jawab"
                icon={<HeartPulse size={18} strokeWidth={2} />}
              >
                <DetailRow label="Nama Wali"   value={patient.namaWali} />
                <DetailRow label="Hubungan"    value={patient.hubunganWali} />
                <DetailRow label="No. HP Wali" value={patient.noHpWali} />
              </Section>
            )}

            <Section title="Info Registrasi" icon={<CreditCard size={18} strokeWidth={2} />}>
              <DetailRow label="Terdaftar sejak"     value={formatDate(patient.createdAt)} />
              <DetailRow label="Terakhir diperbarui" value={formatDate(patient.updatedAt)} />
              <DetailRow label="Jenis Pasien"        value={patient.jenisPasien} />
            </Section>
          </div>
        )}

        {activeTab === "riwayat-kunjungan" && (
          <PlaceholderTab message="Riwayat kunjungan akan ditampilkan di sini — akan diimplementasi pada TR-51 s.d. TR-55." />
        )}

        {activeTab === "kondisi" && (
          <PlaceholderTab message="Data kondisi pasien akan ditampilkan di sini." />
        )}

        {activeTab === "riwayat-alergi" && (
          <PlaceholderTab message="Riwayat alergi pasien akan ditampilkan di sini." />
        )}

        {activeTab === "pengobatan-rutin" && (
          <PlaceholderTab message="Data pengobatan rutin pasien akan ditampilkan di sini." />
        )}
      </div>
    </div>
  );
}
