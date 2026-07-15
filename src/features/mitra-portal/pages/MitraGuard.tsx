import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { buildPath, ROUTES } from '@/app/routes';
import { useMitraStore } from '@/features/auth/store/mitraStore';

/** Lindungi tab portal mitra: tanpa sesi (termasuk token expired) → login mitra. */
export function MitraGuard() {
  const isLoggedIn = useMitraStore((s) => s.isLoggedIn);
  const location = useLocation();
  const redirectTo = location.pathname.startsWith(ROUTES.mitra)
    ? location.pathname
    : ROUTES.mitra;
  return isLoggedIn ? (
    <Outlet />
  ) : (
    <Navigate to={buildPath.loginMitraWithRedirect(redirectTo)} replace />
  );
}
