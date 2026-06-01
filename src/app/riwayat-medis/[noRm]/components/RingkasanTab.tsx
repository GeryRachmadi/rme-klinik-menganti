import type {
  RingkasanData,
  EpisodicData,
} from "@/lib/mappers/medical-records-mapper";

const JAKARTA = { fontFamily: "var(--font-jakarta)" } as const;
const MANROPE = { fontFamily: "var(--font-manrope)" } as const;

function formatTanggal(value: Date | string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// BMI category — thresholds match asesmen BMIDisplay; labels/colors per Figma.
function getBmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Kurus", color: "text-[#F59E0B]" };
  if (bmi < 25) return { label: "Normal", color: "text-[#10B981]" };
  if (bmi < 30) return { label: "Gemuk", color: "text-[#F97316]" };
  return { label: "Obesitas", color: "text-[#EF4444]" };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-bold text-[18px] text-[#191c1d] mb-4" style={MANROPE}>
      {children}
    </h3>
  );
}

// Standard section card shell (white, border-2, rounded-[24px]).
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-[#e5e7eb] rounded-[24px] p-[24px] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      {children}
    </div>
  );
}

// Initials from practitioner name — mirrors Navbar getInitials (max 2 chars).
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-500 italic text-sm" style={JAKARTA}>
      {children}
    </p>
  );
}

// ═══════════════ LEFT — EPISODIC ═══════════════

