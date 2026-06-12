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

```
src/
├── app/
│   ├── actions/                  → Server actions (encounter, patient, notification)
│   ├── api/                      → Route handlers: auth, accounts, patients, encounters,
│   │                                dashboard (admin/dokter/pendaftaran/perawat),
│   │                                rawat-jalan/[encounterId], satusehat/submit
│   ├── beranda/                  → Dashboard per role (UC-02), layout.tsx = auth protection
│   ├── login/                    → UC-01 Login page
│   ├── manajemen-pengguna/       → UC-03 Kelola Pengguna
│   ├── rawat-jalan/              → UC-05/06 Daftar antrean & kunjungan
│   │   └── [encounterId]/asesmen/  → SOAP form (UC-08 → UC-12)
│   ├── rekam-medis/              → UC-04 / UC-13 Daftar pasien
│   ├── riwayat-medis/[noRm]/     → UC-07 Riwayat medis (+ components/)
│   ├── globals.css
│   ├── layout.tsx                → Root layout with fonts
│   └── page.tsx                  → Redirect to /login
├── components/
│   ├── ui/                       → Reusable UI primitives (e.g. SectionTitle)
│   ├── layout/                   → DashboardLayout, Navbar, Sidebar
│   └── shared/                   → Shared page-level components (dashboards per role, registration/edit drawers, delete modals, queue tables, ActivityLogTable, QueueFilterDropdown, UnauthorizedToast, ...)
├── generated/prisma/              → Prisma generated client
├── hooks/                          → Custom React hooks (autosave draft, form toast, patient search)
├── lib/
│   ├── auth.ts                    → NextAuth config
│   ├── prisma.ts                  → PrismaClient singleton
│   ├── satusehat.ts               → SATUSEHAT OAuth2 token cache + FHIR helpers
│   ├── bundleBuilder.ts           → FHIR R4 transaction Bundle builder
│   ├── activity-log.ts            → ActivityLog writer
│   ├── constants/                 → ICD-10 / ICD-9-CM mocks, validation bounds, storage keys
│   ├── schemas/                   → Zod schemas (assessment, plan, physical exam, procedure, hasil periksa)
│   ├── validations/                → Zod schemas (encounter, patient)
│   ├── mappers/                    → medical-records-mapper
│   ├── dummy-data/                 → Mock data (clinical summary, encounters, patient details)
│   ├── hooks/                      → Search hooks (diagnosis, procedure)
│   ├── types/                      → Shared TS types (e.g. hasil-periksa)
│   └── utils/                      → BMI calculator, date/draft helpers, parsers, transforms
├── types/                          → NextAuth, API, patient type extensions
└── utils/                          → Helper functions
```

