# 📋 Project Handoff & State

**Date:** June 10, 2026 | **Branch:** `claude`
**System:** EMR Klinik Pratama Menganti
**Status:** UC-01→UC-13 blackbox complete. Now in **UAT Remediation** (PIC heuristic-eval fixes).
**UAT:** Heuristic evaluation feedback being remediated by priority.

---

## 🎯 UAT Remediation Tracker

Fixes requested by the clinic PIC during UAT heuristic evaluation, worked by priority.

### Priority 0 — Critical Demo Blockers ✅ ALL DONE
| # | Item | Status |
|---|---|---|
| 1 | BB-11.14: Rujukan strict conditional validation (toggle ON → Tujuan & Alasan mandatory, block empty save) | ✅ Done |
| 2 | BB-11.15: Missing Referral data display in CPPT / Riwayat Medis UI | ✅ Done |
| 3 | Role-based queue filtering (hide MENUNGGU from Doctors, no action buttons on BATAL, no DIPERIKSA duplicates downstream) | ✅ Done |

### Priority 1 — Core Adjustments & Quick Wins (items 4–8 ✅ / 9 ⏳ pending test / 10–11 ⏳)
| # | Item | Status |
|---|---|---|
| 4 | Terminology: "Profil"→"Biodata", "Riwayat Kunjungan"→"CPPT", "Ringkasan"→"Kunjungan Terakhir" | ✅ Done |
| 5 | Enlarge initial-complaint text on Nurse dashboard | ✅ Done |
| 6 | Medical Profile hyperlink → prominent button for Doctor | ✅ Done |
| 7 | Allergy Severity → optional (drop required attr, keep DB schema) | ✅ Done |
| 8 | All fields in Doctor's Plan section mandatory (Tindakan, Resep, Edukasi) | ✅ Done |
| 9 | **Age & DoB: DoB calendar input + system-calculated Age display** | ⏳ Implemented, pending browser test |
| 10 | Visit History Header: move Diagnosis + Treatment data to top of history card | ⏳ Not started |
| 11 | Routine Medication: move input out of the prescription form module | ⏳ Not started |

### Priority 2 — Major Feature Overhaul ⏳ NOT STARTED
| # | Item | Status |
|---|---|---|
| 12 | Display CPPT history on doctor's dashboard before assessment begins | ⏳ Not started |
| 13 | Separate Compounded (Racikan) vs Non-compounded medication UI + "R/" prefix on print | ⏳ Not started |
| 14 | "Asesmen Keperawatan" (Nursing Assessment) integrated with Nursing ICD | ⏳ Not started |
| 15 | Dependency dropdown (Select Polyclinic → auto-filter Doctors) | ⏳ Not started |
| 16 | Geographic address input → searchable dropdown | ⏳ Not started |
| 17 | Nurse assignment feature during admission | ⏳ Not started |
| 18 | Lab Instructions field at top of Plan section | ⏳ Not started |
| 19 | Family Medical History tags/chips input in Initial Assessment | ⏳ Not started |
| 20 | Guarantor type (BPJS/Umum) input + BPA signature block on print | ⏳ Not started |

### Priority 3 — Low Priority ("Urusan Belakang") ⏳ NOT STARTED
| # | Item | Status |
|---|---|---|
| 21 | UI colors — interface looks "pale/kurang segar" (too white), tweak palette | ⏳ Not started |
| 22 | Login captcha (reCAPTCHA / Turnstile) | ⏳ Not started |

> Note: Admission Role Validation (Sev 0) already correct — **no action needed**.

---

## 🆕 This Session's Work (items 7, 8, 9 + a pre-existing doctor-route bug)

### Item 9 — DoB chip + live Age display
- `PatientHeader.tsx` (riwayat-medis) — blue DoB chip after NIK chip; local `formatDob()` helper (WIB, "15 Jan 1990").
- `PatientAssessmentHeader.tsx` (asesmen) — new optional `tanggalLahir?: Date|string|null` prop + same chip/helper.
- `asesmen/page.tsx` — passes `tanggalLahir={encounter.patient.tanggalLahir}` (already in the Prisma `select`).
- `PatientRegistrationDrawer.tsx` — live read-only "Umur: N tahun" below the existing DoB input, reusing existing `watchedDOB` + `calculateAge()`. BB-04.7 guardian logic untouched.
- DoB chip class (both headers): `bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-xs font-medium`.

