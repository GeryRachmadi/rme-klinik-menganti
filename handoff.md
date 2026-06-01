# 📋 Project Handoff & State

**Date:** June 2, 2026 | **Branch:** `claude`
**System:** EMR Klinik Pratama Menganti
**Status:** UC-01→UC-06 ✅ PASS. UC-07 ⏳ IN PROGRESS (BB-07.1–07.4 done).
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
| UC-07 | ⏳ IN PROGRESS | BB-07.1 Pass · BB-07.2 Fail · BB-07.3 Pass · BB-07.4 Pass · BB-07.5→07.17 To Do |
| UC-08 → UC-13 | ⏳ Pending | — |

---

## 🩺 UC-07 Current Status

**Done this session — Ringkasan tab fully redesigned (2-column episodic + longitudinal):**
- **Left column (episodic — last SELESAI visit):**
  - Diagnosis Aktif card — blue Utama tile / gray Sekunder tiles
  - Pengukuran Fisik Terakhir — BMI category label + bordered metric tiles
  - Tindakan Medis yang Diambil card — green `#ECFDF5` primary tile + gray secondary tiles
  - Perencanaan Medis card (dashed gray border) — Resep Obat + Edukasi/Anjuran with doctor signature avatar
- **Right column (longitudinal — all visits):** Riwayat Penyakit Terdahulu (amber chips), Riwayat Alergi, Pengobatan Rutin
- **Data architecture (as actually built):** single `prisma.patient.findUnique` in `riwayat-medis/[noRm]/page.tsx`. Episodic = most-recent `SELESAI` encounter. Longitudinal = patient-scoped tables (`conditionHistory` / `allergyIntolerance` / `medicationStatement`), deduplicated in `mapRingkasanData()`. **NOT** two parallel queries / `allEncounters` dedup — those tables carry `patientId`, not `encounterId`.
- ChipsInput dropdown fix: selecting a suggestion now commits the chip immediately (previously only filled the input, so dropdown picks were silently dropped on submit).

**Pending for UC-07:**
- BB-07.2 **FAIL** — Pendaftaran can access `/riwayat-medis` → needs `proxy.ts` guard
- BB-07.5–07.8 — Ringkasan sub-components (Diagnosis, Vitals, Allergies, Meds)
- BB-07.9–07.13 — Riwayat Kunjungan tab
- BB-07.14–07.17 — empty state, 404, API failure, navigation

---

## 🐛 Open Bug

**BB-07.2** — Pendaftaran role can open `/riwayat-medis/[noRm]` directly.
**Fix:** add `/riwayat-medis` to `src/proxy.ts` — allow PERAWAT, DOKTER, ADMIN only; block PENDAFTARAN.

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

---

## 📁 New Files (this session)

- `src/app/riwayat-medis/[noRm]/components/RingkasanTab.tsx` — the redesigned Ringkasan tab + all its sub-cards
- `src/components/shared/CalendarDateDropdown.tsx`
- `src/components/shared/ErrorState.tsx`
- `src/app/rawat-jalan/error.tsx`

---

## ⏳ Pending

- ⏳ Fix BB-07.2 (`proxy.ts` guard for `/riwayat-medis`)
- ⏳ Complete UC-07 blackbox testing (BB-07.5–17)
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