## Design System & Tokens
- **Primary Teal:** #2BB5A0 (Active), #E6F5F4 (Bg), #4DD9C0 (Light), #009E95 (Dark)
- **Status Badges:** #10B981 (Aktif), #6B7280 (Arsip), #F59E0B (Pending), #EF4444 (Error)
- **Gender Badges:** #3B82F6 (Laki-laki), #EC4899 (Perempuan)
- **Jenis Pasien:** #06B6D4 (UMUM), #3B82F6 (BPJS)
- **UI Elements:** #64748B (Inactive text), #A0AEC0 (Placeholder), #E2E8F0 (Border), #F8FAFC (Bg subtle)
- **Filter Selected:** bg-[#2DD4BF]/10, border-[#2DD4BF]/30, text-[#006B5F]
- **Filter Hover:** bg-[#F4F4F4], text-[#50555C]
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
- **Route Protection:** middleware.ts was DELETED. Project uses `src/proxy.ts` for route protection (Next.js 16 convention). Non-ADMIN accessing /manajemen-pengguna redirects to /beranda?error=unauthorized.
- **ActivityLog Rule:** EVERY encounter CREATE, UPDATE, DELETE must write an ActivityLog entry. For DELETE: capture encounter data BEFORE the delete transaction runs. Use `session.user.id` as actor.
- **createdByAccountId:** Encounter model has `createdByAccountId String?` linking to Account. Populated on encounter creation. Used by ActivityLogTable "Oleh" column.
- **Prisma Client Regeneration:** After any schema change run `npx prisma db push` then `npx prisma generate`. If runtime "Unknown field" errors appear: DELETE `src/generated/prisma` entirely then regenerate.

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
- Current progress: React Doctor v0.2.3 audit complete (69/100, 0 critical issues). UC-13 (TR-101→TR-107) confirmed complete.
- Next: Full blackbox regression testing (UC-01 → UC-13)
- Backlog: Real credentials testing when Kemenkes resolves 401, thesis writeup

## UAT Remediation Tracker

Fixes requested by the clinic PIC during UAT heuristic evaluation, worked by priority. (See `handoff.md` for session-level details.)

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
| 9 | Age & DoB: DoB calendar input + system-calculated Age display | ⏳ Implemented, pending browser test |
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

## Known Issues / Current Bugs

- **SATUSEHAT staging 401 Unauthorized:** OAuth2 token requests from `getSATUSEHATToken()` (`src/lib/satusehat.ts`) to `https://api-satusehat-stg.dto.kemkes.go.id` return 401 with the current client credentials. Blocks real IHS ID lookups (`getPatientIHSId` / `getPractitionerIHSId`) and end-to-end FHIR Bundle sync testing for TR-37, TR-79, TR-80. Mock/sandbox flows (`syncStatus`, FHIR Bundle builder, UI sync states) work and are unblocked. **Waiting on Kemenkes to issue/activate working staging credentials** — tracked in Jira backlog.
- **UAT item 9 (DoB & Age display):** implemented but not yet browser-tested — see `handoff.md` and the UAT Remediation Tracker above (item 9).

## Jira Task Breakdown

### TR-1 [SETUP] Project Infrastructure
| # | Item | Status |
|---|---|---|
| TR-14 | Setup Next.js project dengan TypeScript dan Tailwind CSS | ✅ Done |
| TR-15 | Setup PostgreSQL database dan konfigurasi Prisma ORM | ✅ Done |
| TR-16 | Definisi Prisma schema berdasarkan Domain Model | ✅ Done |
| TR-17 | Setup struktur folder dan routing Next.js App Router | ✅ Done |
| TR-18 | Setup environment variables dan konfigurasi SATUSEHAT credentials | ✅ Done |

### TR-2 [UC-01] Login
| # | Item | Status |
|---|---|---|
| TR-19 | Buat halaman Login UI | ✅ Done |
| TR-20 | Setup NextAuth.js credentials provider | ✅ Done |
| TR-21 | Implementasi role-based redirect (NEXT) | ✅ Done |
| TR-22 | Implementasi validasi error handling login | ✅ Done |

### TR-3 [UC-02] Lihat Dashboard
| # | Item | Status |
|---|---|---|
| TR-23 | Buat shared DashboardLayout component | ✅ Done |
| TR-24 | Buat Dashboard Admin | ✅ Done |
| TR-25 | Buat Dashboard Pendaftaran | ✅ Done |
| TR-26 | Buat Dashboard Perawat | ✅ Done |
| TR-27 | Buat Dashboard Dokter | ✅ Done |

### TR-4 [UC-03] Kelola Pengguna
| # | Item | Status |
|---|---|---|
| TR-28 | Buat halaman Manajemen Pengguna UI | ✅ Done |
| TR-29 | Buat form Tambah Akun Baru | ✅ Done |
| TR-30 | Implementasi edit dan hapus akun | ✅ Done |
| TR-31 | Implementasi toggle aktif/nonaktif | ✅ Done |
| TR-32 | Buat API endpoint CRUD Account & Practitioner | ✅ Done |
| TR-33 | Role-based access - hanya Admin | ✅ Done |

### TR-5 [UC-04] Daftar Pasien Baru
| # | Item | Status |
|---|---|---|
| TR-34 | Buat halaman Rekam Medis UI | ✅ Done |
| TR-35 | Buat form Tambah Pasien Baru | ✅ Done |
| TR-36 | Validasi NIK 16 digit | ✅ Done |
| TR-37 | Integrasi SATUSEHAT API auto-fill | ⏳ Postponed (blocked by SATUSEHAT 401, see Known Issues) |
| TR-38 | Fallback pendaftaran manual | ✅ Done |
| TR-39 | API endpoint CRUD Patient | ✅ Done |

### TR-6 [UC-05] Daftar Kunjungan
| # | Item | Status |
|---|---|---|
| TR-40 | Buat form Tambah Kunjungan Baru | ✅ Done |
| TR-41 | Generate nomor antrean U- dan G- | ✅ Done |
| TR-42 | Form detail kunjungan | ✅ Done |
| TR-43 | Opsi pendaftaran tanpa NIK | ✅ Done |
| TR-44 | Error handling pasien belum terdaftar | ✅ Done |
| TR-45 | API endpoint Encounter baru | ✅ Done |

### TR-7 [UC-06] Lihat Daftar Antrean
| # | Item | Status |
|---|---|---|
| TR-46 | Buat halaman Rawat Jalan UI | ✅ Done |
| TR-47 | Filter antrean | ✅ Done |
| TR-48 | Role-based action Petugas Pendaftaran | ✅ Done |
| TR-49 | Empty state dan error state | ✅ Done |
| TR-50 | API endpoint fetch Encounter aktif | ✅ Done |

### TR-8 [UC-07] Lihat Riwayat Medis
| # | Item | Status |
|---|---|---|
| TR-51 | Buat halaman Riwayat Medis UI | ✅ Done |
| TR-52 | Komponen Riwayat Kunjungan timeline | ✅ Done |
| TR-53 | Komponen Ringkasan Klinis | ✅ Done |
| TR-54 | Empty state riwayat kosong | ✅ Done |
| TR-55 | API endpoint fetch riwayat medis | ✅ Done |

### TR-9 [UC-08] Catat Kajian Awal
| # | Item | Status |
|---|---|---|
| TR-56 | Buat halaman Asesmen UI | ✅ Done |
| TR-57 | Form Kajian Awal input chips | ✅ Done |
| TR-58 | Opsi "tidak ada" tiap field | ✅ Done |
| TR-59 | Error handling preserve input state | ✅ Done |
| TR-60 | API endpoint ConditionHistory, AllergyIntolerance, MedicationStatement | ✅ Done |

### TR-10 [UC-09] Catat Pemeriksaan Fisik
| # | Item | Status |
|---|---|---|
| TR-61 | Form Pemeriksaan Fisik | ✅ Done |
| TR-62 | Kalkulasi BMI otomatis | ✅ Done |
| TR-63 | Validasi batas logis tanda vital | ✅ Done |
| TR-64 | Konfirmasi dua opsi Kembali/Lanjut | ✅ Done |
| TR-65 | API endpoint Observation | ✅ Done |

### TR-11 [UC-10] Input Diagnosis
| # | Item | Status |
|---|---|---|
| TR-66 | Form Hasil Periksa Medis | ✅ Done |
| TR-67 | Search ICD-10 autocomplete | ✅ Done |
| TR-68 | Fallback input manual diagnosis | ✅ Done |
| TR-69 | Read-only view Kajian Awal & Pemeriksaan Fisik | ✅ Done |
| TR-70 | API endpoint ConditionDiagnosis | ✅ Done |

### TR-12 [UC-11] Catat Tindak Lanjut
| # | Item | Status |
|---|---|---|
| TR-71 | Search ICD-9-CM autocomplete (renamed from CPT/CDT) | ✅ Done |
| TR-72 | Fallback input manual tindakan | ✅ Done |
| TR-73 | Form Resep Obat (PlanMedicationForm) dan Edukasi (PlanEducationForm) | ✅ Done |
| TR-74 | Form Rujukan toggle (PlanReferralForm) dengan ghost-data prevention | ✅ Done |
| TR-75 | Validasi plan: minimal 1 dari tindakan/resep/rujukan/edukasi wajib diisi | ✅ Done |
| TR-76 | API endpoint Procedure, MedicationRequest, ServiceRequest, Observation (edukasi) | ✅ Done |
| TR-76.8 | Encounter Read-Only View & Admin Override | ⏳ Backlog |

### TR-13 [UC-12] Kirim Resume Medis
| # | Item | Status |
|---|---|---|
| TR-77 | Refactoring terminologi medis: codeCpt → codeIcd9 (ICD-9-CM alignment) | ✅ Done |
| TR-78 | Tambah syncStatus + transactionId ke model Encounter | ✅ Done |
| TR-79 | Buat src/lib/satusehat.ts: OAuth2 token manager, IHS lookup, FHIR helpers | ✅ Done |
| TR-80 | Auto-sync IHS ID Pasien saat pendaftaran (UC-04 integration) | ✅ Done |
| TR-81 | FHIR Bundle builder: pack SOAP data → FHIR R4 transaction Bundle | ✅ Done |
| TR-82 | UI merged save+sync + syncStatus flip + auto Error modal on FAILED_SYNC + UX revisions | ✅ Done |

### TR-101 [UC-13] Kelola Rekam Medis
| # | Item | Status |
|---|---|---|
| TR-102 | Setup action button handlers di Rekam Medis | ✅ Done |
| TR-103 | Implementasi tombol View route ke UC-07 | ✅ Done |
| TR-104 | Implementasi tombol Edit patient | ✅ Done |
| TR-105 | Implementasi tombol Delete patient | ✅ Done |
| TR-106 | Integrasi dengan API endpoints | ✅ Done |
| TR-107 | Error handling & validation | ✅ Done |