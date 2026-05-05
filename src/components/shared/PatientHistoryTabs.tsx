"use client";

import { useState } from "react";
import Tabs, { type TabItem } from "./Tabs";
import type { Patient } from "@/generated/prisma";

// Import komponen tab Profil yang barusan dibikin
import PatientProfileTabContent from "@/app/riwayat-medis/[noRm]/components/PatientProfileTabContent";
import EncounterHistoryTab from "@/app/riwayat-medis/[noRm]/components/EncounterHistoryTab";

const TABS: TabItem[] = [
  { id: "ringkasan",          label: "Ringkasan" },
  { id: "profil",             label: "Profil" },
  { id: "riwayat-kunjungan",  label: "Riwayat Kunjungan" },
  { id: "kondisi",            label: "Kondisi" },
  { id: "riwayat-alergi",     label: "Riwayat Alergi" },
  { id: "pengobatan-rutin",   label: "Pengobatan Rutin" },
];

function PlaceholderTab({ message }: { message: string }) {
  return (
    <div className="py-20 flex items-center justify-center">
      <p className="text-sm text-gray-300" style={{ fontFamily: "var(--font-jakarta)" }}>
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
          <PlaceholderTab message="Ringkasan klinis akan ditampilkan di sini." />
        )}

        {/* Cukup panggil 1 baris ini aja! Elegan banget kan? */}
        {activeTab === "profil" && (
          <PatientProfileTabContent patient={patient} />
        )}

        {activeTab === "riwayat-kunjungan" && (
          <EncounterHistoryTab />
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