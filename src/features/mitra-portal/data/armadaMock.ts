import type { FilterChip } from '../components/MitraFilterChips';
import type { Armada, ArmadaStatus } from '../types';

/** Data contoh armada towing. Ganti dengan endpoint mitra saat siap. */
export const ARMADA_FILTERS: FilterChip[] = [
  { value: 'all', label: 'Semua' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'heavy', label: 'Heavy Duty' },
  { value: 'motorcycle', label: 'Motorcycle' },
];

export const ARMADA_STATUS_META: Record<ArmadaStatus, { label: string; tone: string }> = {
  tersedia: { label: 'Tersedia', tone: 'text-green-cust' },
  bertugas: { label: 'Bertugas', tone: 'text-warning' },
};

export const ARMADA_JENIS_OPTIONS = [
  'Flatbed Carrier',
  'Heavy Duty Towing',
  'Motorcycle Carrier',
  'Wheel Lift Tow',
] as const;

export const ARMADA_LIST: Armada[] = [
  {
    id: 'isuzu-giga-fvr',
    name: 'Isuzu Giga FVR',
    type: 'Flatbed Carrier',
    category: 'flatbed',
    plate: 'B 9042 TWA',
    status: 'tersedia',
    price: 'Rp 850.000',
    capacity: '8.000 kg',
    year: '2022',
    engineNo: 'J08E-WD21',
    health: 95,
    odometer: '12.450',
    driverName: 'Budi Santoso',
    driverSince: 'Driver Sejak 2021',
    driverRating: 4.9,
    location: 'Gudang Logistik Cilandak',
    trips: [
      { id: 't1', route: 'Jakarta Selatan → Tangerang Kota', label: 'Derek Darurat (Kecelakaan)', meta: 'Jarak: 28 KM' },
      { id: 't2', route: 'Depok → Jakarta Timur', label: 'Pengiriman Unit', meta: 'Jarak: 24 KM' },
      { id: 't3', route: 'Jakarta Barat → BSD City', label: 'Derek Darurat (Mogok)', meta: 'Jarak: 32 KM' },
    ],
  },
  {
    id: 'hino-ranger-fl',
    name: 'Hino Ranger FL',
    type: 'Heavy Duty Towing',
    category: 'heavy',
    plate: 'B 7781 TWB',
    status: 'bertugas',
    price: 'Rp 950.000',
    capacity: '15.000 kg',
    year: '2021',
    engineNo: 'J08E-UG',
    health: 88,
    odometer: '28.900',
    driverName: 'Andi Wijaya',
    driverSince: 'Driver Sejak 2020',
    driverRating: 4.8,
    location: 'Tol JORR KM 12',
    trips: [
      { id: 't1', route: 'Bekasi → Karawang', label: 'Derek Kendaraan Berat', meta: 'Jarak: 41 KM' },
      { id: 't2', route: 'Cikampek → Jakarta Timur', label: 'Pengiriman Unit', meta: 'Jarak: 56 KM' },
    ],
  },
  {
    id: 'mitsubishi-fuso-canter',
    name: 'Mitsubishi Fuso Canter',
    type: 'Motorcycle Carrier',
    category: 'motorcycle',
    plate: 'B 1594 ZX',
    status: 'bertugas',
    price: 'Rp 450.000',
    capacity: '3.500 kg',
    year: '2023',
    engineNo: '4D34-T',
    health: 97,
    odometer: '6.120',
    driverName: 'Rizky Pratama',
    driverSince: 'Driver Sejak 2022',
    driverRating: 4.7,
    location: 'Pool Fatmawati',
    trips: [
      { id: 't1', route: 'Jakarta Selatan → Bogor', label: 'Pengiriman Motor', meta: 'Jarak: 38 KM' },
    ],
  },
  {
    id: 'toyota-dyna-130-ht',
    name: 'Toyota Dyna 130 HT',
    type: 'Flatbed Carrier',
    category: 'flatbed',
    plate: 'B 8801 VCC',
    status: 'tersedia',
    price: 'Rp 800.000',
    capacity: '6.500 kg',
    year: '2022',
    engineNo: 'W04D',
    health: 91,
    odometer: '18.300',
    driverName: 'Agus Salim',
    driverSince: 'Driver Sejak 2021',
    driverRating: 4.6,
    location: 'Pool Cikini',
    trips: [
      { id: 't1', route: 'Jakarta Pusat → Depok', label: 'Derek Darurat (Mogok)', meta: 'Jarak: 22 KM' },
    ],
  },
];

export function findArmada(id: string): Armada | undefined {
  return ARMADA_LIST.find((a) => a.id === id);
}
