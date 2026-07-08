import { Suspense, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES, buildPath } from './routes';
import { useAppStore } from './appStore';
import { PageLoader } from '@/components/feedback/PageLoader';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * Gerbang onboarding tingkat atas:
 * - Belum lihat onboarding & bukan di /get-started → paksa ke /get-started.
 * - Sudah lihat & masih di /get-started → lempar ke beranda.
 */
export function RootGate() {
  const onboardingSeen = useAppStore((s) => s.onboardingSeen);
  const { pathname } = useLocation();

  if (!onboardingSeen && pathname !== ROUTES.getStarted) {
    return <Navigate to={ROUTES.getStarted} replace />;
  }
  if (onboardingSeen && pathname === ROUTES.getStarted) {
    return <Navigate to={ROUTES.home} replace />;
  }
  // Boundary tunggal untuk SEMUA rute lazy (termasuk anak AppShell).
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

/** Bungkus elemen yang butuh sesi user; bila belum login → ke /login?redirect=. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={buildPath.loginWithRedirect(target)} replace />;
  }
  return <>{children}</>;
}
