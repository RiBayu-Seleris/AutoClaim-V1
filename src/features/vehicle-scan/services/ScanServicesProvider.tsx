import { useMemo, type ReactNode } from 'react';
import { getDefaultScanServices } from './index';
import { ScanServicesContext } from './scanServicesContext';
import type { ScanServices } from './types';

/**
 * Sediakan implementasi layanan scanning. Project lain yang memakai ulang modul
 * ini bisa membungkus dengan provider ini dan menyuntikkan service custom.
 * Tanpa provider, `useScanServices` jatuh ke implementasi default (env-based).
 */
export function ScanServicesProvider({
  services,
  children,
}: {
  services?: Partial<ScanServices>;
  children: ReactNode;
}) {
  const value = useMemo<ScanServices>(() => {
    const defaults = getDefaultScanServices();
    return { ...defaults, ...services };
  }, [services]);

  return <ScanServicesContext.Provider value={value}>{children}</ScanServicesContext.Provider>;
}
