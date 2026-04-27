export default async function RiwayatMedisPage({
  params,
}: {
  params: Promise<{ noRm: string }>;
}) {
  const { noRm } = await params;

  return (
    <div className="p-10 text-gray-400" style={{ fontFamily: "var(--font-jakarta)" }}>
      <p className="text-sm">Halaman riwayat medis untuk pasien <strong className="text-gray-600">{noRm}</strong> — akan diimplementasi pada TR-51.</p>
    </div>
  );
}
