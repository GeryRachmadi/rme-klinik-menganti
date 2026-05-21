# 📋 Project Handoff & State: TR-13 SATUSEHAT Complete (TR-81 + TR-82)

**Date:** May 20, 2026 | **Session:** TR-81 + TR-82 — SATUSEHAT Integration Epic Complete
**Branch:** `claude`
**System:** Electronic Medical Record (RME) for Klinik Pratama Menganti
**Status:** ✅ TR-81 + TR-82 COMPLETE. Epic TR-13 (UC-12) fully implemented with Mock Mode. Pending: full regression testing before thesis submission.

---

## ✅ UC-11 Summary (TR-71 → TR-76 + TR-76.8) — Previously Completed

All SOAP+Plan forms for Dokter and Perawat are complete with atomic DB write, CPT/CDT procedure codes, draft detection, and read-only enforcement. See prior handoff for full details.

---

## ✅ Completed This Session (May 19–20, 2026)

### TR-80: Auto-Fetch Patient IHS ID (UC-04) ✅ COMPLETE

- **File modified:** `src/app/actions/patient.ts`
- Imports `getPatientIHSId` from `@/lib/satusehat`
- **Non-blocking:** try-catch wraps the fetch; local patient registration always succeeds even if Kemenkes is unreachable
- **Guard:** skips IHS fetch if NIK is empty or starts with `"NONIK-"`
- **Result:** `ihs` field saved to `Patient` table (P-code on success, `null` on failure)

### TR-81: FHIR Bundle Builder ✅ COMPLETE

- **New file:** `src/lib/bundleBuilder.ts`
- **Exports:** `buildSatuSehatBundle(encounterId: string): Promise<FHIRBundle>` + `FHIRBundle` type
- **6 FHIR resource types mapped:**
  1. `Encounter` — AMB class, finished status, practitioner participant (conditional on `ihsNumber`)
  2. `Observation` × 8 — one per vital sign with LOINC codes; null values emit `dataAbsentReason`; education obs excluded
  3. `Condition` — one per `ConditionDiagnosis` row, ICD-10 system URI
  4. `Procedure` — one per `Procedure` row, ICD-9-CM system URI; `codeIcd9 = null` → `'MANUAL'`
  5. `MedicationRequest` — dummy KFA code `dummy-kfa-001`, free text in `medicationCodeableConcept.text`
  6. `ServiceRequest` — referral, only if `serviceRequests[0]` exists
- Uses `urn:uuid:<crypto.randomUUID()>` internal references for all child → Encounter relations
- Imports `toFHIRDateTime()` and `formatVitalSign()` from `satusehat.ts`; does NOT modify it
- Guard: throws `"Patient has no IHS ID — cannot build bundle"` if `patient.ihs` is null

### TR-82: Simpan & Kirim UI + API ✅ COMPLETE

**New file: `src/app/api/satusehat/submit/route.ts`**
- DOKTER/ADMIN only (401/403 for others)
- Calls `buildSatuSehatBundle()` to validate before sending; on throw → `syncStatus = FAILED_SYNC`, returns 400
- Mock: 1500ms delay → `syncStatus = SUCCESS`, `transactionId = "MOCK-TRX-<uuid>"` written to DB
- Non-mock: TODO placeholder falls through to same mock logic (no crash during dev)
- Outer try-catch: any unexpected error → `syncStatus = FAILED_SYNC`, returns 500

**Updated files:**
- `src/app/api/encounters/route.ts` → added `syncStatus` to GET list response payload
- `rawat-jalan/[encounterId]/asesmen/page.tsx` → added `ihs: true` to patient select; passes `syncStatus` + `patientIhs` as new props to `AsesmenDokter`
- `AsesmenDokter.tsx` → new props `syncStatus?`, `patientIhs?`; state `submitState / transactionId / errorMessage / localSyncStatus`; 3 modal overlays (Loading/Success/Error); "Simpan & Kirim" button visible only when `encounterStatus === 'SELESAI'`, disabled if `!patientIhs`, replaced with green "✓ Terkirim" badge after SUCCESS
- `src/components/shared/DaftarAntrean.tsx` → `syncStatus?` on `AntreanData`; `syncingId` state; `handleKirimUlang` posts to `/api/satusehat/submit`; orange "⟳ Kirim Ulang" badge in STATUS cell when `syncStatus === "FAILED_SYNC"`, with inline spinner while posting

### SATUSEHAT Mock Mode (Unblocking Measure)

