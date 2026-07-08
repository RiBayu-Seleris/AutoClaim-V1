/**
 * Kontrak layanan untuk modul scanning. Sengaja dibuat sebagai interface murni
 * agar modul ini PORTABLE: project lain bisa menyuntikkan implementasi sendiri
 * (mis. OCR backend berbeda) tanpa menyentuh komponen UI.
 *
 * Saat ini implementasi default = mock (lihat `mock.ts`); ganti ke backend asli
 * cukup dengan menukar factory di `index.ts` atau lewat `ScanServicesProvider`.
 */

export interface PlateRecognitionResult {
  /** True bila plat terbaca cukup jelas (confidence di atas ambang). */
  detected: boolean;
  /** Nomor plat ternormalisasi (mis. "B 1234 ABC") atau null bila gagal. */
  plateNumber: string | null;
  /** Tingkat keyakinan 0..1. */
  confidence: number;
}

export interface PlateRecognitionService {
  /** Kenali nomor plat dari foto. Tidak melempar untuk "tidak terbaca" —
   *  kembalikan `detected: false` agar pemanggil bisa menghitung kegagalan. */
  recognize(image: Blob): Promise<PlateRecognitionResult>;
}

export interface InsuranceCoverage {
  insured: boolean;
  insurerName?: string;
  productName?: string;
  policyNumber?: string;
  /** ISO date masa berlaku polis, bila ada. */
  validUntil?: string;
}

export interface InsuranceCheckService {
  /** Cek apakah sebuah plat sudah ditanggung asuransi. */
  checkByPlate(plateNumber: string): Promise<InsuranceCoverage>;
}

export interface ScanUploadService {
  /** Unggah satu foto; kembalikan key/URL gambar dari storage. */
  upload(image: Blob, category: string): Promise<string>;
}

export interface ScanServices {
  plateRecognition: PlateRecognitionService;
  insuranceCheck: InsuranceCheckService;
  upload: ScanUploadService;
}

/** Ambang minimum confidence agar plat dianggap "terdeteksi jelas". */
export const PLATE_CONFIDENCE_THRESHOLD = 0.75;

/** Jumlah percobaan OCR gagal sebelum beralih ke input manual. */
export const MAX_PLATE_ATTEMPTS = 3;
