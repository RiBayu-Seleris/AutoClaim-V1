import { driverApi } from '@/lib/api/client';
import { env } from '@/config/env';
import { STORAGE_KEYS } from '@/config/constants';
import {
  NGROK_SKIP_BROWSER_WARNING_HEADER,
  NGROK_SKIP_BROWSER_WARNING_VALUE,
} from '@/lib/api/headers';
import { storage } from '@/lib/storage/storage';
import { parseSettlementFlag, type SettlementFlag } from '@/features/towing/types';
import { parseDriverTask, type DriverTask } from '../types';

export async function getDriverTasks(): Promise<DriverTask[]> {
  const res = await driverApi.get<{ data?: { orders?: unknown[] } | unknown[] }>(
    '/v1/admin/driver/towing-orders',
  );
  const data = res.data?.data;
  const list = Array.isArray(data) ? data : (data?.orders ?? []);
  return list
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map(parseDriverTask);
}

export async function updateDriverTaskStatus(code: string, status: string): Promise<string> {
  const res = await driverApi.post<{ data?: { status?: string } }>(
    `/v1/admin/driver/towing-orders/${encodeURIComponent(code)}/status`,
    { status },
  );
  return res.data?.data?.status ?? status;
}

export async function rejectDriverOrder(code: string, note: string): Promise<void> {
  await driverApi.post(`/v1/admin/driver/towing-orders/${encodeURIComponent(code)}/reject`, {
    note,
  });
}

export interface FleetInspectionPayload {
  verdict: 'FIT' | 'UNFIT';
  notes: string;
  photoFront: string;
  photoRear: string;
  photoLeft: string;
  photoRight: string;
}

export async function submitFleetInspection(
  code: string,
  payload: FleetInspectionPayload,
): Promise<void> {
  await driverApi.post(`/v1/admin/driver/towing-orders/${encodeURIComponent(code)}/inspection`, {
    verdict: payload.verdict,
    notes: payload.notes,
    photo_front: payload.photoFront,
    photo_rear: payload.photoRear,
    photo_left: payload.photoLeft,
    photo_right: payload.photoRight,
  });
}

export async function updateDriverLocation(latitude: number, longitude: number): Promise<void> {
  await driverApi.post('/v1/admin/driver/location', { latitude, longitude });
}

export async function scanDriverSettlementCode(code: string): Promise<SettlementFlag> {
  const res = await driverApi.post<{ data?: Record<string, unknown> }>(
    '/v1/admin/driver/claim-settlement/scan',
    { code },
  );
  return parseSettlementFlag(res.data?.data ?? {});
}

export async function settleDriverSettlementCode(code: string): Promise<SettlementFlag> {
  const res = await driverApi.post<{ data?: Record<string, unknown> }>(
    '/v1/admin/driver/claim-settlement/settle',
    { code },
  );
  return parseSettlementFlag(res.data?.data ?? {});
}

function handleDriverOrderStreamChunk(buffer: string, onChange: () => void): string {
  const blocks = buffer.split('\n\n');
  const rest = blocks.pop() ?? '';
  for (const block of blocks) {
    let event = 'message';
    let hasData = false;
    for (const line of block.split('\n')) {
      if (line.startsWith(':')) continue;
      if (line.startsWith('event:')) event = line.slice(6).trim();
      if (line.startsWith('data:')) hasData = true;
    }
    if (event === 'orders' && hasData) onChange();
  }
  return rest;
}

export function subscribeDriverTowingOrderChanges(args: {
  onChange: () => void;
  onError?: () => void;
}): () => void {
  let stopped = false;
  let reconnectTimer: number | undefined;
  let controller: AbortController | null = null;

  const connect = () => {
    if (stopped) return;
    const token = storage.getString(STORAGE_KEYS.driverToken);
    if (!token) return;

    controller = new AbortController();
    void fetch(`${env.apiBaseUrl}/v1/admin/driver/towing-orders/stream`, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
        'X-Channel': env.apiChannel,
        [NGROK_SKIP_BROWSER_WARNING_HEADER]: NGROK_SKIP_BROWSER_WARNING_VALUE,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok || !response.body) throw new Error('stream unavailable');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = handleDriverOrderStreamChunk(buffer, args.onChange);
        }
      })
      .catch(() => {
        if (!stopped) args.onError?.();
      })
      .finally(() => {
        if (!stopped) reconnectTimer = window.setTimeout(connect, 3000);
      });
  };

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
    controller?.abort();
  };
}