function DiagnosisAktifCard({ episodic }: { episodic: EpisodicData | null }) {
  const diagnoses = episodic?.diagnoses ?? [];
  const primary = diagnoses.find((d) => d.isPrimary) ?? diagnoses[0] ?? null;
  const secondary = diagnoses.filter((d) => d !== primary);
  const tanggal = formatTanggal(episodic?.encounterDate ?? null);

  return (
    <div className="bg-white border-2 border-[#e5e7eb] rounded-[24px] p-[26px] flex flex-col gap-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <h3 className="font-bold text-[18px] text-[#191c1d]" style={MANROPE}>
        Diagnosis Aktif
      </h3>

      <div className="flex flex-col gap-3">
        {!primary ? (
          <EmptyText>Belum ada diagnosis tercatat</EmptyText>
        ) : (
          <>
            {/* Diagnosis Utama */}
            <div className="bg-[rgba(216,226,255,0.3)] rounded-[24px] p-5" style={JAKARTA}>
              <p className="text-[#2170E4] font-bold uppercase text-[10px] tracking-wide">
                Diagnosis Utama
              </p>
              <p className="text-[#191c1d] font-bold text-[16px] mt-1.5">
                {primary.display || primary.code || "Diagnosis"}
                {primary.code && (
                  <span className="ml-2 text-[13px] font-semibold text-[#2170E4]">
                    {primary.code}
                  </span>
                )}
              </p>
              {tanggal && (
                <p className="text-[#64748b] text-[12px] mt-1.5">
                  Ditemukan pada kunjungan {tanggal}
                </p>
              )}
            </div>

            {/* Diagnosis Sekunder */}
            {secondary.map((d, i) => (
              <div
                key={`${d.code}-${i}`}
                className="bg-[#F3F4F5] rounded-[24px] p-5"
                style={JAKARTA}
              >
                <p className="text-[#94A3B8] font-bold uppercase text-[10px] tracking-wide">
                  Diagnosis Sekunder
                </p>
                <p className="text-[#334155] font-semibold text-[16px] mt-1.5">
                  {d.display || d.code}
                  {d.code && (
                    <span className="ml-2 text-[13px] font-medium text-[#94A3B8]">
                      {d.code}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  children,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </p>
      <p className="font-semibold text-gray-900">
        {value}{" "}
        {unit && <span className="text-xs font-normal text-gray-500">{unit}</span>}
      </p>
      {children}
    </div>
  );
}

function PengukuranFisikCard({ episodic }: { episodic: EpisodicData | null }) {
  const v = episodic?.vitals ?? null;
  const bmiCategory = v?.bmi != null ? getBmiCategory(Number(v.bmi)) : null;

  return (
    <Card>
      <SectionTitle>Pengukuran Fisik Terakhir</SectionTitle>
      {!v ? (
        <EmptyText>Belum ada pengukuran fisik tercatat</EmptyText>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" style={JAKARTA}>
          <Metric
            label="Tekanan Darah"
            value={v.systolic != null && v.diastolic != null ? `${v.systolic}/${v.diastolic}` : "-"}
            unit="mmHg"
          />
          <Metric label="Nadi" value={v.heartRate ?? "-"} unit="x/mnt" />
          <Metric label="Suhu" value={v.temperature ?? "-"} unit="°C" />
          <Metric label="Pernapasan" value={v.respiratoryRate ?? "-"} unit="x/mnt" />
          <Metric label="Tinggi Badan" value={v.height ?? "-"} unit="cm" />
          <Metric label="Berat Badan" value={v.weight ?? "-"} unit="kg" />
          <Metric label="BMI" value={v.bmi ?? "-"} unit="kg/m²">
            {bmiCategory && (
              <span
                className={`block text-[10px] font-bold uppercase tracking-wide mt-1 ${bmiCategory.color}`}
              >
                {bmiCategory.label}
              </span>
            )}
          </Metric>
        </div>
      )}
    </Card>
  );
}

// "[code]–display" format, falling back gracefully when either is missing.
function formatProcedure(p: { code: string | null; display: string }): string {
  const display = p.display || "Tindakan";
  return p.code ? `[${p.code}]–${display}` : display;
}

// Mirrors DiagnosisAktifCard structure exactly, with green tokens.
function TindakanMedisCard({ episodic }: { episodic: EpisodicData | null }) {
  const procedures = episodic?.procedures ?? [];
  const primary = procedures[0] ?? null;
  const secondary = procedures.slice(1);
  const tanggal = formatTanggal(episodic?.encounterDate ?? null);

  return (
    <div className="bg-white border-2 border-[#e5e7eb] rounded-[24px] p-[26px] flex flex-col gap-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <h3 className="font-bold text-[18px] text-[#191c1d]" style={MANROPE}>
        Tindakan Medis yang Diambil
      </h3>

      {!primary ? (
        <p className="text-[#94a3b8] text-[14px] italic" style={JAKARTA}>
          Tidak ada tindakan yang dicatat
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Tindakan Utama */}
          <div className="bg-[#ECFDF5] rounded-[24px] p-[16px] flex flex-col gap-1" style={JAKARTA}>
            <p className="text-[#006B4E] font-bold uppercase text-[10px] tracking-wide">
              Tindakan Utama
            </p>
            <p className="text-[#191c1d] font-bold text-[16px]">
              {formatProcedure(primary)}
            </p>
            {tanggal && (
              <p className="text-[#64748b] text-[12px]">
                Ditemukan pada kunjungan {tanggal}
              </p>
            )}
          </div>

          {/* Tindakan Sekunder */}
          {secondary.map((p, i) => (
            <div
              key={`${p.code}-${i}`}
              className="bg-[#F3F4F5] rounded-[24px] p-[16px] flex flex-col gap-1"
              style={JAKARTA}
            >
              <p className="text-[#94A3B8] font-bold uppercase text-[10px] tracking-wide">
                Tindakan Sekunder
              </p>
              <p className="text-[#334155] font-semibold text-[16px]">
                {formatProcedure(p)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InnerLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#3e4247] font-bold text-[10px] uppercase tracking-wide">
      {children}
    </p>
  );
}

// Merged "Perencanaan Medis" card: Tindakan → Resep Obat → Edukasi/Anjuran
// as stacked white inner cards inside a dashed outer container.
function PerencanaanMedisCard({ episodic }: { episodic: EpisodicData | null }) {
  const medications = episodic?.medications ?? [];
  const anjuranText = episodic?.education ?? null;
  const doctor = episodic?.practitionerName ?? null;

  return (
    <div className="bg-[rgba(225,227,228,0.5)] border border-[#bacac5] border-dashed rounded-[24px] p-[25px] flex flex-col gap-4">
      <h3 className="font-bold text-[18px] text-[#191c1d]" style={MANROPE}>
        Perencanaan Medis
      </h3>

      {/* INNER CARD — Resep Obat (only if medications exist) */}
      {medications.length > 0 && (
        <div className="bg-white rounded-[24px] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] px-[20px] pt-[18.75px] pb-[20px] flex flex-col gap-4" style={JAKARTA}>
          <InnerLabel>Resep Obat</InnerLabel>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            {medications.map((m, i) => (
              <li
                key={`${m.name}-${i}`}
                className="italic text-[#475569] text-[14px] leading-[22.75px]"
              >
                {m.name || "Obat"}
                {m.dosage ? ` — ${m.dosage}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* INNER CARD 3 — Edukasi / Anjuran + doctor signature (always show) */}
      <div className="bg-white rounded-[24px] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] px-[20px] pt-[18.75px] pb-[20px] flex flex-col gap-4" style={JAKARTA}>
        <InnerLabel>Edukasi / Anjuran</InnerLabel>
        {anjuranText ? (
          <p className="italic text-[#475569] text-[14px] leading-[22.75px]">
            &ldquo;{anjuranText}&rdquo;
          </p>
        ) : (
          <p className="italic text-[#94a3b8] text-[14px]">
            Tidak ada anjuran tercatat.
          </p>
        )}
        {doctor && (
          <div className="flex items-center gap-2">
            <div className="bg-[#D8E2FF] rounded-full w-6 h-6 flex items-center justify-center shrink-0">
              <span className="text-[#001A42] font-bold text-[10px] uppercase">
                {getInitials(doctor)}
              </span>
            </div>
            <span className="text-[#94a3b8] font-bold text-[12px] uppercase tracking-wide">
              Oleh: {doctor.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════ RIGHT — LONGITUDINAL ═══════════════

function Chip({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "amber" | "red" | "gray";
}) {
  const styles = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    gray: "bg-gray-100 text-gray-500 border-transparent",
  }[variant];
  return (
    <span
      className={`inline-block rounded-lg border px-3 py-1.5 text-sm ${styles}`}
      style={JAKARTA}
    >
      {children}
    </span>
  );
}

function RiwayatPenyakitCard({ conditions }: { conditions: string[] }) {
  return (
    <Card>
      <SectionTitle>Riwayat Penyakit Terdahulu</SectionTitle>
      {conditions.length === 0 ? (
        <EmptyText>Belum ada riwayat penyakit</EmptyText>
      ) : (
        <div className="flex flex-wrap gap-2">
          {conditions.map((c, i) => (
            <Chip key={`${c}-${i}`} variant="amber">
              {c}
            </Chip>
          ))}
        </div>
      )}
    </Card>
  );
}

function RiwayatAlergiCard({ allergies }: { allergies: string[] }) {
  return (
    <Card>
      <SectionTitle>Riwayat Alergi</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {allergies.length === 0 ? (
          <Chip variant="gray">Tidak memiliki alergi</Chip>
        ) : (
          allergies.map((a, i) => (
            <Chip key={`${a}-${i}`} variant="red">
              {a}
            </Chip>
          ))
        )}
      </div>
    </Card>
  );
}

function PengobatanRutinCard({ medications }: { medications: string[] }) {
  return (
    <Card>
      <SectionTitle>Pengobatan Rutin</SectionTitle>
      {medications.length === 0 ? (
        <EmptyText>Belum ada pengobatan rutin tercatat</EmptyText>
      ) : (
        <div className="flex flex-wrap gap-2">
          {medications.map((m, i) => (
            <Chip key={`${m}-${i}`} variant="red">
              {m}
            </Chip>
          ))}
        </div>
      )}
    </Card>
  );
}

// ═══════════════ LAYOUT ═══════════════

interface RingkasanTabProps {
  data: RingkasanData;
}

export default function RingkasanTab({ data }: RingkasanTabProps) {
  const { episodic, pastConditions, allergies, medications } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mt-6">
      {/* LEFT — Episodic */}
      <div className="flex flex-col gap-4">
        <DiagnosisAktifCard episodic={episodic} />
        <PengukuranFisikCard episodic={episodic} />
        <TindakanMedisCard episodic={episodic} />
        <PerencanaanMedisCard episodic={episodic} />
      </div>

      {/* RIGHT — Longitudinal */}
      <div className="flex flex-col gap-4">
        <RiwayatPenyakitCard conditions={pastConditions} />
        <RiwayatAlergiCard allergies={allergies} />
        <PengobatanRutinCard medications={medications} />
      </div>
    </div>
  );
}