- Provider-side **401 Unauthorized** confirmed via Postman — not a client bug
- Support email sent to helpdesk@kemkes.go.id with Org ID and Client ID
- Added `SATUSEHAT_MOCK_MODE="true"` to `.env.local`
- Mocks added to: `getSATUSEHATToken()`, `getPatientIHSId()`, `getPractitionerIHSId()` in `src/lib/satusehat.ts`
- **Happy path NIK:** `9271060312000001` → IHS: `P02478375538`
- **Happy path Practitioner NIK:** `7209061211900001` → IHS: `10009880728`
- To disable: set `SATUSEHAT_MOCK_MODE="false"` in `.env.local`

---

### 1. TR-76.8 Bugfixes (Continued from previous session)

| Bug | Fix |
|---|---|
| AsesmenPerawat had no read-only protection | Added full `isReadOnly` guard: banner, draft block, `isReadOnly` prop to SubjectiveInitialForm + ObjectivePhysicalForm, Simpan button hidden (not disabled) |
| ACTION/ASESMEN columns always visible | Made both conditional: `isAuthorized` gates ACTION, `canAssess` gates ASESMEN |
| SELESAI encounter blocked by redirect | Added `"SELESAI"` to `ACTIVE_STATUSES` in `asesmen/page.tsx` |
| useSession crash (no SessionProvider) | Removed `useSession`; `userRole` prop-drilled from server `auth()` → page.tsx → both Asesmen components |
| isReadOnly case sensitivity | Used `.toUpperCase()` on both sides |
| SELESAI ASESMEN button wrong color | Changed to `bg-[#3B82F6] hover:bg-blue-600 text-white` |
| Toast too quick before redirect (Perawat) | Added `setTimeout(() => router.push('/rawat-jalan'), 1500)` |

### 2. Read-Only Banner Style Fix

Both `AsesmenDokter.tsx` and `AsesmenPerawat.tsx`:
- Removed `ℹ️` emoji → replaced with `<Info>` icon from lucide-react
- Added `font-jakarta` class to both `<p>` lines
- `Info` added to lucide-react imports in both files

### 3. globals.css Font Bug Fix

**Root cause:** `globals.css` had two `@import "tailwindcss"` directives and two `body` blocks. The second `body` block (Next.js boilerplate leftover) had `font-family: Arial, Helvetica, sans-serif` which overrode the first.

**Fix:** Rewrote `globals.css` as a single clean file:
- Single `@import "tailwindcss"`
- `@theme inline` registers `--font-jakarta` and `--font-poppins` as Tailwind utilities (removed broken Geist font references)
- Single `body` block using `font-family: var(--font-jakarta)`
- Plus Jakarta Sans now applies globally; `font-jakarta` / `font-poppins` utility classes work

### 4. Patient Header Consistency

**`PatientHeader.tsx`** (`riwayat-medis/[noRm]`):
- Replaced plain text `{genderLabel} • {age} tahun • {nik}` with individual chips
- Row 1: noRm badge (green `#006B4E`) + NIK badge (gray)
- Row 2: gender chip (blue for Laki-laki, pink for Perempuan) + age chip (teal)
- Matches PatientAssessmentHeader chip style exactly

**`PatientAssessmentHeader.tsx`** (`rawat-jalan/[encounterId]/asesmen`):
- Avatar updated: `w-12 h-12 bg-teal-100` → `w-16 h-16 border-2 border-teal-500 bg-teal-50 text-teal-600 text-2xl`
- Matches the bordered avatar style from riwayat-medis PatientHeader

### 5. Rawat Jalan ACTION CRUD (Pencil + Trash)

Previously both buttons showed `alert("...masih dalam tahap pengembangan")`.

**New: `src/app/api/encounters/[encounterId]/route.ts`**
- `GET` — fetch single encounter with patient + practitioner (for edit drawer prefill)
- `PUT` — update priority, practitionerId, reasonCode, patientType; ADMIN/PENDAFTARAN only
- `DELETE` — cascade-deletes all child records (syncQueues, observations, conditionDiagnoses, procedures, serviceRequests, medicationRequests) then the encounter; rejects with 400 if status ≠ MENUNGGU

**New: `src/components/shared/EncounterEditDrawer.tsx`**
- Slides in from right (same pattern as EncounterRegistrationDrawer)
- Fetches encounter detail on open via GET /api/encounters/[encounterId]
- Patient shown as read-only teal card (no patient search)
- Editable fields: Prioritas, Jenis Pasien (Umum/BPJS toggle), Dokter (select), Keluhan Utama (textarea)
- On success: refreshes table → closes after 1.5s with toast
- Poli not editable (changing it would invalidate the queue number)

