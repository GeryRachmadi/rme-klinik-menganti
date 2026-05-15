# 📋 Project Handoff & State: UC-11 Catat Tindak Lanjut

**Date:** May 15, 2026 | **Session:** UC-11 Plan/P Implementation (TR-71 + TR-72)
**Branch:** `claude`
**System:** Electronic Medical Record (RME) for Klinik Pratama Menganti
**Focus:** UC-11 (Plan/P of SOAP) — ICD-9 CM search, multi-procedure form, manual fallback
**Status:** ✅ UC-10 COMPLETE. ✅ TR-71 DONE. ✅ TR-72 DONE (array refactor). ⏳ TR-73 is next.

---

## ✅ Completed Tasks

### UC-08: Kajian Awal (TR-56–TR-60) ✅ DONE
### UC-09: Pemeriksaan Fisik (TR-61–TR-65) ✅ DONE
### UC-10: Input Diagnosis (TR-66–TR-70) ✅ DONE

Full details of these phases are archived in the previous handoff.
Key deliverables:
- [x] `AsesmenPerawat.tsx` + `AsesmenDokter.tsx` wrappers
- [x] forwardRef orchestration + unified "Simpan" button
- [x] `SubjectiveObjectiveExtendedForm.tsx`, `AssessmentDiagnosisForm.tsx`, `MissingDataWarning.tsx`
- [x] `POST /api/rawat-jalan/[encounterId]/asesmen/route.ts`
  - RBAC: DOKTER + ADMIN only
  - `prisma.$transaction`: writes ConditionDiagnosis, Observation, Encounter (status→SELESAI)
- [x] All bugs resolved: 5x chips duplication, draft modal stacking,
      BMI loop, resolver type error, breadcrumb Link fix

---

### Security Incident Response (Post-TR-70) ✅ DONE

**Threat:** CVSS 8.6 critical vulnerability in older Next.js versions

- [x] Upgraded to `next@latest` via `npm install next@latest`
- [x] Ran `npm audit fix` (surgical patch — moderate vulns resolved)
- [x] All routes, API handlers, and Prisma calls verified post-upgrade

---

### SOAP File Refactoring ✅ DONE

All assessment component files renamed to strict SOAP naming convention:

| Old Name | New Name |
|---|---|
| `AssessmentForm.tsx` | `SubjectiveInitialForm.tsx` |
| `PhysicalExamForm.tsx` | `ObjectivePhysicalForm.tsx` |
| `FormHasilPeriksa.tsx` | `SubjectiveObjectiveExtendedForm.tsx` |
| `DiagnosisAutocomplete.tsx` | `AssessmentDiagnosisForm.tsx` |

All imports updated in: `AsesmenDokter.tsx`, `AsesmenPerawat.tsx`, `AsesmenPageClient.tsx`.

---

### TR-71: ICD-9 CM Search + Autocomplete ✅ DONE

| Subtask | File | Status |
|---|---|---|
| TR-71.1 | `src/lib/constants/icd9cm-mock.ts` | ✅ 20 ICD-9 CM entries |
| TR-71.2 | `src/lib/hooks/useProcedureSearch.ts` | ✅ 3-char min, 300ms debounce, case-insensitive |
| TR-71.3 | `components/PlanProcedureAutocomplete.tsx` | ✅ Pure search+dropdown, no chip/state |

**Note:** Component ended up in the root `components/` folder (not `plan/` subfolder) to
match the existing flat structure of all other assessment components.

---

### TR-72: Manual Fallback + Procedure Form Wrapper ✅ DONE

| Subtask | File | Status |
|---|---|---|
| TR-72.1 | `components/PlanProcedureAutocomplete.tsx` | ✅ Manual mode removed (moved to parent form) |
| TR-72.2 | `src/lib/schemas/procedure-schema.ts` | ✅ Refactored to multi-procedure array schema |
| TR-72.3 | `src/lib/utils/transform-procedure.ts` | ⚠️ STALE — see note below |
| TR-72.4 | `components/PlanProcedureForm.tsx` | ✅ Multi-procedure form with chips + manual toggle |

