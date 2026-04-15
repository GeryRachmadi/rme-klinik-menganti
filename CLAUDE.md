@AGENTS.md

# RME Klinik Pratama Menganti — Claude Code Context

## Project Overview
Sistem Rekam Medis Elektronik (RME) berbasis web untuk Klinik Pratama Menganti Gresik.
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

## Design System
- Primary color: teal #2BB5A0 / #4DD9C0
- Border radius: rounded-xl (inputs), rounded-full (buttons), rounded-3xl (cards)
- Grid layout: 12-column (grid-cols-12 gap-6) for all dashboards
- Dashboard layout: Welcome Card (col-span-12) → 4 KPI Cards (col-span-3) → Main Table (col-span-8) + Widget (col-span-4)

## URL Structure
- /login → Halaman login (UC-01)
- /beranda → Dashboard per role (UC-02)
- /rawat-jalan → Daftar antrean & kunjungan (UC-05, UC-06)
- /rekam-medis → Daftar pasien (UC-04, UC-07)
- /manajemen-pengguna → Kelola user (UC-03)
- /asesmen/[encounterId] → SOAP form (UC-08 to UC-12)

## Prisma Schema Key Models
Account, Practitioner, Patient, Encounter, ConditionHistory,
AllergyIntolerance, MedicationStatement, Observation,
ConditionDiagnosis, Procedure, MedicationRequest, ServiceRequest,
ICD10Reference, ICD9Reference, ActivityLog, SyncQueue

## Jira Project
- Project: Tugas Akhir - RME Klinik Pratama Menganti Gresik
- Key: TR
- Current progress: TR-20 Done (UC-01 Login complete)
- Next: TR-21 (role-based redirect), TR-22 (error handling), TR-23+ (UC-02 Dashboard)

## Important Rules
- Always use Bahasa Indonesia for UI text, labels, and messages
- Use PrismaPg adapter when instantiating PrismaClient
- Use tsx to run TypeScript scripts (NOT ts-node)
- Font: Poppins for headings/buttons, Plus Jakarta Sans for body/form
- Never use English in user-facing text except for technical terms
- Route protection via layout.tsx using auth() from next-auth
- All form inputs use autoComplete="off"