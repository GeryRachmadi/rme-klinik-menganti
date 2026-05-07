"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Tabs, { type TabItem } from "./Tabs";
import type { Patient } from "@/generated/prisma";
import {
  ClinicalSummary,
  MappedCondition,
  MappedAllergy,
  MappedMedication,
  MappedEncounter
} from "@/lib/mappers/medical-records-mapper";

import PatientProfileTab from "@/app/riwayat-medis/[noRm]/components/PatientProfileTab";
import EncounterHistoryTab from "@/app/riwayat-medis/[noRm]/components/EncounterHistoryTab";
import ClinicalSummaryTab from "@/app/riwayat-medis/[noRm]/components/ClinicalSummaryTab";
import ConditionTab from "@/app/riwayat-medis/[noRm]/components/ConditionTab";
import AllergyHistoryTab from "@/app/riwayat-medis/[noRm]/components/AllergyHistoryTab";
import MedicationTab from "@/app/riwayat-medis/[noRm]/components/MedicationTab";
import EmptyMedicalRecord from "@/app/riwayat-medis/[noRm]/components/EmptyMedicalRecord";

interface PatientHistoryTabsProps {
  patient: Patient;
  hasMedicalRecord?: boolean;
  userRole?: string;
  clinicalSummary?: ClinicalSummary;
  conditions?: MappedCondition[];
  allergies?: MappedAllergy[];
  medications?: MappedMedication[];
  encounters?: MappedEncounter[];
}

export default function PatientHistoryTabs({
  patient,
  hasMedicalRecord = false,
  userRole = "DOKTER",
  clinicalSummary,
  conditions,
  allergies,
  medications,
  encounters
}: PatientHistoryTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("ringkasan");

  async function handleMulaiAsesmen() {
    const res = await fetch(`/api/patients/${patient.id}/active-encounter`);
    const data = await res.json();
    if (data.success) {
      router.push(`/rawat-jalan/${data.encounterId}/asesmen`);
    } else {
      throw new Error(
        data.message || "Pasien belum terdaftar hari ini."
      );
    }
  }

  const EmptyBadge = () => (
    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold uppercase tracking-wide">
      Kosong
    </span>
  );

  const TABS: TabItem[] = [
    { id: "ringkasan",         label: "Ringkasan",         badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
    { id: "profil",            label: "Profil" },
    { id: "riwayat-kunjungan", label: "Riwayat Kunjungan", badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
    { id: "kondisi",           label: "Kondisi",           badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
    { id: "riwayat-alergi",    label: "Riwayat Alergi",    badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
    { id: "pengobatan-rutin",  label: "Pengobatan Rutin",  badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
  ];

  return (
    <div className="col-span-12 bg-white rounded-3xl overflow-hidden">
      <div className="px-8 pt-6">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="px-8 py-8">
        {activeTab === "profil" && (
          <PatientProfileTab patient={patient} />
        )}

        {activeTab === "ringkasan" && !hasMedicalRecord && (
          <EmptyMedicalRecord
            userRole={userRole}
            onCreateEncounterClick={handleMulaiAsesmen}
          />
        )}

        {activeTab === "ringkasan" && hasMedicalRecord && (
          <ClinicalSummaryTab
            data={clinicalSummary}
            userRole={userRole}
            onCreateEncounterClick={handleMulaiAsesmen}
          />
        )}

        {activeTab === "riwayat-kunjungan" && (
          <EncounterHistoryTab data={encounters} />
        )}

        {activeTab === "kondisi" && (
          <ConditionTab data={conditions} />
        )}

        {activeTab === "riwayat-alergi" && (
          <AllergyHistoryTab data={allergies} />
        )}

        {activeTab === "pengobatan-rutin" && (
          <MedicationTab data={medications} />
        )}
      </div>
    </div>
  );
}