**Schema Refactor (Breaking Change):** `procedure-schema.ts` was refactored from single-object
to array-based. `ProcedureFormValues` now has:
- `procedures: ProcedureItem[]` — the array (with `codeIcd9`, `display`, `notes?`)
- `useManual: boolean` — local toggle for manual input UI
- `manualText: string` — temporary text input for manual entry
- `manualNote: string` — temporary notes input for manual entry

**⚠️ `transform-procedure.ts` is now stale.** It still references the old single-item field
shape (`codeIcd9`, `display`, `useManual`, `manualText` at root). It will cause TypeScript errors.
It is NOT imported anywhere currently. Update it during TR-76 when the API contract is defined.

---

### UI Fixes Applied ✅ DONE

- Merged Plan section into the main "Hasil Periksa Medis" white card (no separate card)
- Removed `<hr>` divider between Diagnosis Utama and Tindakan Medis sections
- Removed "RENCANA TINDAK LANJUT (PLAN)" heading
- Manual fallback pattern in `PlanProcedureAutocomplete` now matches `AssessmentDiagnosisForm`

---

## 🐞 Known Issues

### ⚠️ `transform-procedure.ts` — TypeScript Errors
- **File:** `src/lib/utils/transform-procedure.ts`
- **Problem:** Schema changed to array; file still uses old single-item fields.
- **Impact:** `tsc --noEmit` will flag errors in this file. Not imported anywhere.
- **Fix:** Rewrite during TR-76 once API contract for Plan payload is finalized.

---

## 🎯 Next Immediate Steps

### Step 1: TR-73 — Medication + Education Forms
**Priority:** HIGH | **Complexity:** 🟢 Low

- `MedicationForm.tsx` (free-text prescription, max 1000 chars)
- `EducationForm.tsx` (patient education advice, max 1000 chars)
- Both use `forwardRef` + `useImperativeHandle` exposing `submitForm()`
- Auto-save with `useAutoSaveDraft` hook (same pattern as other forms)
- Draft keys: `draft_medication_${encounterId}`, `draft_education_${encounterId}`

### Step 2: TR-74 — Referral Form + Ghost Data Prevention
**Priority:** HIGH | **Complexity:** 🟡 Medium

- `ReferralForm.tsx` with Aktif/Nonaktif toggle
- Ghost data `useEffect`: when toggle goes OFF, clear `tujuanRujukan` + `alasanRujukan`
- Free text for destination (no dropdown — would require master facility table)
- Draft key: `draft_referral_${encounterId}`

### Step 3: TR-75 — Root Validation Schema
**Priority:** MEDIUM | **Complexity:** 🟡 Medium

- `PlanFormSchema` with cross-field refinement
- At least one of (procedure array non-empty / medication / rujukan aktif / edukasi) must be present

### Step 4: TR-76 — UPGRADE Existing Assessment API (CRITICAL PATH)
**Priority:** CRITICAL | **Complexity:** 🟠 High

- DO NOT create a new API route
- UPGRADE `POST /api/rawat-jalan/[encounterId]/asesmen/route.ts`
- Extend payload to accept Plan data (procedures array, medication, rujukan, edukasi)
- Also rewrite `transform-procedure.ts` to match the new array-based schema
- Extend `prisma.$transaction` to also write: Procedure(s), MedicationRequest, ServiceRequest, Observation (edukasi)
- Encounter.status → SELESAI only ONCE (last step)

### Step 5: TR-ORCH-01 — Update AsesmenDokter.tsx
**Priority:** HIGH | **Complexity:** 🟡 Medium

- Wire `procedureRef.current?.submitForm()` into `handleCentralSubmit`
- Add refs for MedicationForm, ReferralForm, EducationForm once built
- Build unified payload combining Assessment + Plan data
- Clear all 6 draft keys on success

---

## 🏗️ UC-11 Remaining Subtask Plan (TR-73 → TR-76)

### TR-73: Medication + Education Forms

| Subtask | File | Notes |
|---------|------|-------|
| TR-73.1 | `components/MedicationForm.tsx` | Free text, max 1000 chars; forwardRef + submitForm() |
| TR-73.2 | `components/EducationForm.tsx` | Free text, max 1000 chars; forwardRef + submitForm() |
| TR-73.3 | `src/lib/schemas/plan-schema.ts` | MedicationSchema + EducationSchema (both optional) |
| TR-73.4 | Both form components | Draft auto-save via `useAutoSaveDraft` hook |

