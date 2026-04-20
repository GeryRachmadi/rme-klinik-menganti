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
- Package runner: tsx (NOT ts-node)

## System Actors & Roles
- ADMIN → gery.admin → /beranda
- PENDAFTARAN → gabrielle.frontdesk → /beranda
- PERAWAT → fanny.nurse → /beranda
- DOKTER → strange.practitioner → /beranda
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
- Current progress: TR-35 Subtask 3 Done (UC-04 Patient Registration UI & Backend logic complete)
- Next: TR-35 Subtask 4 (Migrate Daftar Pasien table to live Prisma data)

## Jira Tickets Summary

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
- TR-35 🟡 Buat form Tambah Pasien Baru
- TR-36 ⏳ Validasi NIK 16 digit
- TR-37 ⏳ Integrasi SATUSEHAT API auto-fill
- TR-38 ⏳ Fallback pendaftaran manual
- TR-39 ⏳ API endpoint CRUD Patient

### TR-6 [UC-05] Daftar Kunjungan
- TR-40 ⏳ Buat form Tambah Kunjungan Baru
- TR-41 ⏳ Generate nomor antrean U- dan G-
- TR-42 ⏳ Form detail kunjungan
- TR-43 ⏳ Opsi pendaftaran tanpa NIK
- TR-44 ⏳ Error handling pasien belum terdaftar
- TR-45 ⏳ API endpoint Encounter baru

### TR-7 [UC-06] Lihat Daftar Antrean
- TR-46 ⏳ Buat halaman Rawat Jalan UI
- TR-47 ⏳ Filter antrean
- TR-48 ⏳ Role-based action Petugas Pendaftaran
- TR-49 ⏳ Empty state dan error state
- TR-50 ⏳ API endpoint fetch Encounter aktif

### TR-8 [UC-07] Lihat Riwayat Medis
- TR-51 ⏳ Buat halaman Riwayat Medis UI
- TR-52 ⏳ Komponen Riwayat Kunjungan timeline
- TR-53 ⏳ Komponen Ringkasan Klinis
- TR-54 ⏳ Empty state riwayat kosong
- TR-55 ⏳ API endpoint fetch riwayat medis

### TR-9 [UC-08] Catat Kajian Awal
- TR-56 ⏳ Buat halaman Asesmen UI
- TR-57 ⏳ Form Kajian Awal input chips
- TR-58 ⏳ Opsi "tidak ada" tiap field
- TR-59 ⏳ Error handling preserve input state
- TR-60 ⏳ API endpoint ConditionHistory, AllergyIntolerance, MedicationStatement

### TR-10 [UC-09] Catat Pemeriksaan Fisik
- TR-61 ⏳ Form Pemeriksaan Fisik
- TR-62 ⏳ Kalkulasi BMI otomatis
- TR-63 ⏳ Validasi batas logis tanda vital
- TR-64 ⏳ Konfirmasi dua opsi Kembali/Lanjut
- TR-65 ⏳ API endpoint Observation

### TR-11 [UC-10] Input Diagnosis
- TR-66 ⏳ Form Hasil Periksa Medis
- TR-67 ⏳ Search ICD-10 autocomplete
- TR-68 ⏳ Fallback input manual diagnosis
- TR-69 ⏳ Read-only view Kajian Awal & Pemeriksaan Fisik
- TR-70 ⏳ API endpoint ConditionDiagnosis

### TR-12 [UC-11] Catat Tindak Lanjut
- TR-71 ⏳ Search ICD-9 CM autocomplete
- TR-72 ⏳ Fallback input manual tindakan
- TR-73 ⏳ Form Resep Obat dan Edukasi
- TR-74 ⏳ Form Rujukan toggle
- TR-75 ⏳ Validasi form kosong tetap bisa simpan
- TR-76 ⏳ API endpoint Procedure, ServiceRequest, MedicationRequest

### TR-13 [UC-12] Kirim Resume Medis
- TR-77 ⏳ Tombol Simpan & Kirim ke SATUSEHAT
- TR-78 ⏳ Susun data SOAP ke FHIR JSON Bundle
- TR-79 ⏳ Integrasi POST ke SATUSEHAT API
- TR-80 ⏳ Error handling retry queue
- TR-81 ⏳ Tombol Kirim Ulang retry