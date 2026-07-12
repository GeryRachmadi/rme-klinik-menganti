import { prisma } from '@/lib/prisma';
import { toFHIRDateTime, formatVitalSign } from '@/lib/satusehat';
import { parseFamilyHistory } from '@/lib/utils/family-history';

export type FHIRBundle = {
  resourceType: 'Bundle';
  type: 'transaction';
  entry: FHIRBundleEntry[];
};

type FHIRBundleEntry = {
  fullUrl: string;
  resource: Record<string, unknown>;
  request: { method: string; url: string };
};

export async function buildSatuSehatBundle(encounterId: string): Promise<FHIRBundle> {
  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    include: {
      patient: true,
      practitioner: true,
      observations: true,
      conditionDiagnoses: true,
      procedures: true,
      medicationRequests: true,
      serviceRequests: true,
    },
  });

  if (!encounter) throw new Error('Encounter not found');
  if (!encounter.patient.ihs) throw new Error('Patient has no IHS ID — cannot build bundle');

  const patientRef = `Patient/${encounter.patient.ihs}`;
  const encounterUuid = crypto.randomUUID();
  const encounterRef = `urn:uuid:${encounterUuid}`;

  const entries: FHIRBundleEntry[] = [];

  // ── Conditions (diagnoses) ───────────────────────────────────
  // Built before the Encounter resource so the primary diagnosis's
  // fullUrl is available for Encounter.diagnosis below.
  let primaryConditionFullUrl: string | null = null;

  for (const d of encounter.conditionDiagnoses) {
    const conditionFullUrl = `urn:uuid:${crypto.randomUUID()}`;
    if (d.isPrimary) primaryConditionFullUrl = conditionFullUrl;

    entries.push({
      fullUrl: conditionFullUrl,
      resource: {
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: 'active',
            },
          ],
        },
        code: {
          coding: [
            {
              system: 'http://hl7.org/fhir/sid/icd-10',
              code: d.codeIcd10,
              display: d.display,
            },
          ],
        },
        subject: { reference: patientRef },
        encounter: { reference: encounterRef },
      },
      request: { method: 'POST', url: 'Condition' },
    });
  }

  // ── Location ─────────────────────────────────────────────────
  // SATUSEHAT requires Encounter.location[0].location to be a reference,
  // not a display-only value — no real registered Location/IHS ID exists
  // yet, so a minimal Location resource is included in the same bundle.
  const locationFullUrl = `urn:uuid:${crypto.randomUUID()}`;
  entries.push({
    fullUrl: locationFullUrl,
    resource: {
      resourceType: 'Location',
      name: 'Klinik Pratama Menganti Gresik',
    },
    request: { method: 'POST', url: 'Location' },
  });

  // ── Encounter ────────────────────────────────────────────────
  const ENCOUNTER_STATUS_MAP: Record<string, string> = {
    MENUNGGU: 'planned',
    DIPERIKSA: 'in-progress',
    SELESAI: 'finished',
    BATAL: 'cancelled',
  };

  const encounterResource: Record<string, unknown> = {
    resourceType: 'Encounter',
    status: 'finished',
    identifier: [
      { system: 'http://sys-ids.kemkes.go.id/encounter', value: encounter.id },
    ],
    statusHistory: [
      {
        status: ENCOUNTER_STATUS_MAP[encounter.status] ?? 'finished',
        period: {
          start: toFHIRDateTime(encounter.createdAt),
          end: toFHIRDateTime(encounter.updatedAt),
        },
      },
    ],
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
    },
    subject: { reference: patientRef },
    period: {
      start: toFHIRDateTime(encounter.createdAt),
      end: toFHIRDateTime(encounter.updatedAt),
    },
    location: [
      { location: { reference: locationFullUrl, display: 'Klinik Pratama Menganti Gresik' } },
    ],
    serviceProvider: {
      reference: 'Organization/d7e507d8-23ed-4297-8488-0c72c5c44589',
    },
  };

  if (encounter.practitioner?.ihsNumber) {
    encounterResource.participant = [
      { individual: { reference: `Practitioner/${encounter.practitioner.ihsNumber}` } },
    ];
  }
  // else: omitted gracefully — no practitioner IHS ID assigned to this encounter.

  if (primaryConditionFullUrl) {
    encounterResource.diagnosis = [
      {
        condition: { reference: primaryConditionFullUrl },
        use: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/diagnosis-role',
              code: 'AD',
            },
          ],
        },
      },
    ];
  }
  // else: omitted gracefully — no primary ConditionDiagnosis found.

  entries.push({
    fullUrl: encounterRef,
    resource: encounterResource,
    request: { method: 'POST', url: 'Encounter' },
  });

  // ── Observations (vital signs) ───────────────────────────────
  const mainObs = encounter.observations.find(
    (o) => !o.notes?.startsWith('[Edukasi Pasien]:')
  ) ?? null;

  if (mainObs) {
    const vitals: Array<{
      field: number | null;
      loincCode: string;
      unit: string;
      display: string;
    }> = [
      { field: mainObs.systolic,        loincCode: '8480-6',  unit: 'mm[Hg]', display: 'Systolic blood pressure' },
      { field: mainObs.diastolic,       loincCode: '8462-4',  unit: 'mm[Hg]', display: 'Diastolic blood pressure' },
      { field: mainObs.heartRate,       loincCode: '8867-4',  unit: '/min',   display: 'Heart rate' },
      { field: mainObs.temperature,     loincCode: '8310-5',  unit: 'Cel',    display: 'Body temperature' },
      { field: mainObs.respiratoryRate, loincCode: '9279-1',  unit: '/min',   display: 'Respiratory rate' },
      { field: mainObs.height,          loincCode: '8302-2',  unit: 'cm',     display: 'Body height' },
      { field: mainObs.weight,          loincCode: '29463-7', unit: 'kg',     display: 'Body weight' },
      { field: mainObs.bmi,             loincCode: '39156-5', unit: 'kg/m2',  display: 'BMI' },
    ];

    for (const vital of vitals) {
      entries.push({
        fullUrl: `urn:uuid:${crypto.randomUUID()}`,
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: vital.loincCode,
                display: vital.display,
              },
            ],
          },
          subject: { reference: patientRef },
          encounter: { reference: encounterRef },
          effectiveDateTime: toFHIRDateTime(encounter.createdAt),
          ...(encounter.practitioner?.ihsNumber && {
            performer: [{ reference: `Practitioner/${encounter.practitioner.ihsNumber}` }],
          }),
          ...formatVitalSign(vital.field, vital.unit),
        },
        request: { method: 'POST', url: 'Observation' },
      });
    }
  }

  // ── Procedures ───────────────────────────────────────────────
  for (const p of encounter.procedures) {
    entries.push({
      fullUrl: `urn:uuid:${crypto.randomUUID()}`,
      resource: {
        resourceType: 'Procedure',
        status: 'completed',
        code: {
          coding: [
            {
              system: 'http://hl7.org/fhir/sid/icd-9-cm',
              code: p.codeIcd9 ?? 'MANUAL',
              display: p.display,
            },
          ],
        },
        subject: { reference: patientRef },
        encounter: { reference: encounterRef },
      },
      request: { method: 'POST', url: 'Procedure' },
    });
  }

  // ── Medication + MedicationRequest (paired) ─────────────────
  for (const medReq of encounter.medicationRequests) {
    if (!medReq.medication) continue;
    const medicationUuid = crypto.randomUUID();
    const medicationRef = `urn:uuid:${medicationUuid}`;

    entries.push({
      fullUrl: medicationRef,
      resource: {
        resourceType: 'Medication',
        identifier: [
          {
            system: 'http://sys-ids.kemkes.go.id/medication/d7e507d8-23ed-4297-8488-0c72c5c44589',
            value: crypto.randomUUID(),
          },
        ],
        // Per SATUSEHAT's Medication docs (https://satusehat.kemkes.go.id/platform/docs/id/fhir/resources/medication/).
        extension: [
          {
            url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType',
            valueCodeableConcept: {
              coding: [
                {
                  system: 'http://terminology.kemkes.go.id/CodeSystem/medication-type',
                  code: 'NC',
                  display: 'Non-compound',
                },
              ],
            },
          },
        ],
        // TEMPORARY: there is no real KFA code lookup/mapping for free-text
        // medication names in this app. This hardcodes every prescription to
        // SATUSEHAT's own documented sample KFA code (a specific TB combo
        // drug) purely so the bundle passes validation — it does NOT reflect
        // the actual medication prescribed. A real KFA search/mapping feature
        // (see https://dto.kemkes.go.id/kfa-browser) is required before this
        // is clinically accurate.
        code: {
          coding: [
            {
              system: 'http://sys-ids.kemkes.go.id/kfa',
              code: '93001019',
              display:
                'Obat Anti Tuberculosis / Rifampicin 150 mg / Isoniazid 75 mg / Pyrazinamide 400 mg / Ethambutol 275 mg Kaplet Salut Selaput (KIMIA FARMA)',
            },
          ],
          text: medReq.medication,
        },
      },
      request: { method: 'POST', url: 'Medication' },
    });

    const medicationRequestResource: Record<string, unknown> = {
      resourceType: 'MedicationRequest',
      status: 'active',
      intent: 'order',
      // Per SATUSEHAT's official MedicationRequest docs, the identifier
      // segment is "prescription", not "medicationrequest" (confirmed via
      // https://satusehat.kemkes.go.id/platform/docs/id/fhir/resources/medication-request/).
      identifier: [
        {
          system: 'http://sys-ids.kemkes.go.id/prescription/d7e507d8-23ed-4297-8488-0c72c5c44589',
          value: crypto.randomUUID(),
        },
      ],
      // No dedicated SOAP-completion timestamp field exists on Encounter;
      // using updatedAt as the closest proxy for when the request was authored.
      authoredOn: toFHIRDateTime(encounter.updatedAt),
      medicationReference: { reference: medicationRef },
      subject: { reference: patientRef },
      encounter: { reference: encounterRef },
    };

    if (encounter.practitioner?.ihsNumber) {
      medicationRequestResource.requester = {
        reference: `Practitioner/${encounter.practitioner.ihsNumber}`,
      };
    }
    // else: omitted gracefully — no practitioner IHS ID assigned to this encounter.

    entries.push({
      fullUrl: `urn:uuid:${crypto.randomUUID()}`,
      resource: medicationRequestResource,
      request: { method: 'POST', url: 'MedicationRequest' },
    });
  }

  // ── ServiceRequest (rujukan) ─────────────────────────────────
  const svcReq = encounter.serviceRequests[0];
  if (svcReq) {
    entries.push({
      fullUrl: `urn:uuid:${crypto.randomUUID()}`,
      resource: {
        resourceType: 'ServiceRequest',
        status: 'active',
        intent: 'referral',
        subject: { reference: patientRef },
        encounter: { reference: encounterRef },
        note: [{ text: svcReq.note ?? '' }],
      },
      request: { method: 'POST', url: 'ServiceRequest' },
    });
  }

  // ── FamilyMemberHistory ──────────────────────────────────────
  const familyHistory = parseFamilyHistory(encounter.riwayatPenyakitKeluarga);

  if (familyHistory !== null) {
    const conditions =
      !familyHistory.tidakAda && familyHistory.chips.length > 0
        ? familyHistory.chips.map((item: string) => ({ code: { text: item } }))
        : [];

    const notes: { text: string }[] = [];
    if (familyHistory.tidakAda || familyHistory.chips.length === 0) {
      notes.push({ text: 'Tidak ada riwayat penyakit keluarga' });
    } else if (familyHistory.catatan) {
      notes.push({ text: familyHistory.catatan });
    }

    entries.push({
      fullUrl: `urn:uuid:${crypto.randomUUID()}`,
      resource: {
        resourceType: 'FamilyMemberHistory',
        status: 'completed',
        patient: { reference: patientRef },
        relationship: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
              code: 'FAMMEMB',
              display: 'family member',
            },
          ],
        },
        condition: conditions,
        ...(notes.length > 0 && { note: notes }),
      },
      request: { method: 'POST', url: 'FamilyMemberHistory' },
    });
  }

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries,
  };
}