### TR-74: Referral Form + Ghost Data Prevention

| Subtask | File | Notes |
|---------|------|-------|
| TR-74.1 | `components/ReferralForm.tsx` | Toggle + 2 free-text fields; forwardRef + submitForm() |
| TR-74.2 | Within ReferralForm | Ghost data useEffect: clear when toggle OFF |
| TR-74.3 | `src/lib/schemas/plan-schema.ts` | ReferralSchema: both fields required if isActive=true |
| TR-74.4 | Within ReferralForm | Draft auto-save: `draft_referral_${encounterId}` |

**Ghost Data Prevention (CRITICAL):**
```typescript
// ✅ CORRECT: Clear when INACTIVE (! operator required)
useEffect(() => {
  if (!isRujakanAktif) {
    form.setValue('tujuanRujukan', '', { shouldDirty: false })
    form.setValue('alasanRujukan', '', { shouldDirty: false })
  }
}, [isRujakanAktif, form])
```
⚠️ The `!` (NOT operator) is mandatory. Without it, logic inverts and valid referral data
gets wiped when the toggle is ON.

### TR-75: Root Form Validation Schema

| Subtask | File | Notes |
|---------|------|-------|
| TR-75.1 | `src/lib/schemas/plan-schema.ts` | PlanFormSchema with cross-field refinement |
| TR-75.2 | Within AsesmenDokter submit | Toast: "Minimal harus ada satu tindakan/resep/rujukan/edukasi" |

```typescript
// At least one Plan section must be filled
.refine((data) => {
  const hasProcedure = data.procedures.length > 0
  const hasMedication = !!data.medication?.medicationText
  const hasRujukan = data.rujukan.isActive
  const hasEdukasi = !!data.edukasi?.anjuranEdukasi
  return hasProcedure || hasMedication || hasRujukan || hasEdukasi
}, { message: "Minimal harus ada satu tindakan/resep/rujukan/edukasi" })
```

### TR-76: UPGRADE Assessment API (DO NOT CREATE NEW ROUTE)

| Subtask | File | Notes |
|---------|------|-------|
| TR-76.1 | `api/rawat-jalan/[encounterId]/asesmen/route.ts` | Extend request interface with `plan` object |
| TR-76.2 | Same file | RBAC check (DOKTER + ADMIN only; 403 otherwise) |
| TR-76.3 | Same file | Unified validation (ALL forms validated before any DB write) |
| TR-76.4 | Same file | Atomic transaction (see below) |
| TR-76.5 | Same file | Full error responses: 400, 403, 404, 500 |
| TR-76.6 | `src/lib/utils/transform-procedure.ts` | Rewrite to handle `ProcedureItem[]` array |
| TR-76.7 | `AsesmenDokter.tsx` | Clear all 6 draft keys on success, redirect /rawat-jalan |

**Extended Request Interface:**
```typescript
interface AssessmentAndPlanRequest {
  // UC-10 (existing)
  assessmentData: { ... }
  physicalData: { ... }
  hasilPeriksaData: { ... }
  selectedDiagnoses: { code: string, display: string, notes?: string }[]

  // UC-11 (new)
  procedures: { codeIcd9: string, display: string, notes?: string }[]
  medication?: { medicationText: string }
  rujukan: { isActive: boolean, tujuanRujukan?: string, alasanRujukan?: string }
  edukasi?: { anjuranEdukasi: string }
}
```

**Atomic Transaction (inside `prisma.$transaction`):**
1. Existing: ConditionHistory, AllergyIntolerance, MedicationStatement (from assessmentData)
2. Existing: Observation (vitals from physicalData)
3. Existing: ConditionDiagnosis (from selectedDiagnoses)
4. **NEW:** `Procedure.createMany` ← from `procedures[]` array (skip if empty)
5. **NEW:** `MedicationRequest.create` ← if `medication.medicationText` provided
6. **NEW:** `ServiceRequest.create` ← always; tujuan/alasan forced null if `!isActive`
7. **NEW:** `Observation.create` ← if edukasi; `code: "edukasi-pasien"` (FHIR)
8. **LAST:** `Encounter.update` ← status: "SELESAI" (ONCE, LAST STEP ONLY)

