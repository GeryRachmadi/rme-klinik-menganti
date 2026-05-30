# 📋 Project Handoff & State: TR-82 UX Revisions Complete — Blackbox Testing Phase

**Date:** May 30, 2026 | **Session:** Blackbox Testing — UC-01 + UC-02 + UC-03 Complete, UC-04 In Progress
**Branch:** `claude`
**System:** Electronic Medical Record (RME) for Klinik Pratama Menganti
**Status:** ✅ UC-01 PASS. ✅ UC-02 PASS. ✅ UC-03 PASS.
UC-04 in progress — BB-04.7 pending fix.
UC-05 → UC-13 pending.

---

## ✅ UC-11 Summary (TR-71 → TR-76 + TR-76.8) — Previously Completed

All SOAP+Plan forms for Dokter and Perawat are complete with atomic DB write, CPT/CDT procedure codes, draft detection, and read-only enforcement. See prior handoff for full details.

---

## ✅ Completed Previous Session (May 19–20, 2026)

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

### TR-82: Simpan & Kirim UI + API ✅ COMPLETE (initial implementation)

**New file: `src/app/api/satusehat/submit/route.ts`**
- DOKTER/ADMIN only (401/403 for others)
- Calls `buildSatuSehatBundle()` to validate before sending; on throw → `syncStatus = FAILED_SYNC`, returns 400
- Mock: 1500ms delay → `syncStatus = SUCCESS`, `transactionId = "MOCK-TRX-<uuid>"` written to DB
- Non-mock: TODO placeholder falls through to same mock logic (no crash during dev)
- Outer try-catch: any unexpected error → `syncStatus = FAILED_SYNC`, returns 500

### SATUSEHAT Mock Mode (Unblocking Measure)

- Provider-side **401 Unauthorized** confirmed via Postman — not a client bug
- Support email sent to helpdesk@kemkes.go.id with Org ID and Client ID
- Added `SATUSEHAT_MOCK_MODE="true"` to `.env.local`
- Mocks added to: `getSATUSEHATToken()`, `getPatientIHSId()`, `getPractitionerIHSId()` in `src/lib/satusehat.ts`
- **Happy path Practitioner NIK:** `7209061211900001` → IHS: `10009880728`
- To disable: set `SATUSEHAT_MOCK_MODE="false"` in `.env.local`

---

## ✅ Completed This Session (May 21, 2026) — TR-82 UX Revisions

### 1. SATUSEHAT Mock Patient Data Expanded (10 Patients)

- **File modified:** `src/lib/satusehat.ts` — `getPatientIHSId()` mock block
- Changed from single hardcoded NIK check → 10-patient `Record<string, {ihsId, name}>` lookup
- Source: Official Kemenkes sandbox patient dataset
- NIK trim applied before lookup (`nik.trim()`)
- Returns `null` if NIK not in map (no crash)

| NIK | IHS ID | Name |
|---|---|---|
| 9271060312000001 | P02478375538 | Ardianto Putra |
| 9204014804000002 | P03647103112 | Claudia Sintia |
| 9104224509000003 | P00805884304 | Elizabeth Dior |
| 9104223107000004 | P00912894463 | Dr. Alan Bagus Prasetya |
| 9104224606000005 | P01654557057 | Ghina Assyifa |
| 9104025209000006 | P02280547535 | Salsabilla Anjani Rizki |
| 9201076001000007 | P01836748436 | Theodore Elisjah |
| 9201394901000008 | P00883356749 | Sonia Herdianti |
| 9201076407000009 | P01058967035 | Nancy Wang |
| 9210060207000010 | P02428473601 | Syarif Muhammad |

### 2. TR-82 UX Revision — Merged "Simpan & Kirim" into "Simpan Asesmen"

**Problem:** Previous implementation had a standalone "Simpan & Kirim ke SATUSEHAT" second button below the main save button. Confusing UX — two separate actions for what should be one workflow.

**Solution:** SATUSEHAT sync now triggers **automatically** after a successful "Simpan Asesmen" submit, when `patientIhs` is available.

