import { prisma } from '@/lib/prisma';
import { toFHIRDateTime, formatVitalSign } from '@/lib/satusehat';

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

  // ── Encounter ────────────────────────────────────────────────
  const encounterResource: Record<string, unknown> = {
    resourceType: 'Encounter',
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
    },
    subject: { reference: patientRef },
    period: {
      start: toFHIRDateTime(encounter.createdAt),
      end: toFHIRDateTime(encounter.updatedAt),
    },
    serviceProvider: {
      reference: 'Organization/d7e507d8-23ed-4297-8488-0c72c5c44589',
    },
  };

  if (encounter.practitioner?.ihsNumber) {
    encounterResource.participant = [
      { individual: { reference: `Practitioner/${encounter.practitioner.ihsNumber}` } },
    ];
  }

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
          ...formatVitalSign(vital.field, vital.unit),
        },
        request: { method: 'POST', url: 'Observation' },
      });
    }
  }

  // ── Conditions (diagnoses) ───────────────────────────────────
  for (const d of encounter.conditionDiagnoses) {
    entries.push({
      fullUrl: `urn:uuid:${crypto.randomUUID()}`,
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

  // ── MedicationRequest ────────────────────────────────────────
  const medReq = encounter.medicationRequests[0];
  if (medReq?.medication) {
    entries.push({
      fullUrl: `urn:uuid:${crypto.randomUUID()}`,
      resource: {
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [
            {
              system: 'http://sys-ids.kemkes.go.id/kfa',
              code: 'dummy-kfa-001',
            },
          ],
          text: medReq.medication,
        },
        subject: { reference: patientRef },
        encounter: { reference: encounterRef },
      },
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

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries,
  };
}