**Draft Keys to Clear on Success:**
1. `draft_assessment_${encounterId}`
2. `draft_physical_${encounterId}`
3. `draft_hasil-periksa_${encounterId}`
4. `draft_procedure_${encounterId}`
5. `draft_medication_${encounterId}`
6. `draft_referral_${encounterId}`
7. `draft_education_${encounterId}`

---

## 📁 Current File Structure (UC-11 — as built)

```
src/app/rawat-jalan/[encounterId]/asesmen/
├── page.tsx                                  (existing — role check)
├── components/
│   ├── AsesmenDokter.tsx                     (MODIFIED — Plan section wired)
│   ├── AsesmenPerawat.tsx                    (MODIFIED — SOAP imports updated)
│   ├── AsesmenPageClient.tsx                 (MODIFIED — SOAP imports updated)
│   ├── SubjectiveInitialForm.tsx             (was AssessmentForm)
│   ├── ObjectivePhysicalForm.tsx             (was PhysicalExamForm)
│   ├── SubjectiveObjectiveExtendedForm.tsx   (was FormHasilPeriksa)
│   ├── AssessmentDiagnosisForm.tsx           (was DiagnosisAutocomplete)
│   ├── PlanProcedureForm.tsx                 ← TR-72 NEW (multi-procedure wrapper)
│   ├── PlanProcedureAutocomplete.tsx         ← TR-71 NEW (pure search+dropdown)
│   ├── DraftFoundModal.tsx
│   └── MissingDataWarning.tsx

src/lib/
├── constants/
│   └── icd9cm-mock.ts                        ← TR-71.1 NEW (20 ICD-9 entries)
├── hooks/
│   └── useProcedureSearch.ts                 ← TR-71.2 NEW
├── schemas/
│   └── procedure-schema.ts                   ← TR-72 REWRITTEN (array schema)
└── utils/
    └── transform-procedure.ts                ← ⚠️ STALE (rewrite in TR-76)

src/app/api/rawat-jalan/[encounterId]/asesmen/
└── route.ts                                  ← TR-76 will UPGRADE (not create new)
```

**Still to create (TR-73 + TR-74):**
- `components/MedicationForm.tsx`
- `components/EducationForm.tsx`
- `components/ReferralForm.tsx`
- `src/lib/schemas/plan-schema.ts`

---

## 🛠️ Technical Decisions (UC-11)

### 7. Atomic Assessment + Plan in One Transaction
**Decision:** Upgrade existing TR-70 API to accept the full SOAP payload in one request.
No separate Plan API endpoint.
**Why:** A separate Plan API creates a two-step save where Assessment could succeed
while Plan fails, leaving a half-saved medical record. `prisma.$transaction` guarantees
all-or-nothing atomicity.

### 8. Multi-Procedure Array (Revised from Single-Procedure MVP)
**Decision:** Procedures are now a `ProcedureItem[]` array (not a single object).
**Why:** The single-procedure assumption was dropped — primary care visits commonly
involve multiple procedures (e.g., blood test + ECG + consultation). The array approach
adds minimal complexity while correctly modeling reality.

### 9. Payload Transform Deferred to TR-76
**Decision:** `transform-procedure.ts` is left stale until TR-76.
**Why:** The API contract for the Plan payload needs to be finalized first. Transforming
prematurely locks in an assumption that may need to change.

### 10. Manual Fallback Owned by Parent Form (PlanProcedureForm)
**Decision:** `PlanProcedureAutocomplete` is a pure search+dropdown component.
All manual input state (checkbox, textarea, "Tambah" button) lives in `PlanProcedureForm`.
**Why:** Mirrors the `AssessmentDiagnosisForm` pattern. Keeps the autocomplete component
stateless and reusable. Manual entries are appended to the same `procedures[]` array
with `codeIcd9: "MANUAL"`.

### 11. Patient Education → Observation Table (FHIR-Compliant)
**Decision:** Education notes saved as `Observation` with `code: "edukasi-pasien"`.
**Why:** Aligns with HL7 FHIR standard. Avoids schema bloat. Queryable by code.

### 12. Free Text for Rujukan Destination
**Decision:** Plain text input, not a dropdown.
**Why:** A dropdown would require a master facility table. Doctor types manually
(e.g., "RSUD Ibnu Sina Gresik"). Acceptable for thesis scope.

