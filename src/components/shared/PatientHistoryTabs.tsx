"use client";

import { useState } from "react";
import Tabs, { type TabItem } from "./Tabs";
import type { Patient } from "@/generated/prisma";

// Import sudah disesuaikan dengan nama file baru
import PatientProfileTab from "@/app/riwayat-medis/[noRm]/components/PatientProfileTab";
import EncounterHistoryTab from "@/app/riwayat-medis/[noRm]/components/EncounterHistoryTab";
import ClinicalSummaryTab from "@/app/riwayat-medis/[noRm]/components/ClinicalSummaryTab";
import ConditionTab from "@/app/riwayat-medis/[noRm]/components/ConditionTab";
import AllergyHistoryTab from "@/app/riwayat-medis/[noRm]/components/AllergyHistoryTab";
import MedicationTab from "@/app/riwayat-medis/[noRm]/components/MedicationTab";

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
          <ClinicalSummaryTab />
        )}

        {/* Pemanggilan komponen disesuaikan dengan nama baru */}
        {activeTab === "profil" && (
          <PatientProfileTab patient={patient} />
        )}

        {activeTab === "riwayat-kunjungan" && (
          <EncounterHistoryTab />
        )}

        {activeTab === "kondisi" && (
          <ConditionTab />
        )}

        {activeTab === "riwayat-alergi" && (
          <AllergyHistoryTab />
        )}

        {activeTab === "pengobatan-rutin" && (
          <MedicationTab />
        )}
      </div>
    </div>
  );
}