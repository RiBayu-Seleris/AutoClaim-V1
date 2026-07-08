/** Format angka ke Rupiah, mis. 1500000 → "Rp 1.500.000". */
export function formatCurrency(value: number | null | undefined): string {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format tanggal panjang berbahasa Indonesia, mis. "9 Juni 2026". */
export function formatDate(input: string | number | Date | null | undefined): string {
  if (!input) return '-';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Tanggal + jam, mis. "9 Jun 2026, 14:30". */
export function formatDateTime(input: string | number | Date | null | undefined): string {
  if (!input) return '-';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Waktu relatif sederhana, mis. "3 jam lalu". */
export function formatRelativeTime(input: string | number | Date | null | undefined): string {
  if (!input) return '-';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '-';
  const diffMs = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'Baru saja';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} menit lalu`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} jam lalu`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} hari lalu`;
  return formatDate(date);
}

export type SeverityLevel = 'blue' | 'green' | 'yellow' | 'red';

/**
 * Pemetaan persentase kerusakan → level severity, sesuai design system
 * (≤25% biru, ≤50% hijau, ≤75% kuning, >75% merah).
 */
export function severityFromPercent(percent: number): SeverityLevel {
  if (percent <= 25) return 'blue';
  if (percent <= 50) return 'green';
  if (percent <= 75) return 'yellow';
  return 'red';
}

export const SEVERITY_COLOR: Record<SeverityLevel, string> = {
  blue: 'var(--color-severity-blue)',
  green: 'var(--color-severity-green)',
  yellow: 'var(--color-severity-yellow)',
  red: 'var(--color-severity-red)',
};