**Key changes to `AsesmenDokter.tsx`:**
- Removed: standalone "Simpan & Kirim ke SATUSEHAT" button and its green "✓ Terkirim" badge
- Removed: `Send` icon import from lucide-react
- **Modified `handleCentralSubmit`**: after DB save succeeds, calls `await handleSatuSehatSubmit()` directly when `patientIhs` is set. `handleSatuSehatSubmit` has its own try/catch and never re-throws.
- **Footer restructured**: outer `flex flex-col items-end gap-1` → inner button row (`flex gap-3 items-center`) → SATUSEHAT status hint `<p>` below row
- **SATUSEHAT status hint** (below button row, 4 states):
  - `localSyncStatus === 'SUCCESS'` → green "✓ Terkirim ke SATUSEHAT · ID: {transactionId}"
  - `localSyncStatus === 'FAILED_SYNC'` → red "⚠ Gagal dikirim ke SATUSEHAT"
  - `patientIhs` set → teal "✓ Data akan dikirim ke SATUSEHAT secara otomatis"
  - `patientIhs` null → gray "Pasien tidak terdaftar di SATUSEHAT"

### 3. Button Height Fix — Batal vs Simpan Asesmen

**Problem:** "Batal" button was shorter than "Simpan Asesmen" button due to missing `min-w-[120px] flex justify-center items-center` classes.

**Fix:** Added `min-w-[120px] flex justify-center items-center` to "Batal" button classes. Both buttons now have identical height and minimum width.

### 4. Footer Layout Restructure

**Problem:** SATUSEHAT status subtext was inside the "Simpan Asesmen" button wrapper's flex column, making it taller than "Batal" (single-row button).

**Fix:** Moved subtext outside button wrappers. Layout:
```
<div flex flex-col items-end gap-1>        ← outer column
  <div flex gap-3 items-center>            ← button row (equal height)
    [Batal]  [Simpan Asesmen]
  </div>
  <p class="text-xs ...">status hint</p>  ← subtext below BOTH buttons
</div>
```

### 5. Move "Kirim Ulang" from Queue Table to Assessment Page

**Problem:** Interactive "⟳ Kirim Ulang" button in `DaftarAntrean.tsx` STATUS cell caused a design inconsistency — sync actions should originate from the assessment page, not the queue table.

**Changes to `DaftarAntrean.tsx`:**
- Removed: `syncingId` state variable
- Removed: `handleKirimUlang()` async function (POST to `/api/satusehat/submit`)
- FAILED_SYNC STATUS cell → static chip (no click action):
  ```jsx
  <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 border border-red-200">
    ⚠ Gagal: Sinkronisasi SATUSEHAT
  </span>
  ```
- `syncStatus?: string` kept in `AntreanData` interface (still needed for chip display)

**Changes to `AsesmenDokter.tsx`:**
- Added **mount-only `useEffect`** (empty deps `[]`):
  ```typescript
  useEffect(() => {
    if (syncStatus === 'FAILED_SYNC') {
      setSubmitState('error');
      setErrorMessage('Sinkronisasi sebelumnya gagal. Silakan kirim ulang.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  ```
- FAILED_SYNC encounters auto-show the Error modal on page load with a "Kirim Ulang" button inside it
- No conflict with draft modal: draft effect returns early when `encounterStatus === 'SELESAI'`

### 6. Error Modal Patient Info Added

Error modal now shows patient identity above the error message:
```jsx
<p className="text-sm text-gray-500 mt-1">
  {patient?.namaLengkap} — <span className="font-semibold text-[#0F766E]">{patient?.noRm}</span>
</p>
```

### 7. FAILED_SYNC Chip Text Format

Changed from `"⚠ Gagal Dikirim"` → `"⚠ Gagal: Sinkronisasi SATUSEHAT"` following the `"Gagal: (reason)"` pattern to allow future failure types to use the same format.

---

## ✅ Completed This Session — UI/UX Polish

### Rawat Jalan Pagination

- **File:** `src/components/shared/DaftarAntrean.tsx`
- Copied exact pagination logic from `DaftarPasien` (rekam-medis) — identical `LIMIT`, `getPageNumbers`, and UI components
- Client-side slicing of `filteredData` — no API changes, existing fetch strategy preserved
- `LIMIT = 6` rows per page
- `currentPage` resets to 1 on any filter change (search, date, priority, status)
- Full pagination UI: Prev/Next + smart page numbers with ellipsis (teal styling matching rekam-medis)
- Record count footer: "Menampilkan X dari Y antrean"

### Functional Navbar Global Search

