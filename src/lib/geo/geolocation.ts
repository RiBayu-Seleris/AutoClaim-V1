export interface GeoPosition {
  latitude: number;
  longitude: number;
  /** Radius akurasi horizontal dalam meter (makin kecil makin akurat). */
  accuracy: number;
}

interface AccuratePositionOptions {
  /** Berhenti lebih awal bila akurasi sudah mencapai nilai ini (meter). */
  desiredAccuracyM?: number;
  /** Batas waktu total (ms) sebelum mengembalikan pembacaan terbaik. */
  timeoutMs?: number;
}

/**
 * Ambil posisi perangkat seakurat mungkin. GPS sering memberi pembacaan awal
 * yang kasar lalu menajam; kita pantau beberapa pembacaan dan menyimpan yang
 * paling akurat. Resolusi lebih awal saat sudah cukup akurat agar tetap cepat.
 *
 * Catatan: butuh secure context (HTTPS atau localhost) + izin lokasi.
 */
export function getAccuratePosition(options: AccuratePositionOptions = {}): Promise<GeoPosition> {
  const desiredAccuracyM = options.desiredAccuracyM ?? 20;
  const timeoutMs = options.timeoutMs ?? 12_000;

  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('geolocation-unavailable'));
      return;
    }

    let best: GeoPosition | null = null;
    let settled = false;
    let watchId: number | null = null;

    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timer);
      if (best) resolve(best);
      else reject(error instanceof Error ? error : new Error('geolocation-failed'));
    };

    const timer = window.setTimeout(() => finish(), timeoutMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const reading: GeoPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        if (!best || reading.accuracy < best.accuracy) best = reading;
        if (reading.accuracy <= desiredAccuracyM) finish(); // sudah cukup akurat
      },
      (err) => {
        if (!best) finish(err); // hanya gagal bila belum ada pembacaan sama sekali
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs },
    );
  });
}