### 13. Ghost Data Prevention on Rujukan Toggle
**Decision:** When the Rujukan toggle is OFF, `tujuanRujukan` and `alasanRujukan`
are cleared immediately via useEffect. Backend also forces them null when `isActive=false`.
**Why:** Two-layer protection — frontend clears, backend enforces.
⚠️ Critical: condition must be `if (!plan.rujukan.isActive)` with the `!` operator.

### 14. 1-Second Debounced Auto-Save via `useAutoSaveDraft`
**Decision:** All forms use the shared `useAutoSaveDraft(draftKey, formData)` hook.
**Why:** Centralizes the debounce logic. Saves on every keystroke pause without
thrashing localStorage. Safer than `onBlur` — captures data if tab is abruptly closed.
Draft format: `{ data: formValues, timestamp: number }`.
Restoration: always parse as `const { data } = JSON.parse(saved)` then `reset(data)`.

---

## 📊 Prisma Schema — New Tables for UC-11

### Procedure (NEW)
```prisma
model Procedure {
  id          String   @id @default(cuid())
  encounterId String
  patientId   String
  codeIcd9    String   // "99213" or "MANUAL"
  display     String   // Procedure name or manual text
  notes       String?
  status      String   @default("completed")
  performedAt DateTime @default(now())
  createdBy   String
  createdAt   DateTime @default(now())
}
```

### MedicationRequest (NEW)
```prisma
model MedicationRequest {
  id              String   @id @default(cuid())
  encounterId     String
  patientId       String
  medicationText  String   // FREE TEXT prescription
  instructions    String?
  status          String   @default("active")
  createdBy       String
  createdAt       DateTime @default(now())
}
```

### ServiceRequest (NEW)
```prisma
model ServiceRequest {
  id              String   @id @default(cuid())
  encounterId     String
  patientId       String
  isActive        Boolean  @default(false)
  tujuanRujukan   String?  // null when isActive=false
  alasanRujukan   String?  // null when isActive=false
  status          String   @default("draft")
  createdBy       String
  createdAt       DateTime @default(now())
}
```

### Observation (EXISTING — extended use)
- `code: "edukasi-pasien"` → new semantic code for education records
- `notes` field stores education text
- No schema migration required (existing columns reused)

---

## 🔗 Dependencies & Blockers

### Current Blockers
⚠️ `transform-procedure.ts` has TypeScript errors (stale schema). Non-blocking for
frontend work. Must be fixed before TR-76.

### UC-11 Dependency Chain
```
TR-71 ✅ (Mock + Hook + Autocomplete)
TR-72 ✅ (Schema Array Refactor + PlanProcedureForm)
↓
TR-73 ⏳ (Medication + Education)   ← Can run parallel with TR-74
TR-74 ⏳ (Referral)                 ← Can run parallel with TR-73
↓
TR-75 ⏳ (Root Validation Schema)
↓
TR-76 ⏳ (UPGRADE API — CRITICAL PATH + fix transform-procedure.ts)
↓
TR-ORCH-01 ⏳ (AsesmenDokter.tsx — wire all Plan refs into submit)
```

---

## 📅 Overall Roadmap
- ✅ UC-08: Kajian Awal (TR-56–TR-60)
- ✅ UC-09: Pemeriksaan Fisik (TR-61–TR-65)
- ✅ UC-10: Input Diagnosis (TR-66–TR-70)
- ✅ Security Patch (CVSS 8.6 Next.js)
- ✅ SOAP file refactoring (all component renames + import fixes)
- ✅ TR-71: ICD-9 CM search hook + autocomplete component
- ✅ TR-72: Procedure schema (array) + PlanProcedureForm wrapper
- ⏳ TR-73: Medication + Education forms
- ⏳ TR-74: Referral form
- ⏳ TR-75: Root validation schema
- ⏳ TR-76: UPGRADE API endpoint (critical path)
- ⏳ TR-ORCH-01: Wire all Plan refs into AsesmenDokter submit
- ⏳ Full end-to-end SOAP testing
- ⏳ UC-12 (SATUSEHAT integration) if in scope
- ⏳ Thesis writeup

---

**Last Updated:** May 15, 2026 | **Next Review:** Before starting TR-73
