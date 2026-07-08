import { Navigate } from 'react-router-dom';
import { buildPath, ROUTES } from '@/app/routes';
import { useDriverStore } from '@/features/auth/store/driverStore';
import { DriverTasksPage } from './DriverTasksPage';

/**
 * Gerbang portal sopir: sesi sopir terpisah dan masuk lewat halaman login sopir.
 */
export function DriverGate() {
  const isLoggedIn = useDriverStore((s) => s.isLoggedIn);
  return isLoggedIn ? (
    <DriverTasksPage />
  ) : (
    <Navigate to={buildPath.loginSopirWithRedirect(ROUTES.driver)} replace />
  );
}
