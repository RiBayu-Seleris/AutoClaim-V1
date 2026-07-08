/**
 * API publik modul scanning AutoClaim — titik impor tunggal untuk project lain
 * yang ingin memakai ulang alur pemindaian (kamera, OCR plat, cek asuransi,
 * pemotretan sisi kendaraan).
 */
export { CameraCapture } from './components/CameraCapture';
export { usePlateScan } from './hooks/usePlateScan';
export { useScanStore } from './store/scanStore';
export type { InsuranceStatus } from './store/scanStore';
export { ScanServicesProvider } from './services/ScanServicesProvider';
export { useScanServices } from './services/scanServicesContext';
export { getDefaultScanServices, setMockPlateSuccessRate } from './services/index';
export { normalizePlate, isValidPlate } from './utils/plate';
export {
  VEHICLE_SIDES,
  type CapturedImage,
  type VehicleSideId,
  type VehicleSideState,
} from './types';
export {
  PLATE_CONFIDENCE_THRESHOLD,
  MAX_PLATE_ATTEMPTS,
  type ScanServices,
  type PlateRecognitionService,
  type InsuranceCheckService,
  type ScanUploadService,
  type PlateRecognitionResult,
  type InsuranceCoverage,
} from './services/types';
