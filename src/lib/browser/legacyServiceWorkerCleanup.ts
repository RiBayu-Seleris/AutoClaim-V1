const CLEANUP_KEY = 'autoclaim:legacy-service-worker-cleanup:v1';

export function cleanupLegacyServiceWorkers(): void {
  if (typeof window === 'undefined') return;

  try {
    if (window.localStorage.getItem(CLEANUP_KEY) === 'done') return;
    window.localStorage.setItem(CLEANUP_KEY, 'done');
  } catch {
    // Tetap coba cleanup walau storage browser tidak tersedia.
  }

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => undefined);
  }

  if ('caches' in window) {
    void window.caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName))))
      .catch(() => undefined);
  }
}
