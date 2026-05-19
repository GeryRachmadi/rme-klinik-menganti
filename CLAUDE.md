@AGENTS.md

# RME Klinik Pratama Menganti — Claude Code Context

## Project Overview
Sistem Rekam Medis Elektronik (RME) berbasis aplikasi web untuk Klinik Pratama Menganti Gresik.
Thesis project by Mohammad Geresidi Rachmadi (Gery), Information Systems ITS Surabaya.
Methodology: ICONIX Process. Language: Bahasa Indonesia (UI), English (code).

## Tech Stack
- Frontend + Backend: Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Database: PostgreSQL 16 (port 5433)
- ORM: Prisma 7 with PrismaPg adapter
- Auth: NextAuth.js beta (credentials provider, JWT strategy)
- Icons: lucide-react
- Fonts: Poppins (headings), Plus Jakarta Sans (body/form)
- RM-Number: #006B4E with semibold white font text
- Package runner: tsx (NOT ts-node)

## System Actors & Roles
- ADMIN → gery.admin → /beranda
- PENDAFTARAN → gabrielle.frontdesk → /beranda
- PERAWAT → fanny.nurse → /beranda
- DOKTER → strange.doctor & cynthia.doctor → /beranda
- All test accounts use password: password123

## Folder Structure
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  → NextAuth API handler
│   ├── beranda/
│   │   ├── layout.tsx                   → Auth protection
│   │   └── page.tsx                     → Placeholder (TR-3 WIP)
│   ├── login/
│   │   └── page.tsx                     → UC-01 Login page
│   ├── globals.css
│   ├── layout.tsx                       → Root layout with fonts
│   └── page.tsx                         → Redirect to /login
├── components/
│   ├── ui/                              → Reusable UI components
│   ├── layout/                          → Sidebar, Navbar, DashboardLayout
│   └── shared/                          → Shared page-level components
├── generated/prisma/                    → Prisma generated client
├── hooks/                               → Custom React hooks
├── lib/
│   ├── auth.ts                          → NextAuth config
│   └── prisma.ts                        → PrismaClient singleton
├── types/
│   └── next-auth.d.ts                   → NextAuth type extensions
└── utils/                               → Helper functions

## Design System & Tokens
- **Primary Teal:** #2BB5A0 (Active), #E6F5F4 (Bg), #4DD9C0 (Light), #009E95 (Dark)
- **Status Badges:** #10B981 (Aktif), #6B7280 (Arsip), #F59E0B (Pending), #EF4444 (Error)
- **Gender Badges:** #3B82F6 (Laki-laki), #EC4899 (Perempuan)
- **Jenis Pasien:** #06B6D4 (UMUM), #3B82F6 (BPJS)
- **UI Elements:** #64748B (Inactive text), #A0AEC0 (Placeholder), #E2E8F0 (Border), #F8FAFC (Bg subtle)
- **Border radius:** rounded-xl (inputs), rounded-full (buttons), rounded-3xl (cards)
- **Grid layout:** 12-column (grid-cols-12 gap-6) for all dashboards
- **Dashboard layout:** Welcome Card (col-span-12) → 4 KPI Cards (col-span-3) → Main Table (col-span-8) + Widget (col-span-4)

## URL Structure
- /login → Halaman login (UC-01)
- /beranda → Dashboard per role (UC-02)
- /rawat-jalan → Daftar antrean & kunjungan (UC-05, UC-06)
- /rekam-medis → Daftar pasien (UC-04, UC-07)
- /manajemen-pengguna → Kelola user (UC-03)
- /asesmen/[encounterId] → SOAP form (UC-08 to UC-12)

## Important Rules
- Always use Bahasa Indonesia for UI text, labels, and messages
- Use PrismaPg adapter when instantiating PrismaClient
- Use tsx to run TypeScript scripts (NOT ts-node)
- Font: Poppins for headings/buttons, Plus Jakarta Sans for body/form
- Never use English in user-facing text except for technical terms
- Route protection via layout.tsx using auth() from next-auth
- All form inputs use autoComplete="off"

## Critical Architectural Decisions (Guardrails)
- **Database Schema:** Address fields are kept "flat" in the Prisma schema to avoid complex joins (MVP phase). No soft deletes currently to respect P2003 constraints (Medical history privacy).
- **No. RM Format:** `RM-YYYYMM-XXXX` (e.g., RM-202604-0001).
- **Race Condition Prevention:** Server actions creating No. RM MUST use a `for` loop with max 3 retries catching Prisma `P2002` errors on the `noRm` field.
- **Zod Validations:** Always use `.coerce.date()` for dates. Implement "all-or-nothing" rule for Guardian data using `.superRefine()`. Empty optional strings MUST be mapped to `null` before database insertion.

