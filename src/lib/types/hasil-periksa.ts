/**
 * Types for Doctor's additional clinical notes (Hasil Periksa).
 * Used to supplement the nurse's initial assessment.
 */
export interface HasilPeriksa {
  /**
   * Main complaint / Subjective notes added by the doctor.
   * Max 500 characters. Optional.
   */
  keluhanUtama?: string;

  /**
   * Additional physical exam / Objective notes added by the doctor.
   * Max 500 characters. Optional.
   */
  pemeriksaanFisikTambahan?: string;
}
