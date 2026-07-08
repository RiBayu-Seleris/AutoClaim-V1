function mapValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function capitalize(value: string): string {
  if (!value) return '';
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function severityFromPercentage(pct: number): string {
  if (pct <= 0) return '';
  if (pct >= 75) return 'FATAL';
  if (pct >= 50) return 'MAJOR';
  if (pct >= 25) return 'MODERATE';
  return 'MINOR';
}

function numericValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') return Number(value.replace(/\D/g, '')) || 0;
  return 0;
}

export interface Activity {
  ticket: string;
  title: string;
  description: string;
  createdAt: string;
  severity: string;
  percentage: number;
  damagedParts: number;
  estimatedRepairCost: number;
}

/** Port logika ActivityModel.fromJson (derive judul/deskripsi dari hasil inferensi). */
export function parseActivity(json: Record<string, unknown>): Activity {
  const damage = mapValue(json.inference_damage_result);
  const rawSeverity = typeof damage.severity === 'string' ? damage.severity : '';
  const pct = typeof damage.percentage === 'number' ? damage.percentage : 0;
  const severity = rawSeverity || severityFromPercentage(pct);
  const totalPrice = numericValue(damage.total_price);
  const damagedParts = numericValue(damage.stages);

  const title = severity
    ? `Pemeriksaan: ${capitalize(severity)}`
    : 'Pemeriksaan Kendaraan sedang diproses';
  const description = severity
    ? `Tingkat kerusakan ${Math.round(pct)}%`
    : 'Estimasi biaya perbaikan sedang dianalisis';

  const createdAt =
    (typeof json.created_at === 'string' && json.created_at) ||
    (typeof damage.inference_time === 'string' && damage.inference_time) ||
    new Date().toISOString();

  return {
    ticket:
      (typeof json.ticket === 'string' && json.ticket) ||
      (typeof damage.ticket === 'string' && damage.ticket) ||
      '',
    title,
    description,
    createdAt,
    severity,
    percentage: pct,
    damagedParts,
    estimatedRepairCost: totalPrice,
  };
}

export interface PaymentHistory {
  id: string;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
}

export function parsePaymentHistory(json: Record<string, unknown>): PaymentHistory {
  const str = (v: unknown, f = ''): string => (typeof v === 'string' ? v : f);
  const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
  return {
    id: str(json.id ?? json.invoice_number ?? json.order_id, '-'),
    title: str(json.payment_type ?? json.title ?? json.description, 'Pembayaran'),
    amount: num(json.amount ?? json.total ?? json.gross_amount),
    status: str(json.status ?? json.transaction_status, 'UNKNOWN'),
    createdAt: str(json.created_at ?? json.transaction_time, new Date().toISOString()),
  };
}
