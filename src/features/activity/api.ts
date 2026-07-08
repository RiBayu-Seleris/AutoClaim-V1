import { userApi } from '@/lib/api/client';
import { parseActivity, parsePaymentHistory, type Activity, type PaymentHistory } from './types';

function extractList(data: unknown, key: string): Record<string, unknown>[] {
  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const inner = root.data;
  const list = Array.isArray(inner)
    ? inner
    : inner && typeof inner === 'object'
      ? (inner as Record<string, unknown>)[key]
      : undefined;
  if (!Array.isArray(list)) return [];
  return list.filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null);
}

export async function getActivities(date?: string): Promise<Activity[]> {
  const res = await userApi.get('/v1/inference/damages', {
    params: date ? { date } : undefined,
  });
  return extractList(res.data, 'inference_results').map(parseActivity);
}

export async function getPaymentHistory(date?: string): Promise<PaymentHistory[]> {
  const res = await userApi.get('/v1/payment/history', {
    params: date ? { date } : undefined,
  });
  return extractList(res.data, 'payment_histories').map(parsePaymentHistory);
}
