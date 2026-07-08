import { ROUTES } from '@/app/routes';
import { APP_FEATURES } from '@/config/constants';

/**
 * Langkah pertama setelah tutorial + izin pada alur cek kondisi kendaraan.
 *
 * Saat fitur kendaraan tersimpan dinonaktifkan, user langsung mengambil foto
 * plat kendaraan yang sedang dicek agar tidak salah memilih kendaraan lain.
 */
export function firstScanStepRoute(_isAuthenticated?: boolean): string {
  return APP_FEATURES.savedVehicles ? ROUTES.selectVehicle : ROUTES.licensePlate;
}
