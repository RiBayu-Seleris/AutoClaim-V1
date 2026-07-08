import { userApi } from '@/lib/api/client';
import {
  parseTowingOrder,
  parseTowingTracking,
  type TowingOrder,
  type TowingTracking,
} from '../types';

export interface CreateTowingPayload {
  inferenceTicket?: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffType: string;
  dropoffAddress?: string;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  targetWorkshopId?: number;
  notes?: string;
}

export async function createTowingOrder(payload: CreateTowingPayload): Promise<TowingOrder> {
  const res = await userApi.post<{ data?: Record<string, unknown> }>('/v1/member/towing-orders', {
    inference_ticket: payload.inferenceTicket ?? '',
    pickup_address: payload.pickupAddress,
    pickup_latitude: payload.pickupLatitude,
    pickup_longitude: payload.pickupLongitude,
    dropoff_type: payload.dropoffType,
    dropoff_address: payload.dropoffAddress ?? '',
    dropoff_latitude: payload.dropoffLatitude ?? 0,
    dropoff_longitude: payload.dropoffLongitude ?? 0,
    target_workshop_id: payload.targetWorkshopId ?? 0,
    notes: payload.notes ?? '',
  });
  return parseTowingOrder(res.data?.data ?? {});
}

export async function getTowingOrders(): Promise<TowingOrder[]> {
  const res = await userApi.get<{ data?: { orders?: unknown[] } | unknown[] }>(
    '/v1/member/towing-orders',
  );
  const data = res.data?.data;
  const list = Array.isArray(data) ? data : (data?.orders ?? []);
  return list
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map(parseTowingOrder);
}

export async function getTowingOrder(code: string): Promise<TowingOrder> {
  const res = await userApi.get<{ data?: Record<string, unknown> }>(
    `/v1/member/towing-orders/${encodeURIComponent(code)}`,
  );
  return parseTowingOrder(res.data?.data ?? {});
}

export async function getTowingTracking(code: string): Promise<TowingTracking> {
  const res = await userApi.get<{ data?: Record<string, unknown> }>(
    `/v1/member/towing-orders/${encodeURIComponent(code)}/tracking`,
  );
  return parseTowingTracking(res.data?.data ?? {});
}

export async function cancelTowingOrder(code: string): Promise<{ status: string; fee: number }> {
  const res = await userApi.post<{ data?: { status?: string; cancellation_fee?: number } }>(
    `/v1/member/towing-orders/${encodeURIComponent(code)}/cancel`,
  );
  const data = res.data?.data;
  return { status: data?.status ?? 'CANCELED', fee: data?.cancellation_fee ?? 0 };
}
