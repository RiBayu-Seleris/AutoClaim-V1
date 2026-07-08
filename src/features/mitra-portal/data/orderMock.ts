import type { TowingOrder } from '../types';

/** Data contoh order derek masuk. Ganti dengan endpoint mitra saat siap. */
export const TOWING_ORDERS: TowingOrder[] = [
  {
    id: 'ord-1',
    category: 'Derek Ringan',
    vehicle: 'Toyota Avanza - Putih',
    address: 'Jl. Sudirman No. 12, Jakarta Selatan (Dekat Halte Busway)',
    distanceKm: 2.4,
    etaMin: 6,
  },
  {
    id: 'ord-2',
    category: 'Derek Gendong',
    vehicle: 'Honda CR-V - Hitam',
    address: 'Gatot Subroto KM 5.5, Depan Wisma Mulia',
    distanceKm: 4.1,
    etaMin: 12,
  },
  {
    id: 'ord-3',
    category: 'Derek Ringan',
    vehicle: 'Daihatsu Xenia - Silver',
    address: 'Jl. TB Simatupang No. 21, Jakarta Selatan',
    distanceKm: 5.8,
    etaMin: 15,
  },
];
