import type { FilterChip } from '../components/MitraFilterChips';
import type { Sopir, SopirStatus } from '../types';

/**
 * Data contoh sopir towing. Ganti dengan respons endpoint mitra saat siap tanpa
 * mengubah komponen tampilan.
 */
export const SOPIR_FILTERS: FilterChip[] = [
  { value: 'all', label: 'Semua' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'on_duty', label: 'On Duty' },
  { value: 'offline', label: 'Offline' },
];

export const SOPIR_STATUS_META: Record<SopirStatus, { label: string; tone: string; dot: string }> =
  {
    aktif: { label: 'Aktif', tone: 'bg-green-cust/12 text-green-cust', dot: 'bg-green-cust' },
    on_duty: { label: 'On Duty', tone: 'bg-deep-blue-500 text-white', dot: 'bg-deep-blue-500' },
    offline: { label: 'Offline', tone: 'bg-neutral-200 text-neutral-600', dot: 'bg-neutral-400' },
  };

export const SOPIR_LIST: Sopir[] = [
  {
    id: 'drv-0842',
    code: 'DRV-0842',
    name: 'Budi Santoso',
    role: 'Spesialis Pemulihan Senior',
    status: 'aktif',
    fleetLabel: 'Towing Flatbed #042',
    rating: 4.9,
    ratingCount: 124,
    phone: '+62 812 3456 7890',
    email: 'budi.s@autoclaim.id',
    address: 'Jl. Sudirman No. 12, Jakarta Selatan',
    plate: 'B 1234 ABC',
    vehicleType: 'Truk Derek Flatbed',
    lastService: '15 Okt 2023',
    serviceNote: 'Kondisi Baik',
    trips: 152,
    shiftHours: 8,
    documents: [
      { label: 'SIM BII', sub: 'Berlaku: 12 Jan 2026', ok: true },
      { label: 'STNK', sub: 'Status Aktif', ok: true },
    ],
  },
  {
    id: 'drv-1102',
    code: 'DRV-1102',
    name: 'Andi Wijaya',
    role: 'Operator Derek Berat',
    status: 'on_duty',
    fleetLabel: 'Heavy Duty Tow #018',
    destination: 'Sudirman Central',
    phone: '+62 813 1122 3344',
    email: 'andi.w@autoclaim.id',
    address: 'Jl. Gatot Subroto No. 45, Jakarta Selatan',
    plate: 'B 5678 DEF',
    vehicleType: 'Heavy Duty Tow',
    lastService: '02 Okt 2023',
    serviceNote: 'Kondisi Baik',
    trips: 98,
    shiftHours: 6,
    documents: [
      { label: 'SIM BII', sub: 'Berlaku: 20 Mar 2027', ok: true },
      { label: 'STNK', sub: 'Status Aktif', ok: true },
    ],
  },
  {
    id: 'drv-0915',
    code: 'DRV-0915',
    name: 'Agus Salim',
    role: 'Operator Towing Flatbed',
    status: 'offline',
    fleetLabel: 'Towing Flatbed #045',
    lastSeen: '2 jam lalu',
    phone: '+62 811 9988 7766',
    email: 'agus.s@autoclaim.id',
    address: 'Jl. Cikini Raya No. 7, Jakarta Pusat',
    plate: 'B 9012 GHI',
    vehicleType: 'Truk Derek Flatbed',
    lastService: '28 Sep 2023',
    serviceNote: 'Perlu Servis',
    trips: 71,
    shiftHours: 0,
    documents: [
      { label: 'SIM BII', sub: 'Berlaku: 05 Jun 2025', ok: true },
      { label: 'STNK', sub: 'Status Aktif', ok: true },
    ],
  },
  {
    id: 'drv-1205',
    code: 'DRV-1205',
    name: 'Rizky Pratama',
    role: 'Operator Motorcycle Carrier',
    status: 'aktif',
    fleetLabel: 'Motorcycle Carrier #009',
    rating: 4.8,
    ratingCount: 89,
    phone: '+62 812 5566 7788',
    email: 'rizky.p@autoclaim.id',
    address: 'Jl. Fatmawati No. 21, Jakarta Selatan',
    plate: 'B 3344 JKL',
    vehicleType: 'Motorcycle Carrier',
    lastService: '10 Okt 2023',
    serviceNote: 'Kondisi Baik',
    trips: 134,
    shiftHours: 7,
    documents: [
      { label: 'SIM C', sub: 'Berlaku: 18 Feb 2026', ok: true },
      { label: 'STNK', sub: 'Status Aktif', ok: true },
    ],
  },
];

export function findSopir(id: string): Sopir | undefined {
  return SOPIR_LIST.find((s) => s.id === id);
}
