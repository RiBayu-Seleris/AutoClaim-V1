import { Navigate, Outlet } from 'react-router-dom';
import { buildPath, ROUTES } from '@/app/routes';
import { useMitraStore } from '@/features/auth/store/mitraStore';

/** Lindungi tab portal mitra: tanpa sesi mitra → login mitra. */
export function MitraGuard() {
  const isLoggedIn = useMitraStore((s) => s.isLoggedIn);
  return isLoggedIn ? (
    <Outlet />
  ) : (
    <Navigate to={buildPath.loginMitraWithRedirect(ROUTES.mitra)} replace />
  );
}