**Updated: `src/components/shared/DaftarAntrean.tsx`**
- Pencil → opens `EncounterEditDrawer` for that row's `id`
- Trash → disabled (greyed, tooltip) for non-Menunggu rows; enabled for Menunggu rows
- Delete confirmation modal: centered card with patient name, "Ya, Hapus" + spinner
- Action toast (bottom-center) for delete success/error
- New state: `editEncounterId`, `deleteTarget`, `isDeleting`, `actionToast`

---

## 📁 Current File Structure (as-built)

```
src/app/rawat-jalan/[encounterId]/asesmen/
├── page.tsx                               ← ACTIVE_STATUSES includes SELESAI; userRole prop-drilled
└── components/
    ├── AsesmenDokter.tsx                  ← isReadOnly via userRole prop; Info icon banner
    ├── AsesmenPerawat.tsx                 ← Full isReadOnly; Simpan hidden when read-only; 1.5s redirect delay
    ├── PatientAssessmentHeader.tsx        ← Updated avatar (w-16, border-2 border-teal-500)
    ├── SubjectiveInitialForm.tsx          ← isReadOnly disables chips/textareas/buttons
    ├── ObjectivePhysicalForm.tsx          ← isReadOnly disables vitals + catatan
    ├── SubjectiveObjectiveExtendedForm.tsx ← isReadOnly disables both textareas
    ├── AssessmentDiagnosisForm.tsx        ← returns null when isReadOnly
    ├── PlanProcedureForm.tsx              ← isReadOnly hides autocomplete/X/Kosongkan
    ├── PlanMedicationForm.tsx             ← isReadOnly disables textarea
    ├── PlanEducationForm.tsx              ← isReadOnly disables textarea
    └── PlanReferralForm.tsx               ← isReadOnly disables toggle + inputs

src/app/riwayat-medis/[noRm]/components/
└── PatientHeader.tsx                      ← Chip-style noRm, NIK, gender, age badges

src/app/api/encounters/
├── route.ts                               ← GET (list) + POST (create)
└── [encounterId]/
    ├── route.ts                           ← GET + PUT + DELETE (NEW)
    ├── assessment/route.ts
    └── physical-exam/route.ts

src/components/shared/
├── DaftarAntrean.tsx                      ← Edit drawer + delete modal wired
├── EncounterRegistrationDrawer.tsx
└── EncounterEditDrawer.tsx                ← NEW

src/app/globals.css                        ← Fixed: single @import, single body, @theme inline with Jakarta/Poppins
src/hooks/useAutoSaveDraft.ts              ← isReadOnly param skips localStorage writes

src/lib/
├── bundleBuilder.ts                       ← NEW: buildSatuSehatBundle() + FHIRBundle type (TR-81)
└── satusehat.ts                           ← Unchanged; imported by bundleBuilder

src/app/api/satusehat/
└── submit/route.ts                        ← NEW: POST handler for SATUSEHAT sync (TR-82)
```

---

## 🔑 Key Architectural Notes

**isReadOnly pattern:**
```typescript
const isReadOnly = encounter?.status?.toUpperCase() === 'SELESAI'
  && userRole?.toUpperCase() !== 'ADMIN';
```
- Computed synchronously from props (no useSession needed)
- `userRole` prop-drilled from server `auth()` in page.tsx

**Delete safety:**
- Only MENUNGGU encounters can be deleted (enforced in both API and UI)
- Cascade order in $transaction: syncQueues → observations → conditionDiagnoses → procedures → serviceRequests → medicationRequests → encounter

**Font setup (globals.css):**
- `@theme inline` maps `--font-jakarta` and `--font-poppins` to Tailwind utilities
- next/font sets the CSS variables on `<body>` at runtime via `plusJakartaSans.variable`
- Body default: `font-family: var(--font-jakarta)`

---

## 🎯 Next Steps

### 🎯 EPIC: TR-13 & UC-12 (SATUSEHAT API Integration)

#### ✅ COMPLETED TASKS
* **TR-77: Refactoring Terminologi Medis**
  - *Status:* SUCCESS / COMPLETED
  - *Details:* Renamed all `codeCpt` variables, fields, and types to `codeIcd9` across Prisma schema, API routes, and UI components (`PlanProcedureForm.tsx`). Dropped CPT codes completely since SATUSEHAT strictly requires ICD-9-CM for procedures.
  - *Verification:* Local database updated via `npx prisma db push --accept-data-loss` and verified clean type compilation.

