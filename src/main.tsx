import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import { App } from '@/app/App';
import { useAppStore } from '@/app/appStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useDriverStore } from '@/features/auth/store/driverStore';
import { useMitraStore } from '@/features/auth/store/mitraStore';
import { cleanupLegacyServiceWorkers } from '@/lib/browser/legacyServiceWorkerCleanup';

cleanupLegacyServiceWorkers();

// Hydrasi store dari localStorage secara sinkron SEBELUM render pertama,
// supaya guard onboarding/auth tidak salah mengarahkan saat reload.
useAppStore.getState().hydrate();
useAuthStore.getState().hydrate();
useDriverStore.getState().hydrate();
useMitraStore.getState().hydrate();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemen #root tidak ditemukan.');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
