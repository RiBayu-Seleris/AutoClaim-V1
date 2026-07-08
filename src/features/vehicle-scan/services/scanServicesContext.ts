import { createContext, useContext } from 'react';
import { getDefaultScanServices } from './index';
import type { ScanServices } from './types';

export const ScanServicesContext = createContext<ScanServices | null>(null);

/**
 * Ambil implementasi layanan scanning dari provider terdekat, atau jatuh ke
 * implementasi default (berbasis env) bila tidak ada provider.
 */
export function useScanServices(): ScanServices {
  return useContext(ScanServicesContext) ?? getDefaultScanServices();
}
