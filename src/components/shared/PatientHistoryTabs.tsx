"use client";

import { useState } from "react";
import Tabs, { type TabItem } from "./Tabs";
import type { Patient } from "@/generated/prisma";

// Tab Components
import PatientProfileTab from "@/app/riwayat-medis/[noRm]/components/PatientProfileTab";
import EncounterHistoryTab from "@/app/riwayat-medis/[noRm]/components/EncounterHistoryTab";
import ClinicalSummaryTab from "@/app/riwayat-medis/[noRm]/components/ClinicalSummaryTab";
import ConditionTab from "@/app/riwayat-medis/[noRm]/components/ConditionTab";
import AllergyHistoryTab from "@/app/riwayat-medis/[noRm]/components/AllergyHistoryTab";
import MedicationTab from "@/app/riwayat-medis/[noRm]/components/MedicationTab";

// Empty State Component
import EmptyMedicalRecord from "@/app/riwayat-medis/[noRm]/components/EmptyMedicalRecord";

// Define props to include the new TR-54 requirements
interface PatientHistoryTabsProps {
  patient: Patient;
  hasMedicalRecord?: boolean; // TODO: Pass this dynamically from parent or database later
  userRole?: string;          // TODO: Pass the current user's role from session
}

export default function PatientHistoryTabs({ 
  patient, 
  hasMedicalRecord = false, // Set to false by default right now to test the Empty UI
  userRole = "dokter" 
}: PatientHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState("ringkasan");

  // UI Badge indicator for empty tabs
  const EmptyBadge = () => (
    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold uppercase tracking-wide">
      Kosong
    </span>
  );

  // Moved TABS array inside the component so it can react to `hasMedicalRecord` state
  const TABS: TabItem[] = [
    { id: "ringkasan",          label: "Ringkasan",         badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
    { id: "profil",             label: "Profil" },          // Profile tab never gets the "Kosong" badge
    { id: "riwayat-kunjungan",  label: "Riwayat Kunjungan", badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
    { id: "kondisi",            label: "Kondisi",           badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
    { id: "riwayat-alergi",     label: "Riwayat Alergi",    badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
    { id: "pengobatan-rutin",   label: "Pengobatan Rutin",  badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
  ];

  return (
    <div className="col-span-12 bg-white rounded-3xl overflow-hidden">
      <div className="px-8 pt-6">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="px-8 py-8">
        {/* ========================================= */}
        {/* 1. PROFILE TAB: Always render normally    */}
        {/* ========================================= */}
        {activeTab === "profil" && (
          <PatientProfileTab patient={patient} />
        )}

        {/* ========================================= */}
        {/* 2. EMPTY STATE: For non-profile tabs      */}
        {/* ========================================= */}
        {activeTab !== "profil" && !hasMedicalRecord && (
          <EmptyMedicalRecord userRole={userRole} />
        )}

        {/* ========================================= */}
        {/* 3. NORMAL STATE: Render if records exist  */}
        {/* ========================================= */}
        {activeTab === "ringkasan" && hasMedicalRecord && (
          <ClinicalSummaryTab />
        )}

        {activeTab === "riwayat-kunjungan" && hasMedicalRecord && (
          <EncounterHistoryTab />
        )}

        {activeTab === "kondisi" && hasMedicalRecord && (
          <ConditionTab />
        )}

        {activeTab === "riwayat-alergi" && hasMedicalRecord && (
          <AllergyHistoryTab />
        )}

        {activeTab === "pengobatan-rutin" && hasMedicalRecord && (
          <MedicationTab />
        )}
      </div>
    </div>
  );
}