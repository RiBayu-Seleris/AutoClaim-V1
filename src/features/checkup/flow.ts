import { ROUTES } from '@/app/routes';
import { APP_FEATURES } from '@/config/constants';

/**
 * Langkah pertama alur cek kondisi kendaraan (setelah tutorial).
 *
 * Bila fitur kendaraan tersimpan aktif, user MEMILIH kendaraan dulu supaya data
 * (merk) otomatis terisi di langkah berikutnya; jika tidak, langsung ke input
 * data kendaraan.
 */
export function firstScanStepRoute(): string {
  return APP_FEATURES.savedVehicles ? ROUTES.selectVehicle : ROUTES.vehicleData;
}