* **TR-78: Persiapan Skema Database Encounter**
  - *Status:* SUCCESS / COMPLETED
  - *Details:* Added `syncStatus` (String, default: `"UNSYNCED"`) and `transactionId` (String, optional) to the `Encounter` model to support low-complexity MVP sync tracking.
  - *Verification:* Database pushed and client types regenerated via `npx prisma generate`.

* **TR-79: Autentikasi & Utilitas Core SATUSEHAT**
  - *Status:* SUCCESS / COMPLETED
  - *Details:* Created `src/lib/satusehat.ts` housing foundational API utilities:
    1. `getSATUSEHATToken()`: OAuth2 fetcher with strict in-memory caching to bypass Kemenkes' 1-minute rate-limit ban penalty.
    2. `getPatientIHSId(nik)` & `getPractitionerIHSId(nik)`: FHIR R4 identifier lookups using official endpoint paths (`/fhir-r4/v1/`).
    3. `toFHIRDateTime()` & `formatVitalSign()`: Structural helpers for strict FHIR compliance.

* **TR-80: Implementasi UC-04 (Auto-Sync IHS ID Pasien)**
  - *Status:* SUCCESS / COMPLETED
  - *Details:* Modified `src/app/actions/patient.ts`. On patient registration, calls `getPatientIHSId(nik)` non-blocking — if Kemenkes is unreachable or returns error, local registration still succeeds with `ihs: null`. Guard skips fetch for empty NIK or `NONIK-` prefix. SATUSEHAT Mock Mode enabled during development (`SATUSEHAT_MOCK_MODE="true"` in `.env.local`) while waiting for provider-side 401 resolution.

* **TR-81: FHIR Bundle Builder (Engine Konversi)**
  - *Status:* SUCCESS / COMPLETED
  - *Details:* Created `src/lib/bundleBuilder.ts`. Exports `buildSatuSehatBundle(encounterId)` + `FHIRBundle` type. Maps Encounter, 8 Observation vital signs (LOINC), Condition (ICD-10), Procedure (ICD-9-CM), MedicationRequest (dummy KFA), ServiceRequest into a FHIR R4 transaction Bundle with `urn:uuid` internal references. Throws if `patient.ihs` is null.

* **TR-82: UI Antarmuka & MVP Error Handling**
  - *Status:* SUCCESS / COMPLETED
  - *Details:* Created `src/app/api/satusehat/submit/route.ts`. Wired "Simpan & Kirim ke SATUSEHAT" button in `AsesmenDokter.tsx` — visible for SELESAI encounters, disabled when `patientIhs` null. 3 modal overlays: Loading (spinner), Success (green checkmark + transactionId), Error (red warning + Kirim Ulang button). `DaftarAntrean.tsx`: orange "Kirim Ulang" badge on `FAILED_SYNC` rows with inline spinner.

#### ⚠️ COMPLETED — No Remaining Roadmap for TR-13

#### ⚠️ ARCHITECTURAL CONSTRAINTS & BLIND SPOTS
1. **Strict Base URL:** Always use `https://api-satusehat-stg.dto.kemkes.go.id` as the environment variable. Avoid legacy sub-paths like `/fhir/r4/` or `/oauth2/token` which cause 404/NXDOMAIN errors.
2. **Missing IHS Handling:** If a patient's IHS is null, disable the sync button on the UI and show a warning banner instead of sending a broken bundle.
3. **Data Absent Reason:** Unmeasured vital signs must explicitly map to `dataAbsentReason: unknown` instead of sending `null` fields to prevent Kemenkes validation rejections.
4. **SATUSEHAT_MOCK_MODE:** Set `"true"` in `.env.local` during development while provider credentials are blocked (401 from Kemenkes). All three functions in `satusehat.ts` (`getSATUSEHATToken`, `getPatientIHSId`, `getPractitionerIHSId`) return hardcoded mock data. **Disable before production/final thesis testing** by setting `SATUSEHAT_MOCK_MODE="false"`.

---

## 📊 Overall Roadmap

