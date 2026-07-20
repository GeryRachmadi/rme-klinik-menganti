import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.account.upsert({
    where: { username: "gery.admin" },
    update: {},
    create: {
      username: "gery.admin",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      practitioner: {
        create: {
          name: "Gery Rachmadi",
          speciality: "Administrator",
        },
      },
    },
  });

  const pendaftaran = await prisma.account.upsert({
    where: { username: "gabrielle.frontdesk" },
    update: {},
    create: {
      username: "gabrielle.frontdesk",
      password: hashedPassword,
      role: "PENDAFTARAN",
      isActive: true,
      practitioner: {
        create: {
          name: "Gabrielle",
          speciality: "Pendaftaran",
        },
      },
    },
  });

  const perawat = await prisma.account.upsert({
    where: { username: "fanny.nurse" },
    update: {},
    create: {
      username: "fanny.nurse",
      password: hashedPassword,
      role: "PERAWAT",
      isActive: true,
      practitioner: {
        create: {
          name: "Fanny",
          speciality: "Perawat",
        },
      },
    },
  });

  const dokter = await prisma.account.upsert({
    where: { username: "strange.doctor" },
    update: {},
    create: {
      username: "strange.doctor",
      password: hashedPassword,
      role: "DOKTER",
      isActive: true,
      practitioner: {
        create: {
          name: "dr. Strange",
          speciality: "Umum",
        },
      },
    },
  });

  const cynthia = await prisma.account.upsert({
    where: { username: "cynthia.doctor" },
    update: {},
    create: {
      username: "cynthia.doctor",
      password: hashedPassword,
      role: "DOKTER",
      isActive: true,
      practitioner: {
        create: {
          name: "drg. Cynthia",
          speciality: "Poli Gigi",
        },
      },
    },
  });
  console.log("Upserted Doctor: cynthia.doctor");

  console.log("Seeded accounts:", {
    admin: admin.username,
    pendaftaran: pendaftaran.username,
    perawat: perawat.username,
    dokter: dokter.username,
  });

  // ============================================================
  // ICD-10 Reference (Diagnosis)
  // Uses upsert so display_id is always updated on re-run.
  // ============================================================
  console.log("Seeding ICD-10 reference data...");

  const icd10Data = [
    // Respiratory
    { code: "J02.9",   display: "Acute pharyngitis, unspecified",                                                   display_id: "Faringitis akut, tidak spesifik" },
    { code: "J06.9",   display: "Acute upper respiratory infection, unspecified",                                   display_id: "Infeksi saluran pernapasan atas akut (ISPA), tidak spesifik" },
    { code: "J01.90",  display: "Acute sinusitis, unspecified",                                                     display_id: "Sinusitis akut, tidak spesifik" },
    { code: "J20.9",   display: "Acute bronchitis, unspecified",                                                    display_id: "Bronkitis akut, tidak spesifik" },
    { code: "J45.9",   display: "Unspecified asthma",                                                               display_id: "Asma, tidak spesifik" },
    // Cardiovascular & Metabolic
    { code: "I10",     display: "Essential hypertension",                                                           display_id: "Hipertensi esensial" },
    { code: "E11.9",   display: "Type 2 diabetes mellitus without complications",                                   display_id: "Diabetes melitus tipe 2 tanpa komplikasi" },
    { code: "E78.5",   display: "Hyperlipidemia, unspecified",                                                      display_id: "Hiperlipidemia, tidak spesifik" },
    { code: "M10.9",   display: "Gout, unspecified",                                                                display_id: "Asam urat (Gout), tidak spesifik" },
    // Gastrointestinal
    { code: "K21.9",   display: "Unspecified gastro-esophageal reflux disease",                                    display_id: "Penyakit refluks gastroesofageal (GERD), tidak spesifik" },
    { code: "K30",     display: "Functional dyspepsia",                                                             display_id: "Dispepsia fungsional (Maag)" },
    { code: "A09",     display: "Unspecified gastroenteritis and colitis",                                          display_id: "Gastroenteritis dan kolitis, tidak spesifik" },
    { code: "K59.1",   display: "Diarrhea",                                                                         display_id: "Diare" },
    { code: "R10.9",   display: "Unspecified abdominal pain",                                                       display_id: "Nyeri perut, tidak spesifik" },
    // Musculoskeletal
    { code: "M79.3",   display: "Panniculitis, unspecified",                                                        display_id: "Pannikulitis, tidak spesifik" },
    { code: "M25.5",   display: "Pain in joint",                                                                    display_id: "Nyeri sendi" },
    // ENT & Eye
    { code: "H10.9",   display: "Unspecified conjunctivitis",                                                       display_id: "Konjungtivitis, tidak spesifik" },
    { code: "H65.90",  display: "Unspecified nonsuppurative otitis media, unspecified ear",                        display_id: "Otitis media non-supuratif, tidak spesifik" },
    // Skin
    { code: "B86",     display: "Scabies",                                                                          display_id: "Skabies (Kudis)" },
    { code: "L20.9",   display: "Atopic dermatitis, unspecified",                                                   display_id: "Dermatitis atopik, tidak spesifik" },
    // Dental
    { code: "K04.0",   display: "Pulpitis",                                                                         display_id: "Pulpitis (Radang pulpa gigi)" },
    { code: "K02.9",   display: "Dental caries, unspecified",                                                       display_id: "Karies gigi, tidak spesifik" },
    { code: "K05.3",   display: "Chronic periodontitis, unspecified",                                               display_id: "Periodontitis kronis, tidak spesifik" },
    { code: "K03.8",   display: "Other specified diseases of hard tissues of teeth",                               display_id: "Penyakit jaringan keras gigi lainnya" },
    { code: "K02.1",   display: "Caries of dentine",                                                                display_id: "Karies dentin" },
    { code: "K05.2",   display: "Aggressive periodontitis",                                                         display_id: "Periodontitis agresif" },
    // Infection
    { code: "N39.0",   display: "Urinary tract infection, site not specified",                                     display_id: "Infeksi saluran kemih (ISK), tidak spesifik" },
    { code: "A15.9",   display: "Respiratory tuberculosis, unspecified",                                            display_id: "Tuberkulosis pernapasan (TBC), tidak spesifik" },
    { code: "A01.00",  display: "Typhoid fever, unspecified",                                                       display_id: "Demam tifoid (Tipes), tidak spesifik" },
    { code: "A00.0",   display: "Cholera due to Vibrio cholerae 01, biovar cholerae",                             display_id: "Kolera akibat Vibrio cholerae" },
    // Mental & Neurological
    { code: "F41.1",   display: "Generalized anxiety disorder",                                                     display_id: "Gangguan kecemasan menyeluruh (GAD)" },
    { code: "R41.844", display: "Frontal lobe and executive function deficit",                                     display_id: "Defisit fungsi lobus frontal dan eksekutif" },
    // Symptoms & Signs
    { code: "R05.9",   display: "Fever, unspecified",                                                               display_id: "Demam, tidak spesifik" },
    { code: "R42",     display: "Dizziness and giddiness",                                                          display_id: "Pusing dan vertigo" },
    { code: "R51",     display: "Headache",                                                                          display_id: "Sakit kepala" },
    { code: "R53.83",  display: "Other fatigue",                                                                    display_id: "Kelelahan lainnya" },
    // Tropical & Infectious
    { code: "A90",     display: "Dengue fever",                                                                     display_id: "Demam dengue" },
    { code: "A91",     display: "Dengue haemorrhagic fever",                                                        display_id: "Demam berdarah dengue (DBD)" },
    { code: "B01.9",   display: "Varicella without complication",                                                   display_id: "Cacar air (Varisela) tanpa komplikasi" },
    { code: "B02.9",   display: "Zoster without complications",                                                     display_id: "Herpes zoster tanpa komplikasi" },
    { code: "B35.4",   display: "Tinea corporis",                                                                   display_id: "Tinea korporis (Kurap badan)" },
    { code: "B77.9",   display: "Ascariasis, unspecified",                                                          display_id: "Askariasis (Cacingan), tidak spesifik" },
    // Cardiovascular & Metabolic (additional)
    { code: "I11.9",   display: "Hypertensive heart disease without heart failure",                                display_id: "Penyakit jantung hipertensi tanpa gagal jantung" },
    { code: "E10.9",   display: "Type 1 diabetes mellitus without complications",                                   display_id: "Diabetes melitus tipe 1 tanpa komplikasi" },
    { code: "E66.9",   display: "Obesity, unspecified",                                                             display_id: "Obesitas, tidak spesifik" },
    { code: "E03.9",   display: "Hypothyroidism, unspecified",                                                      display_id: "Hipotiroidisme, tidak spesifik" },
    { code: "D50.9",   display: "Iron deficiency anaemia, unspecified",                                            display_id: "Anemia defisiensi besi, tidak spesifik" },
    // Respiratory (additional)
    { code: "J18.9",   display: "Pneumonia, unspecified organism",                                                  display_id: "Pneumonia, organisme tidak spesifik" },
    { code: "J11.1",   display: "Influenza with other respiratory manifestations, virus not identified",           display_id: "Influenza dengan manifestasi pernapasan lainnya" },
    // Gastrointestinal (additional)
    { code: "K29.7",   display: "Gastritis, unspecified",                                                           display_id: "Gastritis, tidak spesifik" },
    { code: "K25.9",   display: "Gastric ulcer, unspecified",                                                       display_id: "Tukak lambung, tidak spesifik" },
    // Musculoskeletal (additional)
    { code: "M54.5",   display: "Low back pain",                                                                    display_id: "Nyeri punggung bawah" },
    { code: "M54.4",   display: "Lumbago with sciatica",                                                            display_id: "Lumbago dengan skiatika (Sakit pinggang)" },
    // Skin (additional)
    { code: "L23.9",   display: "Allergic contact dermatitis, unspecified cause",                                  display_id: "Dermatitis kontak alergi, tidak spesifik" },
    { code: "L30.9",   display: "Dermatitis, unspecified",                                                          display_id: "Dermatitis, tidak spesifik" },
    // Genitourinary & Reproductive
    { code: "N10",     display: "Acute pyelonephritis",                                                             display_id: "Pielonefritis akut (Infeksi ginjal akut)" },
    { code: "N94.6",   display: "Dysmenorrhoea, unspecified",                                                       display_id: "Dismenore (Nyeri haid), tidak spesifik" },
    // Symptoms (additional)
    { code: "R06.00",  display: "Dyspnoea, unspecified",                                                            display_id: "Sesak napas, tidak spesifik" },
    { code: "R11.2",   display: "Nausea with vomiting, unspecified",                                               display_id: "Mual dan muntah, tidak spesifik" },
    { code: "R50.9",   display: "Fever of other and unknown origin",                                               display_id: "Demam tidak diketahui penyebabnya" },
    // Preventive / Encounter
    { code: "Z00.00",  display: "Encounter for general adult medical examination without abnormal findings",       display_id: "Pemeriksaan kesehatan umum dewasa (Normal)" },
    { code: "Z23",     display: "Encounter for immunization",                                                       display_id: "Kunjungan untuk imunisasi / vaksinasi" },
  ];

  await Promise.all(
    icd10Data.map((entry) =>
      prisma.iCD10Reference.upsert({
        where:  { code: entry.code },
        update: { display: entry.display, display_id: entry.display_id },
        create: { code: entry.code, display: entry.display, display_id: entry.display_id },
      })
    )
  );
  console.log(`Seeded ICD-10: ${icd10Data.length} rows upserted.`);

  // ============================================================
  // ICD-9-CM Reference (Procedures / Tindakan)
  // ============================================================
  console.log("Seeding ICD-9-CM reference data...");

  const icd9cmData = [
    // Consultation
    { code: "89.01", display: "Interview and evaluation, described as brief",                                               display_id: "Wawancara dan evaluasi singkat",                              category: "Consultation" },
    { code: "89.02", display: "Interview and evaluation, described as limited",                                             display_id: "Wawancara dan evaluasi terbatas",                             category: "Consultation" },
    { code: "89.03", display: "Interview and evaluation, described as comprehensive",                                      display_id: "Wawancara dan evaluasi komprehensif",                         category: "Consultation" },
    { code: "89.05", display: "Diagnostic interview and evaluation, not otherwise specified",                              display_id: "Wawancara dan evaluasi diagnostik, tidak dispesifikasikan",   category: "Consultation" },
    { code: "89.08", display: "Other consultation",                                                                        display_id: "Konsultasi lainnya",                                          category: "Consultation" },
    { code: "89.09", display: "Consultation, not otherwise specified",                                                     display_id: "Konsultasi, tidak dispesifikasikan",                          category: "Consultation" },
    { code: "89.7",  display: "General physical examination",                                                              display_id: "Pemeriksaan fisik umum",                                      category: "Consultation" },
    // Laboratory
    { code: "90.53", display: "Microscopic examination of blood, culture and sensitivity",                                 display_id: "Pemeriksaan mikroskopis darah (Kultur dan sensitivitas)",     category: "Laboratory" },
    { code: "90.59", display: "Microscopic examination of blood, other microscopic examination",                           display_id: "Pemeriksaan mikroskopis darah lainnya",                       category: "Laboratory" },
    { code: "91.31", display: "Microscopic examination of specimen from bladder, urethra, prostate, seminal vesicle, perivesical tissue, urine, and semen", display_id: "Pemeriksaan mikroskopis urin (Urinalisis)", category: "Laboratory" },
    // Imaging
    { code: "87.44", display: "Routine chest x-ray, so described",                                                         display_id: "Rontgen dada rutin (X-Ray Thorax)",                           category: "Imaging" },
    { code: "87.12", display: "Other dental x-ray",                                                                        display_id: "Rontgen gigi (Dental X-Ray)",                                 category: "Imaging" },
    { code: "88.79", display: "Other diagnostic ultrasound",                                                               display_id: "Ultrasonografi (USG) lainnya",                                category: "Imaging" },
    // Cardiology
    { code: "89.52", display: "Electrocardiogram",                                                                         display_id: "Elektrokardiogram (EKG)",                                     category: "Cardiology" },
    // Minor Procedures
    { code: "86.04", display: "Other incision with drainage of skin and subcutaneous tissue",                              display_id: "Insisi dan drainase kulit / jaringan subkutan lainnya",       category: "Minor Procedures" },
    { code: "86.59", display: "Closure of skin and subcutaneous tissue of other sites",                                    display_id: "Penjahitan kulit dan jaringan subkutan",                      category: "Minor Procedures" },
    { code: "99.21", display: "Injection of antibiotic",                                                                   display_id: "Injeksi antibiotik",                                          category: "Minor Procedures" },
    { code: "99.39", display: "Other vaccination and inoculation",                                                        display_id: "Pemberian vaksin / imunisasi lainnya",                        category: "Minor Procedures" },
    { code: "93.94", display: "Respiratory medication administered by nebulizer",                                          display_id: "Nebulisasi / Inhalasi terapi",                                category: "Minor Procedures" },
    { code: "99.18", display: "Injection or infusion of electrolytes",                                                     display_id: "Pemberian cairan infus elektrolit (IV drip)",                 category: "Minor Procedures" },
    { code: "99.17", display: "Injection of insulin",                                                                      display_id: "Injeksi insulin",                                             category: "Minor Procedures" },
    { code: "99.29", display: "Injection or infusion of other therapeutic or prophylactic substance",                      display_id: "Injeksi / infus lainnya",                                     category: "Minor Procedures" },
    { code: "86.28", display: "Nonexcisional debridement of wound, infection, or burn",                                    display_id: "Debridemen luka non-eksisional",                              category: "Minor Procedures" },
    { code: "96.52", display: "Irrigation of ear",                                                                         display_id: "Irigasi / Pembersihan telinga",                               category: "Minor Procedures" },
    { code: "64.0",  display: "Circumcision",                                                                              display_id: "Sirkumsisi",                                                  category: "Minor Procedures" },
    // Dental Procedures
    { code: "23.09", display: "Extraction of other tooth",                                                                 display_id: "Ekstraksi gigi lainnya (Cabut gigi biasa)",                   category: "Dental Procedures" },
    { code: "23.11", display: "Removal of residual root",                                                                  display_id: "Pengangkatan sisa akar gigi",                                 category: "Dental Procedures" },
    { code: "23.2",  display: "Restoration of tooth by filling",                                                           display_id: "Restorasi gigi dengan amalgam (Tambal)",                      category: "Dental Procedures" },
    { code: "24.31", display: "Excision of lesion or tissue of gum",                                                       display_id: "Eksisi lesi jaringan gusi",                                   category: "Dental Procedures" },
    // Gynaecology
    { code: "67.12", display: "Cervical biopsy",                                                                           display_id: "Biopsi serviks",                                              category: "Gynaecology" },
  ];

  // Codes replaced by a corrected code, or dropped outright (no valid ICD-9-CM
  // procedure code exists for them) as part of the bilingual-field cleanup.
  const icd9cmRetiredCodes = ["87.21", "91.6", "99.11", "99.23", "99.03", "90.5", "90.57"];
  await prisma.iCD9CMReference.deleteMany({
    where: { code: { in: icd9cmRetiredCodes } },
  });

  await Promise.all(
    icd9cmData.map((entry) =>
      prisma.iCD9CMReference.upsert({
        where:  { code: entry.code },
        update: { display: entry.display, display_id: entry.display_id, category: entry.category },
        create: entry,
      })
    )
  );
  console.log(`Seeded ICD-9-CM: ${icd9cmData.length} rows upserted.`);

  console.log("Done! Password for all accounts: password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