## Git Workflow
- `feat: [description] (TR-XX)` → New feature or task
- `fix: [description] (TR-XX)` → Bug fix or corection
- `docs: [description]` → Update documentation
- `refactor: [description] (TR-XX)` → Refactor code
- *Example:* `feat: Build shared DashboardLayout component (TR-23)`

## Prisma Schema Key Models
Account, Practitioner, Patient, Encounter, ConditionHistory,
AllergyIntolerance, MedicationStatement, Observation,
ConditionDiagnosis, Procedure, MedicationRequest, ServiceRequest,
ICD10Reference, ICD9Reference, ActivityLog, SyncQueue

## Jira Project
- Project: Tugas Akhir - RME Klinik Pratama Menganti Gresik
- Key: TR
- Current progress: TR-79 Done (SATUSEHAT Phase 1 — schema + auth utilities complete)
- Next: TR-80 Auto-sync IHS ID on patient registration
- Backlog: TR-81 FHIR Bundle builder, TR-82 UI + error handling

## LATEST CHANGES (TR-13 SATUSEHAT Phase 1)

**Branch:** gemini

**Key architectural decisions:**
- Procedure codes renamed from CPT/CDT → ICD-9-CM. Field `codeCpt` → `codeIcd9` in Prisma schema, API route, Zod schema, transform utility, and all UI components. SATUSEHAT strictly requires ICD-9-CM. Mock constant renamed `CPT_CDT_MOCK` → `ICD9CM_MOCK`.
- Manual procedure entries are stored with `codeIcd9: null` in the database.
- `Encounter` model now has `syncStatus String @default("UNSYNCED")` and `transactionId String?` for SATUSEHAT sync tracking (values: UNSYNCED | SUCCESS | FAILED_SYNC).
- `src/lib/satusehat.ts` created with: `getSATUSEHATToken()` (in-memory OAuth2 cache, 60s proactive refresh), `getPatientIHSId(nik)` / `getPractitionerIHSId(nik)` (FHIR R4 identifier lookup), `toFHIRDateTime()` (WIB +07:00 offset), `formatVitalSign()` (null → dataAbsentReason).
- SATUSEHAT base URL: `https://api-satusehat-stg.dto.kemkes.go.id` (staging). Avoid legacy `/fhir/r4/` or `/oauth2/token` paths.
- Education notes stored as a second `Observation` record with `notes` prefixed `[Edukasi Pasien]:`.
- Plan validation: `PlanFormSchema` in `plan-schema.ts` requires at least one of procedure/medication/referral/education before submit.
- Draft detection: `useEffect` in `AsesmenDokter` uses flexible `checkLegacyDraft` helper that handles both `{data:{...}}` and raw `{...}` localStorage structures.
- All Plan forms expose `getValues()` on their ref (no internal validation triggered) for safe payload extraction.

**Status:** TR-77/78/79 complete. SATUSEHAT Phase 1 done. TR-80 (IHS auto-sync on patient registration) is next.

### TR-1 [SETUP] Project Infrastructure
- TR-14 ✅ Setup Next.js project dengan TypeScript dan Tailwind CSS
- TR-15 ✅ Setup PostgreSQL database dan konfigurasi Prisma ORM
- TR-16 ✅ Definisi Prisma schema berdasarkan Domain Model
- TR-17 ✅ Setup struktur folder dan routing Next.js App Router
- TR-18 ✅ Setup environment variables dan konfigurasi SATUSEHAT credentials

### TR-2 [UC-01] Login
- TR-19 ✅ Buat halaman Login UI
- TR-20 ✅ Setup NextAuth.js credentials provider
- TR-21 ✅ Implementasi role-based redirect (NEXT)
- TR-22 ✅ Implementasi validasi error handling login

### TR-3 [UC-02] Lihat Dashboard
- TR-23 ✅ Buat shared DashboardLayout component
- TR-24 ✅ Buat Dashboard Admin
- TR-25 ✅ Buat Dashboard Pendaftaran
- TR-26 ✅ Buat Dashboard Perawat
- TR-27 ✅ Buat Dashboard Dokter

### TR-4 [UC-03] Kelola Pengguna
- TR-28 ✅ Buat halaman Manajemen Pengguna UI
- TR-29 ✅ Buat form Tambah Akun Baru
- TR-30 ✅ Implementasi edit dan hapus akun
- TR-31 ✅ Implementasi toggle aktif/nonaktif
- TR-32 ✅ Buat API endpoint CRUD Account & Practitioner
- TR-33 ✅ Role-based access - hanya Admin