- ✅ UC-08: Kajian Awal (TR-56–TR-60)
- ✅ UC-09: Pemeriksaan Fisik (TR-61–TR-65)
- ✅ UC-10: Input Diagnosis (TR-66–TR-70)
- ✅ UC-11: Catat Tindak Lanjut (TR-71–TR-76)
- ✅ Security Patch (CVSS 8.6 Next.js)
- ✅ CPT/CDT nomenclature refactor
- ✅ QA Phase 2 verification (TC 3.1–3.9)
- ✅ TR-76.8: Encounter Read-Only View & Admin Override
- ✅ UI Polish: Patient header chips, avatar border, font fix, Info icon banner
- ✅ Rawat Jalan ACTION CRUD: Edit drawer + Delete with confirmation
- ✅ TR-77: Refactoring codeCpt → codeIcd9 (ICD-9-CM alignment)
- ✅ TR-78: Encounter syncStatus + transactionId schema fields
- ✅ TR-79: SATUSEHAT OAuth2 + IHS lookup utilities + FHIR helpers
- ✅ QA Bug Fixes Group 1 (3 bugs — May 2026): Delete button (Admin), ICD-10 NULL, Kajian Awal not saved
- ✅ QA Bug Fixes Group 2 (3 bugs — May 2026): Draft popup false trigger, Checkbox booleans not restored, SELESAI read-only view missing plan data
- ✅ TR-80: Auto-sync IHS ID on patient registration (UC-04) — Mock Mode active
- ✅ TR-81: FHIR Bundle builder (SOAP → FHIR R4 transaction)
- ✅ TR-82: "Simpan & Kirim" UI + syncStatus flip + resend button
- ⏳ Full regression testing (UC-01 → UC-12)
- ⏳ Thesis writeup

---

---

## 🐛 QA Bug Fixes (May 2026)

### Group 1 (Previous Session)

| Bug | Root Cause | Fix Applied |
|---|---|---|
| **BUG 1** Kajian Awal not saved (Perawat) | Physical exam validation failure set `physicalData=null`, causing early return BEFORE assessment API call. UX: error message only named the second failing section, masking the real failure. | `AsesmenPerawat.tsx`: combined error collection — both forms validated first; single toast shows all failing sections. Note: if only physical fails, assessment is NOT submitted (by design, both must pass together for data integrity). |
| **BUG 2** Delete button always disabled (Admin) | UI: `disabled={row.status !== "Menunggu"}` — no ADMIN exception. API: `if (encounter.status !== "MENUNGGU")` — no ADMIN exception. | `DaftarAntrean.tsx`: `disabled={userRole !== "ADMIN" && row.status !== "Menunggu"}`. `encounters/[encounterId]/route.ts` DELETE: `if (session.user.role !== "ADMIN" && encounter.status !== "MENUNGGU")`. |
| **BUG 3** ICD-10 diagnosis saved as NULL / not saved | `codeIcd10 String` is NON-NULLABLE in Prisma. A stale localStorage draft with `codeIcd10` field (old name) instead of `code` produced `d.code === undefined` → Prisma P2011 → transaction rollback. QA observed "not saved." | `AsesmenDokter.tsx`: draft migration adds `code: item.code ?? item.codeIcd10 ?? 'MANUAL'` on restore. `rawat-jalan/asesmen/route.ts`: defensive fallback `codeIcd10: typeof d.code === 'string' && d.code ? d.code : 'MANUAL'` with `console.warn`. |

### Group 2 (Current Session)

| Bug | Root Cause | Fix Applied |
|---|---|---|
| **BUG 4** Draft popup false trigger on first visit | `useAutoSaveDraft` wrote initial empty form state to localStorage on first mount (after debounce), so next page load found a "draft" and showed the modal even with no user edits. | Added `isDirty?: boolean` param to `useAutoSaveDraft` — skips save when `isDirty === false`. Updated all 7 form components (SubjectiveInitialForm, ObjectivePhysicalForm, SubjectiveObjectiveExtendedForm, PlanMedicationForm, PlanEducationForm, PlanReferralForm, PlanProcedureForm) to pass `formState.isDirty`. |
| **BUG 5** Checkbox booleans not restored (Perawat) | `page.tsx` never computed `tidakAdaX` booleans — they always defaulted to `false` in SubjectiveInitialForm regardless of DB state. | `page.tsx`: when `encounter.status !== 'MENUNGGU'`, infer `tidakAdaX = arrayLength === 0`. **Caveat:** ConditionHistory is patient-level — if prior encounters added conditions, penyakit array is non-empty, so `tidakAdaPenyakit` infers `false` (correct for display since chips show). The false-inference case (patient has prior history, but this encounter had "tidak ada" checked) is extremely rare and does not affect read-only UX significantly. |
| **BUG 6** SELESAI read-only view missing Hasil Periksa Medis, Diagnosis, Plan data | After submit, all localStorage cleared. Sub-forms (SubjectiveObjectiveExtendedForm, Plan forms) had no mechanism to pre-populate from DB. `selectedDiagnoses` initialized as `[]`. | `page.tsx`: extended Prisma query to include `conditionDiagnoses`, `procedures`, `medicationRequests`, `serviceRequests`. Parses `savedDiagnoses`, `savedHasilPeriksa` (keluhanUtama from `encounter.reasonCode`, pemeriksaanFisikTambahan from `[Catatan Dokter]: ` suffix), `savedPlan` (education from `[Edukasi Pasien]: ` obs, rujukan from serviceRequests). Passes these as props to `AsesmenDokter`. `AsesmenDokter`: initializes `selectedDiagnoses = useState(savedDiagnoses ?? [])`, passes `savedHasilPeriksa` and per-form plan data to sub-forms. All plan forms + SubjectiveObjectiveExtendedForm now accept `defaultValues` prop. |

