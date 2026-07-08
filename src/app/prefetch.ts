/**
 * Prefetch cerdas: pra-muat potongan (chunk) rute yang paling mungkin dibuka
 * berikutnya — alur scan kendaraan & rekomendasi bengkel — saat browser IDLE,
 * sehingga navigasi terasa instan tanpa membebani muat awal.
 *
 * `import()` di sini menunjuk modul yang sama dengan di `router.tsx`, jadi
 * chunk-nya dipakai ulang (tidak ada duplikasi kode).
 */
const PREFETCHERS: Array<() => Promise<unknown>> = [
  () => import('@/features/checkup/pages/CheckConditionPage'),
  () => import('@/features/checkup/pages/VehicleDataPage'),
  () => import('@/features/checkup/pages/LicensePlatePage'),
  () => import('@/features/vehicle-scan/components/CameraCapture'),
  () => import('@/features/checkup/pages/VehicleSidesPage'),
  () => import('@/features/checkup/pages/PreviewVehiclePage'),
  () => import('@/features/damage/pages/DamageAnalysisPage'),
  () => import('@/features/workshop/pages/WorkshopListPage'),
];

interface NetworkInformationLite {
  saveData?: boolean;
  effectiveType?: string;
}

let triggered = false;

export function prefetchLikelyRoutes(): void {
  if (triggered || typeof window === 'undefined') return;
  triggered = true;

  // Hormati mode hemat-data & jaringan lambat: jangan prefetch agar tidak
  // merebut bandwidth dari konten utama (mis. gambar LCP).
  const conn = (navigator as Navigator & { connection?: NetworkInformationLite }).connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return;

  const run = () => {
    for (const load of PREFETCHERS) {
      void load().catch(() => undefined); // gagal prefetch tidak boleh mengganggu UX
    }
  };

  // Tunggu sampai muat awal selesai dulu, baru prefetch saat browser idle.
  const schedule = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run, { timeout: 5000 });
    } else {
      window.setTimeout(run, 2500);
    }
  };

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}
