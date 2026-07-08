import { BarChart3, ClipboardList, FileText, Wallet, Wrench } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import type { MitraActivity, QuickAction, WorkshopJob } from '../types';

const TINT_BLUE = 'bg-deep-blue-50 text-deep-blue-600';
const TINT_GREEN = 'bg-green-cust/15 text-green-cust';
const TINT_AMBER = 'bg-warning/15 text-warning';
const TINT_RED = 'bg-[#E11D48]/10 text-[#E11D48]';

export const WORKSHOP_BALANCE = 7_450_000;

export const WORKSHOP_QUICK_ACTIONS: QuickAction[] = [
  { key: 'jobs', label: 'Antrian Pekerjaan', icon: ClipboardList, tint: TINT_BLUE, to: ROUTES.mitraWorkshopJobs },
  { key: 'inspection', label: 'Inspeksi Kendaraan', icon: Wrench, tint: TINT_AMBER, to: ROUTES.mitraWorkshopJobs },
  { key: 'reports', label: 'Laporan Bengkel', icon: FileText, tint: TINT_GREEN, to: ROUTES.mitraLaporan },
  { key: 'saldo', label: 'Tarik Saldo', icon: Wallet, tint: TINT_RED, to: ROUTES.mitraTarikSaldo },
  { key: 'transactions', label: 'Transaction report', icon: BarChart3, tint: TINT_BLUE, to: ROUTES.mitraSaldo },
];

export const WORKSHOP_ACTIVITIES: MitraActivity[] = [
  {
    id: 'w-act-1',
    driverName: 'Toyota Avanza',
    description: 'Estimasi perbaikan menunggu verifikasi',
    time: '09.40',
    fleetLabel: 'B 1234 ADK',
  },
  {
    id: 'w-act-2',
    driverName: 'Honda HR-V',
    description: 'Pengerjaan panel samping berjalan',
    time: '11.10',
    fleetLabel: 'B 4412 KLA',
  },
  {
    id: 'w-act-3',
    driverName: 'Daihatsu Xenia',
    description: 'Siap serah terima ke customer',
    time: '13.25',
    fleetLabel: 'B 9311 CCD',
  },
];

export const WORKSHOP_JOBS: WorkshopJob[] = [
  {
    id: 'WRK-22031',
    customerName: 'Dewi Kartika',
    vehicle: 'Toyota Avanza 2021',
    plateNumber: 'B 1234 ADK',
    status: 'inspection',
    severity: 'Moderate',
    eta: '2 hari',
    intakeDate: '17 Jun 2026',
    address: 'Auto2000 Saharjo, Tebet',
    tasks: ['Cek bumper depan', 'Estimasi lampu kanan', 'Upload foto kerusakan'],
    estimate: 3_850_000,
  },
  {
    id: 'WRK-22022',
    customerName: 'Raka Pradipta',
    vehicle: 'Honda HR-V 2022',
    plateNumber: 'B 4412 KLA',
    status: 'repairing',
    severity: 'Major',
    eta: '4 hari',
    intakeDate: '15 Jun 2026',
    address: 'Bengkel Mitra Fatmawati',
    tasks: ['Cat panel kiri', 'Ganti spion kiri', 'Kalibrasi sensor parkir'],
    estimate: 7_200_000,
  },
  {
    id: 'WRK-22018',
    customerName: 'Maya Sari',
    vehicle: 'Daihatsu Xenia 2020',
    plateNumber: 'B 9311 CCD',
    status: 'ready',
    severity: 'Minor',
    eta: 'Siap ambil',
    intakeDate: '14 Jun 2026',
    address: 'Bengkel Mitra Cikini',
    tasks: ['Poles bumper belakang', 'Quality control akhir'],
    estimate: 1_450_000,
  },
];

export function findWorkshopJob(id: string): WorkshopJob | undefined {
  return WORKSHOP_JOBS.find((job) => job.id === id);
}