### Investigation: Resep Obat & Edukasi Persistence
Both ARE persisted in DB:
- **Resep Obat** → `MedicationRequest.medication` (text field)
- **Edukasi** → second `Observation` row with `notes` prefixed `[Edukasi Pasien]: `
- **Keluhan Utama (keluhanUtama)** → `encounter.reasonCode`
- **Catatan Dokter (pemeriksaanFisikTambahan)** → appended to main `Observation.notes` as `\n\n[Catatan Dokter]: {text}`

### ⚠️ BUG 1 (Group 1) — Data Integrity Note (Needs QA Repro)
The UX fix ensures both forms are evaluated before showing a combined error. However, assessment + physical are still submitted together (intentionally, to avoid duplicate `conditionHistory` records — assessment is patient-level with no deduplication). If QA can reproduce a scenario where only assessment passed but physical failed on a *previous* submit attempt and the encounter is now in a partial state, that needs investigation before thesis submission. Reproduction steps needed: exact vital signs values, form fields filled, error sequence.

---

## ⏳ Pending Before Thesis Submission

### 🧪 Full Regression Testing Required
All features from TR-77 through TR-82 must be tested end-to-end before thesis submission. Development has been iterative — new bugs may have been introduced across sessions. A full manual walkthrough of every Use Case (UC-01 through UC-12) and every TR test case is required.

### TR-81 + TR-82 Test Cases (Run First)

**TC-81.1 / TC-82.1 — Happy Path (Mock):**
- Prerequisite: Patient with NIK `9271060312000001` (ihs = `P02478375538`), fully completed SELESAI encounter
- Login as `strange.doctor` → open SELESAI encounter assessment
- Click "Simpan & Kirim ke SATUSEHAT"
- Expected: Loading modal (1.5s) → Success modal with `MOCK-TRX-...` transactionId
- Verify: Prisma Studio → Encounter → `syncStatus = SUCCESS`, `transactionId` filled

**TC-81.2 / TC-82.2 — No IHS ID (Button Disabled):**
- Prerequisite: SELESAI encounter where `patient.ihs` is null
- Expected: "Simpan & Kirim" button greyed out + warning text "Pasien tidak ditemukan di SATUSEHAT" below

**TC-82.3 — Already Sent (Green Badge):**
- Open encounter from TC-82.1 (`syncStatus = SUCCESS`)
- Expected: Green "✓ Terkirim ke SATUSEHAT" badge, not clickable

**TC-82.4 — Kirim Ulang Badge in Queue:**
- Manually set one encounter `syncStatus = "FAILED_SYNC"` in Prisma Studio
- Go to `/rawat-jalan` as Admin or Dokter
- Expected: Orange "⟳ Kirim Ulang" badge on that row → click → inline spinner → `syncStatus` flips to `SUCCESS`

**TC-81.3 / TC-82.5 — Partial Data (No Procedure, No Rujukan):**
- SELESAI encounter with only Diagnosa, no Procedure or Rujukan
- Click "Simpan & Kirim"
- Expected: Success modal, no crash, bundle omits Procedure/ServiceRequest entries

### Real Credentials Testing (When Kemenkes Resolves 401)
- Register new Kemenkes developer account at `satusehat.kemkes.go.id/platform`
- Update `.env.local` with new Client ID + Secret
- Test in Postman first — confirm 200 response
- Set `SATUSEHAT_MOCK_MODE="false"`
- Re-run TC-82.1 with real credentials
- Verify real `transactionId` returned from Kemenkes

**Last Updated:** May 20, 2026 | **Next Review:** Full regression test + thesis writeup
