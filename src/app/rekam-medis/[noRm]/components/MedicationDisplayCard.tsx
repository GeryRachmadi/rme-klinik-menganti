import type { MedicationDisplayItem } from "@/lib/mappers/medical-records-mapper";

const JAKARTA = { fontFamily: "var(--font-jakarta)" } as const;

// Type badge — every card gets one, no exceptions. Colors and pill shape
// match Figma node 925:281 exactly.
function TypeBadge({ type }: { type: MedicationDisplayItem["type"] }) {
  const isRacikan = type === "racikan";
  return (
    <span
      className={`inline-flex items-center px-[7px] py-0.5 rounded-[4px] text-[10px] font-bold uppercase whitespace-nowrap ${
        isRacikan ? "bg-[#e0f2f1] text-[#1d7a6f]" : "bg-[#f4f7ff] text-[#2170e4]"
      }`}
      style={JAKARTA}
    >
      {isRacikan ? "Racikan" : "Non-Racikan"}
    </span>
  );
}

function MetaLine({ parts }: { parts: (string | number | null | undefined)[] }) {
  const cleaned = parts.map((p) => (p == null ? "" : String(p).trim())).filter((p) => p.length > 0);
  if (cleaned.length === 0) return null;
  return (
    <div className="flex items-center gap-4">
      {cleaned.map((p, i) => (
        <p key={i} className="text-[12px] font-medium text-[#475569]" style={JAKARTA}>
          {p}
        </p>
      ))}
    </div>
  );
}

/**
 * One Resep Obat card — Non-Racikan or Racikan. Racikan cards additionally
 * render a nested "BAHAN RACIKAN" box listing each ingredient (Item 13 display
 * redesign, restyled to match Figma node 925:281). Shared between
 * RingkasanTab (Kunjungan Terakhir) and EncounterHistoryTab (CPPT) so both
 * tabs render identically.
 */
export default function MedicationDisplayCard({ item }: { item: MedicationDisplayItem }) {
  if (item.type === "tidak-ada") {
    return (
      <p className="text-sm text-gray-400 italic" style={JAKARTA}>
        Tidak ada resep obat untuk kunjungan ini.
      </p>
    );
  }

  const isRacikan = item.type === "racikan";
  const aturanPakaiValue = [item.aturanPakai, item.waktuKonsumsi]
    .map((v) => (v ?? "").trim())
    .filter((v) => v.length > 0)
    .join("  ");

  return (
    <div className="bg-[#d9d9d9] rounded-[24px] p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[#475569] font-bold text-[14px]" style={JAKARTA}>
          {isRacikan ? item.namaRacikan || "Racikan" : item.namaObat || "Obat"}
          {!isRacikan && item.dosis && (
            <span className="ml-2 font-medium text-[14px] text-[#475569]">{item.dosis}</span>
          )}
        </p>
        <TypeBadge type={item.type} />
      </div>

      <MetaLine parts={[`QTY: ${item.jumlah ?? "-"}`, item.bentukSediaan]} />

      <div className="border-t border-[#E2E8F0] pt-2 flex items-center gap-4">
        <p className="text-[#3e4247] font-bold text-[10px] uppercase whitespace-nowrap" style={JAKARTA}>
          Aturan Pakai:
        </p>
        <p className="text-[12px] font-medium text-[#475569]" style={JAKARTA}>
          {aturanPakaiValue || "-"}
        </p>
      </div>

      {isRacikan && (
        <div className="bg-white rounded-[24px] p-4 flex flex-col gap-2">
          <p className="text-[#3e4247] font-bold text-[10px] uppercase tracking-wide" style={JAKARTA}>
            Bahan Racikan
          </p>
          {item.ingredients.length === 0 ? (
            <p className="text-[12px] italic text-[#94a3b8]" style={JAKARTA}>
              Tidak ada bahan tercatat.
            </p>
          ) : (
            item.ingredients.map((ing, i) => {
              const jumlahText = Number.isFinite(ing.jumlah) && ing.jumlah > 0 ? String(ing.jumlah) : "";
              const jumlahBentuk = [jumlahText, ing.bentukSediaan]
                .map((v) => (v ?? "").trim())
                .filter((v) => v.length > 0 && v !== "-")
                .join(" ");
              return (
                <div key={`${ing.namaObat}-${i}`} className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-[#475569]" style={JAKARTA}>
                    {ing.namaObat || "Bahan"}
                  </span>
                  {jumlahBentuk && (
                    <span className="text-[12px] font-medium text-[#475569]" style={JAKARTA}>
                      {jumlahBentuk}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