- **New file:** `src/lib/nav-items.ts` — plain TS constants (no JSX/icons). `NavItem[]` with `label`, `href`, `description` (keyword-rich string), `roles[]`
- **New file:** `src/components/shared/GlobalSearch.tsx` — Client Component:
  - Filters routes by `userRole` (role-aware: ADMIN sees Manajemen Pengguna, others do not)
  - Matches query against both `label` AND `description` (e.g. typing "antrean" finds "Rawat Jalan")
  - Full autocomplete keyboard nav: ArrowDown/Up moves `selectedIndex`, Enter navigates, Escape clears
  - Highlighted item: `bg-[#E6F5F4] text-[#0F766E]` (matches existing assessment autocomplete pattern)
  - `handleBlur` with `setTimeout(150)` — same pattern as `AssessmentDiagnosisForm`
  - `useRef` + `mousedown` for click-outside detection
  - Empty state: "Tidak ada hasil untuk …"
  - `z-50` dropdown, `ArrowRight` icon on each result
- **Updated:** `Navbar.tsx` — dummy `<input>` replaced with `<GlobalSearch userRole={role} />` (`role` prop already existed, no new prop drilling)

### Role-Based Notification Bell

- **New file:** `src/app/actions/notification.ts` — Server Action (`"use server"`):
  - WIB-aware today boundaries (`+07:00` offset, consistent with dashboard pattern)
  - Role-based queries using correct Encounter statuses:
    - `PERAWAT`     → `status = "MENUNGGU"` (all pending, any date)
    - `DOKTER`      → `status = "DIPERIKSA"` (nurse done, waiting for doctor)
    - `PENDAFTARAN` → `status = "MENUNGGU"` today only
    - `ADMIN`       → all encounters today regardless of status
  - Joins `patient.namaLengkap` for display
  - Returns max 10, ordered by `createdAt DESC`
  - Result shape: `{ id, title, message, createdAt, href, isRead: false }`
  - `href` → `/rawat-jalan/${encounterId}/asesmen` for all roles
  - **No `schema.prisma` changes** — derived from existing `Encounter` data only
- **New file:** `src/components/shared/NotificationDropdown.tsx` — Client Component:
  - Red badge on bell icon (hidden when count = 0, capped at "9+")
  - **Lazy fetch:** fires only when dropdown opens, re-fetches on every open (no stale data)
  - `isRead` persistence via `sessionStorage('notif_read_ids')` — survives navigation within session, clears on tab close
  - Unread items: full opacity + teal left accent bar (`bg-[#2BB5A0]`)
  - Read items: `opacity-50` + gray bar
  - Scrollable list capped at `max-h-[360px]`
  - `useRef` + `mousedown` for click-outside, `z-50` on dropdown
  - Empty state: "Tidak ada notifikasi baru."
  - On click: marks as read in `sessionStorage`, then `router.push(href)`
- **Updated:** `Navbar.tsx` — static bell `<button>` replaced with `<NotificationDropdown userRole={role} />` (`role` already a prop)

---

## ✅ Completed This Session — React Doctor Audit & Fixes

### React Doctor Audit — Final: v0.2.3, 69/100, 0 Critical Issues

Score journey (tool kept auto-updating mid-session):
- 72/100 — v0.2.1, pre-fix (3 critical issues)
- 74/100 — v0.2.1, after critical fixes
- 66/100 — v0.2.2 installed (new rule categories added: Performance, stricter State/Effects — score drop is tool regression, not code regression)
- 68/100 — v0.2.2, after 2 remaining critical fixes
- 70/100 — v0.2.2, after button type + ellipsis + array key fixes
- 69/100 — v0.2.3 installed (Dead Code analysis now working, 103 unused files detected)

Critical issues fixed (0 critical ✗ remaining):
- Rules of Hooks: AssessmentDiagnosisForm.tsx — useEffect + useState moved above early return
- Nested Component: PatientHistoryTabs.tsx — EmptyBadge extracted to module level
- Missing Server Auth: encounter.ts + patient.ts — auth() guard added (ADMIN/PENDAFTARAN only)

Score boost fixes:
- 49x type="button" added to all button elements
- 20x "..." → "…" typographic ellipsis in JSX text
- 14x array index keys replaced with stable identifiers

New: Dead Code category (v0.2.3, dead-code analysis now working):
- 103 "unused files" — likely false positives from dynamic imports, lazy loading, ICD reference data files, and config files. DO NOT mass-delete without manual verification per file.
- 1 "unused dependency: pg" — FALSE POSITIVE. pg is required by PrismaPg adapter (indirect dependency). Do NOT remove from package.json.

Intentionally ignored (stable, working code — risky to refactor pre-demo):
- Architecture: 202 issues (Tailwind size shorthand, font-bold headings)
- A11y: 140 issues (not in thesis evaluation criteria)
- State/Effects: 130 issues (useReducer/useEffect refactors — high risk)
- Dead Code: 104 issues (see note above — verify before acting)
- Performance: 23 issues (micro-optimizations)

