import { ROUTES } from '@/app/routes';
import type { MitraActivity, QuickAction } from '../types';

/**
 * Data contoh untuk Home mitra towing. Saat endpoint mitra siap, ganti dengan
 * data asli (saldo, aktivitas) tanpa mengubah komponen.
 */
export const TOWING_BALANCE = 2_900_000;

// Ilustrasi diekstrak dari desain Figma (UI-FLOW/Mitra-Towing/svg/Home.svg).
const ASSET = '/assets/mitra/towing';

export const TOWING_QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'sopir',
    label: 'Data Sopir Towing',
    image: `${ASSET}/qa-sopir.svg`,
    to: ROUTES.mitraSopir,
  },
  {
    key: 'armada',
    label: 'Armada Towing',
    image: `${ASSET}/qa-armada.svg`,
    to: ROUTES.mitraArmada,
  },
  {
    key: 'saldo',
    label: 'Tarik Saldo',
    image: `${ASSET}/qa-saldo.svg`,
    to: ROUTES.mitraTarikSaldo,
  },
  {
    key: 'laporan',
    label: 'Laporan Sopir Towing',
    image: `${ASSET}/qa-laporan.svg`,
    to: ROUTES.mitraLaporan,
  },
  {
    key: 'transaksi',
    label: 'Transaction report',
    image: `${ASSET}/qa-transaksi.svg`,
    to: ROUTES.mitraSaldo,
  },
  {
    key: 'order',
    label: 'Order',
    image: `${ASSET}/qa-order.svg`,
    to: ROUTES.mitraOrder,
  },
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
