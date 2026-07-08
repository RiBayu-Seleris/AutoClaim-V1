import { Users, Truck, Wallet, ClipboardList, BarChart3, FileText } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import type { MitraActivity, QuickAction } from '../types';

/**
 * Data contoh untuk Home mitra towing. Saat endpoint mitra siap, ganti dengan
 * data asli (saldo, aktivitas) tanpa mengubah komponen.
 */
export const TOWING_BALANCE = 2_900_000;

const TINT_AMBER = 'bg-warning/15 text-warning';
const TINT_BLUE = 'bg-deep-blue-50 text-deep-blue-600';
const TINT_RED = 'bg-[#E11D48]/10 text-[#E11D48]';
const TINT_GREEN = 'bg-green-cust/15 text-green-cust';

export const TOWING_QUICK_ACTIONS: QuickAction[] = [
  { key: 'sopir', label: 'Data Sopir Towing', icon: Users, tint: TINT_AMBER, to: ROUTES.mitraSopir },
  { key: 'armada', label: 'Armada Towing', icon: Truck, tint: TINT_BLUE, to: ROUTES.mitraArmada },
  { key: 'saldo', label: 'Tarik Saldo', icon: Wallet, tint: TINT_RED, to: ROUTES.mitraTarikSaldo },
  { key: 'laporan', label: 'Laporan Sopir Towing', icon: FileText, tint: TINT_GREEN, to: ROUTES.mitraLaporan },
  { key: 'transaksi', label: 'Transaction report', icon: BarChart3, tint: TINT_BLUE, to: ROUTES.mitraSaldo },
  { key: 'order', label: 'Order', icon: ClipboardList, tint: TINT_AMBER, to: ROUTES.mitraOrder },
];

export const TOWING_ACTIVITIES: MitraActivity[] = [
  {
    id: 'a1',
    driverName: 'Bapak Anto',
    description: 'Perjalanan menuju Tol Cikampek',
    time: '12.30',
    fleetLabel: 'Armada 1',
  },
  {
    id: 'a2',
    driverName: 'Bapak Anto',
    description: 'Perjalanan menuju Tol Cikampek',
    time: '12.30',
    fleetLabel: 'Armada 2',
  },
  {
    id: 'a3',
    driverName: 'Bapak Anto',
    description: 'Perjalanan menuju Tol Cikampek',
    time: '12.30',
    fleetLabel: 'Armada 3',
  },
];