---

## 🔍 Jira Ticket Audit Findings (May 21, 2026)

Static codebase audit vs Jira backlog. No code changes made.

| Ticket | Expected | Found in Code | Status |
|---|---|---|---|
| TR-44 (subtask: no-NIK fallback) | Fallback manual registration without NIK | `NONIK-{timestamp}` prefix in `createPatient()` | ✅ Already done |
| TR-161 (NIK validation 16 digits) | Validate NIK length | Zod schema in patient form: `z.string().length(16)` | ✅ Already done |
| TR-162 (duplicate NIK guard) | Block duplicate NIK registration | Prisma unique constraint + P2002 catch in `createPatient()` | ✅ Already done |
| TR-163 (error handling patient form) | Show user-facing errors | Toast with specific field errors in registration form | ✅ Already done |
| TR-81 | FHIR Bundle builder | `src/lib/bundleBuilder.ts` fully implemented | ✅ Complete |
| TR-82 | UI submit + error handling | `AsesmenDokter.tsx` + `/api/satusehat/submit` implemented | ✅ Complete |
| TR-127/TR-110 | Edit/Delete encounter | `EncounterEditDrawer.tsx` + DELETE in `[encounterId]/route.ts` | ✅ Already done |
| TR-37 | SATUSEHAT NIK auto-fill on patient reg | Bypassed — IHS ID fetched async post-create instead | ✅ Safely bypassed |

---

## 📁 Current File Structure (as-built)

```
src/app/rawat-jalan/[encounterId]/asesmen/
├── page.tsx                               ← ACTIVE_STATUSES includes SELESAI; userRole prop-drilled
└── components/
    ├── AsesmenDokter.tsx                  ← Auto-sync on save; auto Error modal on FAILED_SYNC; footer restructured
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
    ├── route.ts                           ← GET + PUT + DELETE
    ├── assessment/route.ts
    └── physical-exam/route.ts

src/components/shared/
├── DaftarAntrean.tsx                      ← Static FAILED_SYNC chip; no more handleKirimUlang
├── EncounterRegistrationDrawer.tsx
└── EncounterEditDrawer.tsx

src/app/globals.css                        ← Fixed: single @import, single body, @theme inline with Jakarta/Poppins
src/hooks/useAutoSaveDraft.ts              ← isReadOnly param skips localStorage writes

src/lib/
├── bundleBuilder.ts                       ← buildSatuSehatBundle() + FHIRBundle type (TR-81)
└── satusehat.ts                           ← 10-patient mock lookup; OAuth2 token cache; FHIR helpers

src/app/api/satusehat/
└── submit/route.ts                        ← POST handler for SATUSEHAT sync (TR-82)
```

---

## 🔑 Key Architectural Notes

**Unified save+sync flow (AsesmenDokter):**
```typescript
// Inside handleCentralSubmit, after successful DB save:
showSuccess('Asesmen dan rencana tindak lanjut berhasil disimpan!');
if (patientIhs) {
  await handleSatuSehatSubmit(); // has own try/catch, never re-throws
  setIsSubmittingCentral(false);
} else {
  setTimeout(() => router.push('/rawat-jalan'), 2000);
}
```

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

## 🎯 Jira Status (as of May 21, 2026)

### ✅ COMPLETED TASKS (TR-13 Epic — UC-12 SATUSEHAT)

| Task | Status | Details |
|---|---|---|
| TR-77 | ✅ | codeCpt → codeIcd9 rename across all files |
| TR-78 | ✅ | Encounter syncStatus + transactionId schema |
| TR-79 | ✅ | satusehat.ts — OAuth2 + IHS lookup + FHIR helpers |
| TR-80 | ✅ | Auto-sync IHS ID on patient registration (non-blocking) |
| TR-81 | ✅ | FHIR Bundle builder (6 resource types) |
| TR-82 | ✅ | Submit API + merged save+sync UI + status hint + auto Error modal |

