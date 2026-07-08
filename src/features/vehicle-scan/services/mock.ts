import type {
  InsuranceCheckService,
  InsuranceCoverage,
  PlateRecognitionResult,
  PlateRecognitionService,
  ScanServices,
  ScanUploadService,
} from './types';
import { normalizePlate } from '../utils/plate';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tingkat keberhasilan OCR mock (0..1). Sengaja "flaky" agar alur baru
 * "3x gagal → input manual" bisa diuji. Bisa diubah saat demo/test.
 */
let mockSuccessRate = 0.5;
export function setMockPlateSuccessRate(rate: number): void {
  mockSuccessRate = Math.min(1, Math.max(0, rate));
}

const REGIONS = ['B', 'D', 'F', 'L', 'N', 'AB', 'AD', 'BK'];
const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const MOCK_INSURED_PLATES = new Set(['B 1234 CDE', 'B 3456 FGH', 'B 1387 DKC']);

function randomPlate(): string {
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const number = Math.floor(1000 + Math.random() * 8999);
  let suffix = '';
  for (let i = 0; i < 3; i += 1) {
    suffix += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return `${region} ${number} ${suffix}`;
}

class MockPlateRecognitionService implements PlateRecognitionService {
  async recognize(_image: Blob): Promise<PlateRecognitionResult> {
    await delay(900);
    const success = Math.random() < mockSuccessRate;
    if (success) {
      const confidence = 0.78 + Math.random() * 0.2;
      return { detected: true, plateNumber: randomPlate(), confidence };
    }
    // Gagal: confidence rendah, plat tidak terbaca.
    return { detected: false, plateNumber: null, confidence: 0.3 + Math.random() * 0.4 };
  }
}

/** Mock cek asuransi — deterministik untuk kebutuhan demo/E2E. */
class MockInsuranceCheckService implements InsuranceCheckService {
  async checkByPlate(plateNumber: string): Promise<InsuranceCoverage> {
    await delay(700);
    const normalized = normalizePlate(plateNumber);
    const insured = MOCK_INSURED_PLATES.has(normalized);
    if (!insured) return { insured: false };

    const digits = normalized.replace(/\D/g, '');
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    return {
      insured: true,
      insurerName: 'Asuransi Sinar Jaya',
      productName: 'Auto Protect Comprehensive',
      policyNumber: `POL-${digits.padEnd(6, '0').slice(0, 6)}`,
      validUntil: validUntil.toISOString(),
    };
  }
}

class MockUploadService implements ScanUploadService {
  async upload(image: Blob, _category: string): Promise<string> {
    await delay(400);
    // Tanpa backend: kembalikan object URL lokal agar alur tetap berlanjut.
    return URL.createObjectURL(image);
  }
}

export function createMockScanServices(): ScanServices {
  return {
    plateRecognition: new MockPlateRecognitionService(),
    insuranceCheck: new MockInsuranceCheckService(),
    upload: new MockUploadService(),
  };
}
