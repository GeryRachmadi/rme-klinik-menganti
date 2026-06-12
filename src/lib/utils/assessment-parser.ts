// Mengekstrak "Amoxicillin (Tinggi)" menjadi { name: "Amoxicillin", severity: "Tinggi" }
// Tingkat keparahan bersifat opsional — chip tanpa "(Tinggi/Sedang/Rendah)"
// menghasilkan severity kosong ("").
export function parseAllergyChip(chip: string): { name: string; severity: string } {
  // Regex mencari teks apapun, diikuti oleh spasi opsional, dan (Tinggi/Sedang/Rendah) di akhir string
  const match = chip.match(/(.*?)\s*\((Tinggi|Sedang|Rendah)\)$/i);

  if (match) {
    return {
      name: match[1].trim(),
      severity: match[2]
    };
  }

  // Tidak ada tingkat keparahan — severity opsional, simpan kosong.
  return { name: chip.trim(), severity: '' };
}

// Mengekstrak "Paracetamol (500mg)" menjadi { name: "Paracetamol", dosage: "500mg" }
export function parseMedicationChip(chip: string): { name: string; dosage?: string } {
  // Regex mencari teks apapun, diikuti (teks apapun) di akhir
  const match = chip.match(/(.*?)\s*\((.*?)\)$/);
  
  if (match) {
    return { 
      name: match[1].trim(), 
      dosage: match[2].trim() 
    };
  }
  
  // Jika tidak ada dosis ("Aspirin" saja)
  return { name: chip.trim() }; 
}