### ⚠️ ARCHITECTURAL CONSTRAINTS & BLIND SPOTS
1. **Strict Base URL:** Always use `https://api-satusehat-stg.dto.kemkes.go.id` as the environment variable. Avoid legacy sub-paths like `/fhir/r4/` or `/oauth2/token`.
2. **Missing IHS Handling:** If `patient.ihs` is null, sync is skipped silently. The footer hint reads "Pasien tidak terdaftar di SATUSEHAT".
3. **Data Absent Reason:** Unmeasured vital signs emit `dataAbsentReason: unknown` — never `null` — to prevent Kemenkes validation rejections.
4. **SATUSEHAT_MOCK_MODE:** Set `"true"` in `.env.local` during development. **Disable before final thesis testing** (`SATUSEHAT_MOCK_MODE="false"`).
5. **No idempotency guard in submit route:** Re-submitting a SUCCESS encounter overwrites `transactionId`. Not user-facing issue since the UI doesn't expose "Kirim Ulang" on SUCCESS encounters.

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
- ✅ TR-82: "Simpan & Kirim" UI + syncStatus flip + auto Error modal on FAILED_SYNC
- ✅ TR-82 UX Revisions: Merged button, footer restructure, static chip in queue, 10-patient mock data
- ✅ UC-13: Kelola Rekam Medis — View/Edit/Delete patient (TR-101 → TR-107)
- ✅ Rawat Jalan pagination (client-side, LIMIT=6, matches rekam-medis pattern)
- ✅ Functional Navbar global search (role-aware autocomplete, label + keyword matching)
- ✅ Role-based notification bell (derived from Encounter, no DB migration)
- ⏳ **Full blackbox regression testing (UC-01 → UC-13)**
- ⏳ Real credentials testing (when Kemenkes resolves 401)
- ⏳ Thesis writeup

---

## 🐛 QA Bug Fixes (May 2026)

### Group 1 (Previous Session)

| Bug | Root Cause | Fix Applied |
|---|---|---|
| **BUG 1** Kajian Awal not saved (Perawat) | Physical exam validation failure set `physicalData=null`, causing early return BEFORE assessment API call. UX: error message only named the second failing section. | `AsesmenPerawat.tsx`: combined error collection — both forms validated first; single toast shows all failing sections. |
| **BUG 2** Delete button always disabled (Admin) | UI: `disabled={row.status !== "Menunggu"}` — no ADMIN exception. API: same issue. | `DaftarAntrean.tsx`: `disabled={userRole !== "ADMIN" && row.status !== "Menunggu"}`. DELETE route: ADMIN bypass. |
| **BUG 3** ICD-10 diagnosis saved as NULL / not saved | Stale localStorage draft with `codeIcd10` field (old name) instead of `code` → Prisma P2011 → rollback. | Draft migration adds `code: item.code ?? item.codeIcd10 ?? 'MANUAL'`. API defensive fallback. |

### Group 2 (Previous Session)

| Bug | Root Cause | Fix Applied |
|---|---|---|
| **BUG 4** Draft popup false trigger on first visit | `useAutoSaveDraft` wrote initial empty form state to localStorage on first mount. | Added `isDirty?: boolean` param — skips save when `isDirty === false`. All 7 form components pass `formState.isDirty`. |
| **BUG 5** Checkbox booleans not restored (Perawat) | `page.tsx` never computed `tidakAdaX` booleans — always defaulted `false`. | When `encounter.status !== 'MENUNGGU'`, infer `tidakAdaX = arrayLength === 0`. |
| **BUG 6** SELESAI read-only view missing plan data | Sub-forms had no mechanism to pre-populate from DB after localStorage cleared. | Extended Prisma query; parse `savedDiagnoses`, `savedHasilPeriksa`, `savedPlan`; pass as props; initialize state from props. |

### ⚠️ BUG 1 (Group 1) — Data Integrity Note (Needs QA Repro)
The UX fix ensures both forms are evaluated before showing a combined error. However, assessment + physical are still submitted together. If QA can reproduce a scenario where only assessment passed on a prior attempt and the encounter is now in a partial state, that needs investigation before thesis submission.

---

## 🧪 Blackbox Testing Plan

### TR-81 + TR-82 Test Cases

**TC-82.1 — Happy Path (Mock, Auto-Sync):**
- Prerequisite: MENUNGGU encounter with patient NIK `9271060312000001` (IHS: `P02478375538`)
- Login as `strange.doctor` → complete SOAP form → click "Simpan Asesmen"
- Expected: Save succeeds → Loading modal (1.5s) → Success modal with `MOCK-TRX-...` transactionId
- Expected footer hint: "✓ Terkirim ke SATUSEHAT · ID: MOCK-TRX-..."
- Verify: Prisma Studio → Encounter → `syncStatus = SUCCESS`, `transactionId` filled
- **STATUS: NOT YET TESTED**

