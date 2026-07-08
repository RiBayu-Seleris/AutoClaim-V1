import { env } from '@/config/env';
import { createMockScanServices } from './mock';
import { createBackendScanServices } from './backend';
import type { ScanServices } from './types';

/**
 * Pilih implementasi layanan scanning berdasarkan env. Mengembalikan satu
 * instance singleton agar state internal (mis. tingkat sukses mock) konsisten.
 */
let cached: ScanServices | null = null;

export function getDefaultScanServices(): ScanServices {
  if (!cached) {
    const needsMock = env.useMockScanServices || env.useMockInsuranceCheck;
    const needsBackend = !env.useMockScanServices || !env.useMockInsuranceCheck;
    const mock = needsMock ? createMockScanServices() : null;
    const backend = needsBackend ? createBackendScanServices() : null;

    cached = {
      plateRecognition: env.useMockScanServices
        ? mock!.plateRecognition
        : backend!.plateRecognition,
      insuranceCheck: env.useMockInsuranceCheck ? mock!.insuranceCheck : backend!.insuranceCheck,
      upload: env.useMockScanServices ? mock!.upload : backend!.upload,
    };
  }
  return cached;
}

export * from './types';
export { setMockPlateSuccessRate } from './mock';
