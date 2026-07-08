import { Navigate } from 'react-router-dom';
import { buildPath, ROUTES } from '@/app/routes';
import { useMitraStore } from '@/features/auth/store/mitraStore';
import { TowingHomePage } from './towing/TowingHomePage';
import { WorkshopHomePage } from './workshop/WorkshopHomePage';

/**
 * Gerbang portal mitra (route Home `/mitra`): belum login → login mitra;
 * sudah login → portal sesuai tipe.
 */
export function MitraGate() {
  const isLoggedIn = useMitraStore((s) => s.isLoggedIn);
  const partnerType = useMitraStore((s) => s.partnerType);

  if (!isLoggedIn) return <Navigate to={buildPath.loginMitraWithRedirect(ROUTES.mitra)} replace />;
  if (partnerType === 'towing') return <TowingHomePage />;
  return <WorkshopHomePage />;
}
