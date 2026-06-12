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
  TimelineEncounter,
  RingkasanData
} from "@/lib/mappers/medical-records-mapper";

import PatientProfileTab from "@/app/riwayat-medis/[noRm]/components/PatientProfileTab";
import EncounterHistoryTab from "@/app/riwayat-medis/[noRm]/components/EncounterHistoryTab";
import RingkasanTab from "@/app/riwayat-medis/[noRm]/components/RingkasanTab";
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
  encounterTimeline?: TimelineEncounter[];
  ringkasan?: RingkasanData;
  conditionNote?: string | null;
  conditionNoteDate?: Date | string | null;
  allergyNote?: string | null;
  allergyNoteDate?: Date | string | null;
  medicationNote?: string | null;
  medicationNoteDate?: Date | string | null;
}

function EmptyBadge() {
  return (
    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold uppercase tracking-wide">
      Kosong
    </span>
  );
}

export default function PatientHistoryTabs({
  patient,
  hasMedicalRecord = false,
  userRole = "DOKTER",
  clinicalSummary,
  conditions,
  allergies,
  medications,
  encounterTimeline,
  ringkasan,
  conditionNote,
  conditionNoteDate,
  allergyNote,
  allergyNoteDate,
  medicationNote,
  medicationNoteDate
}: PatientHistoryTabsProps) {
  const router = useRouter();

  // Front desk (PENDAFTARAN) may only see demographic data — least-privilege /
  // medical privacy. Clinical tabs are withheld entirely.
  const isPendaftaran = (userRole ?? "").toUpperCase() === "PENDAFTARAN";

  const [activeTab, setActiveTab] = useState(isPendaftaran ? "profil" : "ringkasan");

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

  const TABS: TabItem[] = isPendaftaran
    ? [{ id: "profil", label: "Biodata" }]
    : [
        { id: "ringkasan",         label: "Kunjungan Terakhir", badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
        { id: "profil",            label: "Biodata" },
        { id: "riwayat-kunjungan", label: "CPPT",              badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
        { id: "riwayat-penyakit",  label: "Riwayat Penyakit",  badge: !hasMedicalRecord ? <EmptyBadge /> : undefined },
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

        {activeTab === "ringkasan" && hasMedicalRecord && ringkasan && (
          <RingkasanTab data={ringkasan} />
        )}

        {activeTab === "riwayat-kunjungan" && (
          <EncounterHistoryTab data={encounterTimeline} />
        )}

        {activeTab === "riwayat-penyakit" && (
          <ConditionTab data={conditions} sectionNote={conditionNote} sectionNoteDate={conditionNoteDate} />
        )}

        {activeTab === "riwayat-alergi" && (
          <AllergyHistoryTab data={allergies} sectionNote={allergyNote} sectionNoteDate={allergyNoteDate} />
        )}

        {activeTab === "pengobatan-rutin" && (
          <MedicationTab data={medications} sectionNote={medicationNote} sectionNoteDate={medicationNoteDate} />
        )}
      </div>
    </div>
  );
}