**TC-82.2 — No IHS ID (Sync Skipped Silently):**
- Prerequisite: MENUNGGU encounter where `patient.ihs` is null (use NIK not in sandbox list)
- Click "Simpan Asesmen"
- Expected: Save succeeds → redirects to `/rawat-jalan` (no SATUSEHAT attempt)
- Expected footer hint before save: "Pasien tidak terdaftar di SATUSEHAT"
- **STATUS: NOT YET TESTED**

**TC-82.3 — SELESAI + SUCCESS (Read-Only Hint):**
- Open a SELESAI encounter from TC-82.1 (`syncStatus = SUCCESS`)
- Expected: Footer hint shows "✓ Terkirim ke SATUSEHAT · ID: MOCK-TRX-..."
- Expected: "Simpan Asesmen" button is disabled (read-only mode)
- **STATUS: NOT YET TESTED**

**TC-82.4 — FAILED_SYNC Auto-Show Error Modal:**
- Manually set one encounter `syncStatus = "FAILED_SYNC"` in Prisma Studio
- Navigate to that encounter's asesmen page as `strange.doctor`
- Expected: Error modal auto-appears on mount with "Sinkronisasi sebelumnya gagal. Silakan kirim ulang." message
- Expected: Patient name and noRm shown in modal
- Click "Kirim Ulang" in modal
- Expected: Loading modal → Success modal → `syncStatus = SUCCESS` in DB
- **STATUS: NOT YET TESTED**

**TC-82.5 — FAILED_SYNC Static Chip in Queue:**
- Manually set one encounter `syncStatus = "FAILED_SYNC"` in Prisma Studio
- Go to `/rawat-jalan`
- Expected: Static chip "⚠ Gagal: Sinkronisasi SATUSEHAT" in STATUS cell (not clickable)
- **STATUS: NOT YET TESTED**