### Item 8 — Doctor Plan fields all mandatory
- `src/lib/schemas/plan-schema.ts` — replaced the `.refine()` "at least one" with a per-field `.superRefine()` (Tindakan/Resep/Edukasi). **Rujukan `.superRefine()` (BB-11.14) left byte-for-byte untouched** as a separate chained refinement.
- `AsesmenDokter.tsx` — `planErrors` state; per-field inline errors + a consolidated `showError` toast listing only the empty fields ("Periksa kembali bagian: …").
- `PlanProcedureForm` / `PlanMedicationForm` / `PlanEducationForm` — `externalError` prop, red `*` required indicator, inline error line (Edukasi lost its "(Opsional)" label).
- API `rawat-jalan/[encounterId]/asesmen/route.ts` — server guards for all three. **Client/server parity:** manual Tindakan entries live inside `procedures` with `codeIcd9:"MANUAL"`, so `procedures.length > 0` is the single definition on both sides.

### Item 7 — Allergy Severity optional
- `reactionSeverity String?` already nullable; severity dropdown optional; API stores `severity || null`.

### Pre-existing bug fixed: doctor route silently dropped Kajian Awal chips
The doctor route (`rawat-jalan/[encounterId]/asesmen/route.ts`) never wrote `AllergyIntolerance` / `ConditionHistory` / `MedicationStatement` on a DIPERIKSA save — only section notes. Added a **Step 0** in the transaction:
- Doctor posts **raw unparsed chips**; parse server-side via `parseAllergyChip` / `parseMedicationChip` (pure utils, server-safe).
- These models are **patient-scoped (no `encounterId`)** → never `deleteMany({patientId})` (would wipe other visits). Uses **insert-if-not-exists keyed on `(patientId, bareName)`**; dedup on parsed bare name.
- **update-if-different:** when a bare name already exists, allergy `reactionSeverity` / medication `dosage` is updated in place if changed (lets the doctor correct what the nurse entered). ConditionHistory has no such field → skip-only.

---

## 🔑 Key Architectural Notes

- **Auth:** `auth()` from `src/lib/auth.ts` — never `useSession()`
- **Proxy:** `src/proxy.ts` (NOT `middleware.ts`)
- **ActivityLog:** write on all encounter + patient CRUD
- **isReadOnly:** SELESAI + not ADMIN
- **Two patient headers (not shared):** `riwayat-medis/.../PatientHeader.tsx` takes the full `Patient` object and computes age internally; `asesmen/.../PatientAssessmentHeader.tsx` takes a precomputed `age` string prop (+ now optional `tanggalLahir`).
- **Plan validation is central:** only `AsesmenDokter` runs `PlanFormSchema.safeParse`; the three Plan forms expose `getValues()` (no internal trigger) except the Referral form which validates via its own resolver.
- **Patient-scoped clinical tables** (`conditionHistories`/`allergyIntolerances`/`medicationStatements`) carry `patientId`, **not** `encounterId` — deduped in mapper; doctor & nurse routes must insert-if-not-exists, never delete by patientId.
- **BMI categories:** <18.5 Kurus · 18.5–24.9 Normal · 25–29.9 Gemuk · ≥30 Obesitas
- **CalendarDateDropdown:** portal-based, `isMounted` guard required
- **Section-level Kajian Awal notes** live on `Encounter` (episodic): `riwayatPenyakitNotes` / `riwayatAlergiNotes` / `pengobatanRutinNotes` (`String? @db.Text`).

---

## ⏳ Pending / Next

- ⏳ Browser-test Item 9 (DoB chips on both headers, live Age in registration form, DoB chip not rendering when `tanggalLahir` is null)
- ▶️ **Next up:** Priority 1 item 10 (Visit History header — Diagnosis + Treatment to top of card)
- ▶️ **Then:** Priority 1 item 11 (move Routine Medication out of prescription module — highest risk in Priority 1)
- ⏳ Priority 2 feature overhaul (items 12–20)
- ⏳ Priority 3 (palette refresh, login captcha)
- ⏳ SATUSEHAT real credentials (pending Kemenkes 401)
- ⏳ Thesis BAB 4 writeup

---

## ❌ DO NOT DO

- ❌ No `middleware.ts` — use `proxy.ts`
- ❌ No `useSession()` — use `auth()`
- ❌ No `schema.prisma` changes / migrations (freeze holds — items 7/8/9 needed none)
- ❌ No `ts-node` — use `tsx`
- ❌ No encounter/patient CRUD without ActivityLog
- ❌ No `createPortal` without `isMounted` guard (Next.js SSR)
- ❌ No millisecond division for age — use `getFullYear`/`getMonth`/`getDate`
- ❌ Do not touch the Rujukan (BB-11.14) validation or BB-04.7 guardian logic
