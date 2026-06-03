# 📋 Project Handoff & State

**Date:** June 3, 2026 | **Branch:** `claude`
**System:** EMR Klinik Pratama Menganti
**Status:** UC-01→UC-07 ✅ PASS. UC-08 ⏳ Not yet started.
**UAT:** June 5, 2026

---

## 🧪 Blackbox Testing Status

| UC | Status | Scenarios |
|---|---|---|
| UC-01 | ✅ PASS | 17/17 |
| UC-02 | ✅ PASS | 8/8 (+ additional scenarios) |
| UC-03 | ✅ PASS | 13/13 |
| UC-04 | ✅ PASS | 13/13 |
| UC-05 | ✅ PASS | 12/12 |
| UC-06 | ✅ PASS | 13/13 (1 Blocked: BB-06.8) |
| UC-07 | ✅ PASS | 19/19 |
| UC-08 → UC-13 | ⏳ Pending | — |

---

## 📍 Current Phase

UC-08 blackbox testing — not yet started.

---

## 🔑 Key Architectural Notes

- **Auth:** `auth()` from `src/lib/auth.ts` — never `useSession()`
- **Proxy:** `src/proxy.ts` (NOT `middleware.ts`)
- **ActivityLog:** write on all encounter + patient CRUD
- **isReadOnly:** SELESAI + not ADMIN
- **BMI categories:** <18.5 Kurus · 18.5–24.9 Normal · 25–29.9 Gemuk · ≥30 Obesitas
- **Manrope** loaded in `layout.tsx` (`--font-manrope`) for Ringkasan section titles
- **CalendarDateDropdown:** portal-based, `isMounted` guard required
- **Date filter value format:** `semua` | `hari-ini` | `minggu-ini` | `bulan-ini` | `tahun-ini` | `YYYY-MM-DD` | `YYYY-MM-DD|YYYY-MM-DD`
- **Riwayat Medis tabs:** PENDAFTARAN sees Profil tab only. Clinical tabs (Ringkasan, Riwayat Kunjungan, Riwayat Penyakit, Riwayat Alergi, Pengobatan Rutin) hidden via `PatientHistoryTabs`. Mulai Asesmen button hidden for PENDAFTARAN.
- **Longitudinal data architecture:** single `prisma.patient.findUnique` in `riwayat-medis/[noRm]/page.tsx`. Episodic = most-recent `SELESAI` encounter. Longitudinal = patient-scoped tables (`conditionHistories` / `allergyIntolerances` / `medicationStatements`) carry `patientId`, **not** `encounterId` — deduplicated in mapper via case-insensitive `dedupeById()`.

---

## 📁 New Files (this session)

- `src/app/riwayat-medis/[noRm]/components/RingkasanTab.tsx`
- `src/app/riwayat-medis/[noRm]/components/EncounterHistoryTab.tsx`
- `src/app/riwayat-medis/[noRm]/components/AllergyHistoryTab.tsx`
- `src/app/riwayat-medis/[noRm]/components/MulaiAsesmenButton.tsx`
- `src/app/riwayat-medis/[noRm]/error.tsx`
- `src/app/api/patients/[id]/active-encounter/route.ts`
- `src/components/shared/CalendarDateDropdown.tsx`
- `src/components/shared/ErrorState.tsx`
- `src/app/rawat-jalan/error.tsx`

---

## ⏳ Pending

- ⏳ UC-08 → UC-13 blackbox testing
- ⏳ UAT — June 5, 2026
- ⏳ Heuristic Evaluation
- ⏳ SATUSEHAT real credentials (pending Kemenkes)
- ⏳ Thesis BAB 4 writeup

---

## ❌ DO NOT DO

- ❌ No `middleware.ts` — use `proxy.ts`
- ❌ No `useSession()` — use `auth()`
- ❌ No `schema.prisma` changes
- ❌ No `ts-node` — use `tsx`
- ❌ No encounter/patient CRUD without ActivityLog
- ❌ No `createPortal` without `isMounted` guard (Next.js SSR)
- ❌ No millisecond division for age — use `getFullYear`/`getMonth`/`getDate`