### TR-5 [UC-04] Daftar Pasien Baru
- TR-34 ✅ Buat halaman Rekam Medis UI
- TR-35 ✅ Buat form Tambah Pasien Baru
- TR-36 ✅ Validasi NIK 16 digit
- TR-37 ⏳ Integrasi SATUSEHAT API auto-fill (postponed)
- TR-38 ✅ Fallback pendaftaran manual
- TR-39 ✅ API endpoint CRUD Patient

### TR-6 [UC-05] Daftar Kunjungan
- TR-40 ✅ Buat form Tambah Kunjungan Baru
- TR-41 ✅ Generate nomor antrean U- dan G-
- TR-42 ✅ Form detail kunjungan
- TR-43 ✅ Opsi pendaftaran tanpa NIK
- TR-44 ✅ Error handling pasien belum terdaftar
- TR-45 ✅ API endpoint Encounter baru

### TR-7 [UC-06] Lihat Daftar Antrean
- TR-46 ✅ Buat halaman Rawat Jalan UI
- TR-47 ✅ Filter antrean
- TR-48 ✅ Role-based action Petugas Pendaftaran
- TR-49 ✅ Empty state dan error state
- TR-50 ✅ API endpoint fetch Encounter aktif

### TR-8 [UC-07] Lihat Riwayat Medis
- TR-51 ✅ Buat halaman Riwayat Medis UI
- TR-52 ✅ Komponen Riwayat Kunjungan timeline
- TR-53 ✅ Komponen Ringkasan Klinis
- TR-54 ✅ Empty state riwayat kosong
- TR-55 ✅ API endpoint fetch riwayat medis

### TR-9 [UC-08] Catat Kajian Awal
- TR-56 ✅ Buat halaman Asesmen UI
- TR-57 ✅ Form Kajian Awal input chips
- TR-58 ✅ Opsi "tidak ada" tiap field
- TR-59 ✅ Error handling preserve input state
- TR-60 ✅ API endpoint ConditionHistory, AllergyIntolerance, MedicationStatement

### TR-10 [UC-09] Catat Pemeriksaan Fisik
- TR-61 ✅ Form Pemeriksaan Fisik
- TR-62 ✅ Kalkulasi BMI otomatis
- TR-63 ✅ Validasi batas logis tanda vital
- TR-64 ✅ Konfirmasi dua opsi Kembali/Lanjut
- TR-65 ✅ API endpoint Observation

### TR-11 [UC-10] Input Diagnosis
- TR-66 ✅ Form Hasil Periksa Medis
- TR-67 ✅ Search ICD-10 autocomplete
- TR-68 ✅ Fallback input manual diagnosis
- TR-69 ✅ Read-only view Kajian Awal & Pemeriksaan Fisik
- TR-70 ✅ API endpoint ConditionDiagnosis

### TR-12 [UC-11] Catat Tindak Lanjut
- TR-71 ✅ Search CPT/CDT autocomplete (renamed from ICD-9 CM)
- TR-72 ✅ Fallback input manual tindakan
- TR-73 ✅ Form Resep Obat (PlanMedicationForm) dan Edukasi (PlanEducationForm)
- TR-74 ✅ Form Rujukan toggle (PlanReferralForm) dengan ghost-data prevention
- TR-75 ✅ Validasi plan: minimal 1 dari tindakan/resep/rujukan/edukasi wajib diisi
- TR-76 ✅ API endpoint Procedure, MedicationRequest, ServiceRequest, Observation (edukasi)
- TR-76.8 ⏳ Encounter Read-Only View & Admin Override (backlog)

### TR-13 [UC-12] Kirim Resume Medis
- TR-77 ✅ Refactoring terminologi medis: codeCpt → codeIcd9 (ICD-9-CM alignment)
- TR-78 ✅ Tambah syncStatus + transactionId ke model Encounter
- TR-79 ✅ Buat src/lib/satusehat.ts: OAuth2 token manager, IHS lookup, FHIR helpers
- TR-80 ⏳ Auto-sync IHS ID Pasien saat pendaftaran (UC-04 integration)
- TR-81 ⏳ FHIR Bundle builder: pack SOAP data → FHIR R4 transaction Bundle
- TR-82 ⏳ UI "Simpan & Kirim" + syncStatus flip + tombol Kirim Ulang

## TR-101 [UC-13] Kelola Rekam Medis
- TR-102 ✅ Setup action button handlers di Rekam Medis
- TR-103 ✅ Implementasi tombol View route ke UC-07
- TR-104 ✅ Implementasi tombol Edit patient
- TR-105 ✅ Implementasi tombol Delete patient
- TR-106 ✅ Integrasi dengan API endpoints
- TR 107 ✅ Error handling & validation