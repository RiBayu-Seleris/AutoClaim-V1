import { STORAGE_KEYS } from '@/config/constants';
import { storage } from '@/lib/storage/storage';

/**
 * Izin perangkat yang diminta sekali sebelum alur cek kondisi kendaraan
 * (mengikuti permission gate di autoclaim-flutter). Di web izin diberikan via
 * prompt browser saat dipakai; layar ini meminta lebih awal agar alur scan,
 * rekomendasi lokasi, dan notifikasi siap dipakai.
 */
export interface CheckupPermissionResult {
  camera: boolean;
  location: boolean;
  notification: boolean;
}

/** Lama tunggu prompt lokasi sebelum dianggap gagal (ms). */
const LOCATION_PROMPT_TIMEOUT_MS = 10_000;

/** True bila user sudah pernah melewati layar izin (penanda one-time). */
export function hasCheckupPermissionsGranted(): boolean {
  return storage.getBool(STORAGE_KEYS.checkupPermissionGranted);
}

/** Tandai layar izin sudah dilewati agar tidak ditampilkan berulang. */
export function markCheckupPermissionsSeen(): void {
  storage.setBool(STORAGE_KEYS.checkupPermissionGranted, true);
}

async function requestCameraPermission(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    // Langsung hentikan track: tujuan kita hanya memicu prompt izin.
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

function requestLocationPermission(): Promise<boolean> {
  if (!('geolocation' in navigator)) return Promise.resolve(false);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { timeout: LOCATION_PROMPT_TIMEOUT_MS },
    );
  });
}

async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

/**
 * Minta ketiga izin secara berurutan (kamera → lokasi → notifikasi) agar prompt
 * browser tidak menumpuk. Best-effort: hasil ditolak tidak menghentikan alur —
 * komponen kamera akan meminta ulang saat pengambilan foto bila perlu.
 */
export async function requestCheckupPermissions(): Promise<CheckupPermissionResult> {
  const camera = await requestCameraPermission();
  const location = await requestLocationPermission();
  const notification = await requestNotificationPermission();
  return { camera, location, notification };
}