**TC-82.6 — Partial Data (No Procedure, No Rujukan):**
- SELESAI encounter with only Diagnosa, no Procedure or Rujukan
- (If encounter still in MENUNGGU: fill SOAP with only diagnosis, no plan items → this won't pass plan validation. Use Prisma Studio to set status SELESAI + fill minimal DB data.)
- Expected: bundle build succeeds; Success modal; Procedure/ServiceRequest absent from bundle log
- **STATUS: NOT YET TESTED**

**TC-82.7 — 10-Patient Mock Coverage:**
- Register 3 different patients using NIKs from the mock table (e.g., `9204014804000002`, `9104224509000003`, `9201076001000007`)
- Complete SOAP and submit for each
- Expected: Each shows IHS ID populated in Prisma Studio after registration; sync succeeds
- **STATUS: NOT YET TESTED**

### Full UC Regression Test Cases

| UC | Description | Roles |
|---|---|---|
| UC-13 | Kelola Rekam Medis (View/Edit/Delete pasien) | Pendaftaran, Admin |

All existing TC 1.x through TC 3.x test cases must be re-run after TR-82 UX changes. Prioritize:
- TC for UC-08 (Kajian Awal): verify BUG 4 fix — no false draft modal on first visit
- TC for UC-09 (Pemeriksaan Fisik): verify BUG 5 fix — checkboxes restore correctly in read-only
- TC for UC-11 (Tindak Lanjut): verify BUG 6 fix — plan data shows in SELESAI read-only view
- TC for UC-12 (Kirim Resume): run TC-82.1 through TC-82.7 above

### Real Credentials Testing (When Kemenkes Resolves 401)
- Register new Kemenkes developer account at `satusehat.kemkes.go.id/platform`
- Update `.env.local` with new Client ID + Secret
- Test in Postman first — confirm 200 response for `/oauth2/v1/accesstoken`
- Set `SATUSEHAT_MOCK_MODE="false"`
- Re-run TC-82.1 with real credentials
- Verify real `transactionId` returned from Kemenkes FHIR endpoint

---

## 🧪 Blackbox Testing Status (May 28, 2026)

| UC | Description | Status |
|---|---|---|
| UC-01 | Login | ✅ PASS — 17/17 scenarios |
| UC-02 | Lihat Dashboard | ✅ PASS — all 8 scenarios (multiple bugs fixed) |
| UC-03 | Kelola Pengguna | ✅ PASS — 13/13 scenarios (multiple bugs fixed) |
| UC-04 | Daftar Pasien Baru | ⏳ In Progress — 11/13 Pass, 1 Fail (BB-04.7), 1 re-classified |
| UC-05 | Daftar Kunjungan | ⏳ Pending |
| UC-06 | Lihat Daftar Antrean | ⏳ Pending |
| UC-07 | Lihat Riwayat Medis | ⏳ Pending |
| UC-08 | Catat Kajian Awal | ⏳ Pending |
| UC-09 | Catat Pemeriksaan Fisik | ⏳ Pending |
| UC-10 | Input Diagnosis | ⏳ Pending |
| UC-11 | Catat Tindak Lanjut | ⏳ Pending |
| UC-12 | Kirim Resume Medis | ⏳ Pending |
| UC-13 | Kelola Rekam Medis | ⏳ Pending |

---

## 🐛 Bugs Found & Fixed (Blackbox Session May 28, 2026)

| ID | UC | Severity | Description | Status |
|---|---|---|---|---|
| BUG-001 | UC-01 | Minor | Silent middleware redirect, no toast shown to user | ✅ Fixed |
| BB-02.4 | UC-02 | Critical | Doctor dashboard data isolation leak (showing other doctor's patients) | ✅ Fixed |
| BB-02.2/3/4 | UC-02 | Major | Filter buttons decorative only (no effect); Prioritas column missing from queue table | ✅ Fixed |
| BB-02.1 | UC-02 | Moderate | Admin KPI metrics hardcoded (fake server/backup data, not from DB) | ✅ Fixed |
| BB-02.1 | UC-02 | Moderate | Log Aktivitas empty on Admin dashboard, not synced with notification events | ✅ Fixed |
| BB-02.1 | UC-02 | Moderate | Log only showed Admin/Pendaftaran actions — Nurse/Doctor clinical actions not logged | ✅ Fixed — writeActivityLog added to assessment, physical-exam, rawat-jalan/asesmen routes |
| BB-02.1 | UC-02 | Moderate | ENCOUNTER_CREATED log detail missing practitioner info | ✅ Fixed — rich format now includes "Ditugaskan ke" segment |
| BB-02.1 | UC-02 | Moderate | ENCOUNTER_UPDATED/DELETED log detail using old short format | ✅ Fixed — all 3 encounter log types use rich format |
| BB-02.1 | UC-02 | Moderate | Log Aktivitas had no pagination — flat list becomes unusable at scale | ✅ Fixed — client-side pagination (5/page) matching DaftarPasien pattern |
| BB-02.2/03/04 | UC-02 | Major | Filter button disabled placeholder — QueueFilterDropdown did not exist | ✅ Implemented — created QueueFilterDropdown.tsx, live client-side filtering |
| BB-02.1 | UC-02 | Minor | "Oleh" column in Log Aktivitas showed wrong person (not creator) | ✅ Fixed |
| BB-02.1 | UC-02 | Minor | Notification bell badge only appears after first click (not on page load) | ✅ Fixed |
| BB-02.3 | UC-02 | Minor | Nurse dashboard "Ruang Penugasan" card showed inaccurate/hardcoded data | ✅ Fixed |

---

## 🐛 Bugs Found & Fixed (Blackbox Session May 29–30, 2026 — UC-03)

| ID | Description | Status |
|---|---|---|
| BB-03.11 | Admin could deactivate own account | ✅ Fixed — Self-guard added to toggle API (403) + UI button disabled |
| BB-03.13 | Admin could delete own account | ✅ Fixed — Self-guard added to delete API (403) + UI button disabled |
| BB-03.7 | Duplicate NIK not validated on create | ✅ Fixed — NIK uniqueness check added to account create handler |
| BB-03.5 | Speciality subtitle shown for non-Doctor roles | ✅ Fixed — Subtitle now role-aware per role type |
| BB-03.3 | Search loading flash in ManajemenPengguna | ✅ Fixed — Switched to client-side filtering via useMemo |
| BB-03.3 | Same search flash in DaftarPasien (/rekam-medis) | ✅ Fixed — Same client-side fix applied to DaftarPasien.tsx |

---

## 🧪 UC-04 Blackbox Testing Results (May 30, 2026)

| ID | Scenario | Result |
|---|---|---|
| BB-04.1 | Authorization & UI Load | ✅ Pass |
| BB-04.2 | Search & Filter Data Pasien | ✅ Pass |
| BB-04.3 | Register Patient Manual Success | ✅ Pass |
| BB-04.4 | NIK Length Validation | ✅ Pass |
| BB-04.5 | Empty Mandatory Fields | ✅ Pass |
| BB-04.6 | Duplicate NIK P2002 | ✅ Pass |
| BB-04.7 | Guardian Logic - Under 17 | ❌ Fail — System allows submission without guardian for minors. Fix: enforce guardian fields mandatory when age < 17 using Zod `.superRefine()` + react-hook-form `watch('tanggalLahir')` |
| BB-04.8 | Guardian Logic - Over 60 | ✅ Re-classified as Pass — Per Indonesian medical law, guardian NOT mandatory for competent elderly patients. System behavior is correct. |
| BB-04.9 | No-NIK NONIK fallback | ✅ Pass |
| BB-04.10 | Tambah Pasien button hidden for non-Pendaftaran | ✅ Pass |
| BB-04.11 | NIK non-numeric validation | ✅ Pass |
| BB-04.12 | Boundary age exactly 17 | ✅ Pass |
| BB-04.13 | Boundary age exactly 60 | ✅ Pass |

---

## 📁 New Files Created (May 29, 2026)

| File | Purpose |
|---|---|
| `src/lib/activity-log.ts` | `writeActivityLog()` fire-and-forget utility — writes to ActivityLog table; never throws |
| `src/components/shared/QueueFilterDropdown.tsx` | Single-select 2-column filter panel (Prioritas + Status) for Pendaftaran/Perawat/Dokter queue tables |
| `src/app/beranda/error.tsx` | Error boundary for `/beranda` route |

---

## 📋 ActivityLog Write Coverage

All routes that write to ActivityLog (as of May 29, 2026):

| Route | Method | Action Type |
|---|---|---|
| `encounters/route.ts` | POST | `ENCOUNTER_CREATED` |
| `encounters/[encounterId]/route.ts` | PUT | `ENCOUNTER_UPDATED` |
| `encounters/[encounterId]/route.ts` | DELETE | `ENCOUNTER_DELETED` |
| `encounters/[encounterId]/assessment/route.ts` | POST | `ASSESSMENT_SAVED` |
| `encounters/[encounterId]/physical-exam/route.ts` | POST | `PHYSICAL_EXAM_SAVED` |
| `rawat-jalan/[encounterId]/asesmen/route.ts` | POST | `SOAP_COMPLETED` |
| `patients/route.ts` | POST | `PATIENT_CREATED` |
| `patients/[id]/route.ts` | PUT | `PATIENT_UPDATED` |
| `patients/[id]/route.ts` | DELETE | `PATIENT_DELETED` |

Detail string format for all encounter logs:
```
Pasien {namaLengkap} ({queueNumber}) · {priority} · {status} [· Ditugaskan ke {name} ({speciality})]
```
Practitioner segment omitted if no practitioner assigned.

---

## 🗄️ Schema Changes (May 28, 2026)

- **Encounter model:** Added `createdByAccountId String?` and `createdByAccount Account? @relation("EncounterCreatedBy")`
- **Account model:** Added back-relation `createdEncounters Encounter[] @relation("EncounterCreatedBy")`
- Ran `npx prisma db push` + `npx prisma generate` after changes

---

## ⏳ Pending (as of May 30, 2026)

- ⏳ **Fix BB-04.7** — Guardian fields mandatory for patients under 17 (prompt ready, not yet run). Fix: Zod `.superRefine()` + react-hook-form `watch('tanggalLahir')`
- ⏳ Continue Blackbox Testing UC-04 (after BB-04.7 fix) → UC-13
- ⏳ UAT with clinic staff on June 2nd, 2026
- ⏳ Heuristic Evaluation (internal)
- ⏳ SATUSEHAT real credentials (pending Kemenkes ticket resolution)
- ⏳ Thesis writeup BAB 4

---

## ❌ DO NOT DO

- ❌ Do NOT create `middleware.ts` — project uses `src/proxy.ts` (Next.js 16 convention)
- ❌ Do NOT write encounter CREATE/UPDATE/DELETE operations without also writing an ActivityLog entry
- ❌ Do NOT skip `npx prisma generate` after any schema change
- ❌ Do NOT use `useSession()` — SessionProvider is not set up in this project
- ❌ Do NOT use `ts-node` — use `tsx` for all TypeScript scripts
- ❌ Do NOT write patient operations without ActivityLog entries
- ❌ Do NOT use millisecond division for age calculation — use `getFullYear`/`getMonth`/`getDate` comparison or `date-fns` `differenceInYears`

---

**Last Updated:** May 30, 2026 | **Next Review:** Fix BB-04.7 → Continue Blackbox Testing UC-04 → UC-13 + UAT prep (June 2, 2026)
