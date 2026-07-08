import { userApi } from '@/lib/api/client';
import { PLATE_CONFIDENCE_THRESHOLD } from './types';
import type {
  InsuranceCheckService,
  InsuranceCoverage,
  PlateRecognitionResult,
  PlateRecognitionService,
  ScanServices,
  ScanUploadService,
} from './types';

/**
 * Implementasi backend asli. Saat ini endpoint OCR plat & cek asuransi MUNGKIN
 * belum tersedia — implementasi ini siap pakai begitu backend hidup. Selama
 * `VITE_USE_MOCK_SERVICES=true`, kode di sini tidak dijalankan.
 *
 * TODO(backend): konfirmasi path & bentuk respons final lalu sesuaikan parsing.
 */

class BackendPlateRecognitionService implements PlateRecognitionService {
  async recognize(image: Blob): Promise<PlateRecognitionResult> {
    const form = new FormData();
    form.append('uploadfile', image, 'plate.jpg');
    const res = await userApi.post<{
      data?: { plate_number?: string; confidence?: number };
    }>('/v1/inference/plate/ocr', form);
    const data = res.data?.data;
    const confidence = typeof data?.confidence === 'number' ? data.confidence : 0;
    const plateNumber = data?.plate_number ?? null;
    return {
      detected: Boolean(plateNumber) && confidence >= PLATE_CONFIDENCE_THRESHOLD,
      plateNumber,
      confidence,
    };
  }
}

class BackendInsuranceCheckService implements InsuranceCheckService {
  async checkByPlate(plateNumber: string): Promise<InsuranceCoverage> {
    const res = await userApi.get<{
      data?: {
        insured?: boolean;
        insurer_name?: string;
        product_name?: string;
        policy_number?: string;
        valid_until?: string;
      };
    }>('/v1/insurance/coverage', { params: { plate: plateNumber } });
    const data = res.data?.data;
    return {
      insured: Boolean(data?.insured),
      insurerName: data?.insurer_name,
      productName: data?.product_name,
      policyNumber: data?.policy_number,
      validUntil: data?.valid_until,
    };
  }
}

class BackendUploadService implements ScanUploadService {
  async upload(image: Blob, category: string): Promise<string> {
    const form = new FormData();
    form.append('uploadfile', image, `${category}.jpg`);
    form.append('category', category);
    const res = await userApi.post<{ data?: unknown }>('/v1/s3/image/upload', form);
    const data = res.data?.data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      const value = obj.file_path ?? obj.image_name ?? obj.url ?? obj.key;
      if (typeof value === 'string') return value;
    }
    throw new Error('Respons unggah gambar tidak valid.');
  }
}

export function createBackendScanServices(): ScanServices {
  return {
    plateRecognition: new BackendPlateRecognitionService(),
    insuranceCheck: new BackendInsuranceCheckService(),
    upload: new BackendUploadService(),
  };
}
