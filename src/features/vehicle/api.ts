import { userApi } from '@/lib/api/client';
import {
  parseSavedVehicle,
  toCreatePayload,
  toUpdatePayload,
  type SavedVehicle,
  type VehicleFormInput,
} from './types';

export async function getVehicles(): Promise<SavedVehicle[]> {
  const res = await userApi.get<{ data?: { vehicles?: unknown[] } }>('/v1/vehicle/');
  const list = res.data?.data?.vehicles ?? [];
  return list
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map(parseSavedVehicle);
}

export async function createVehicle(input: VehicleFormInput): Promise<SavedVehicle> {
  const res = await userApi.post<{ data?: Record<string, unknown> }>(
    '/v1/vehicle/',
    toCreatePayload(input),
  );
  return res.data?.data
    ? parseSavedVehicle(res.data.data)
    : parseSavedVehicle(toCreatePayload(input));
}

export async function updateVehicle(input: VehicleFormInput): Promise<SavedVehicle> {
  const res = await userApi.put<{ data?: Record<string, unknown> }>(
    `/v1/vehicle/?plate=${encodeURIComponent(input.vehiclePlate)}`,
    toUpdatePayload(input),
  );
  return res.data?.data
    ? parseSavedVehicle(res.data.data)
    : parseSavedVehicle(toCreatePayload(input));
}

export async function deleteVehicle(plate: string): Promise<void> {
  await userApi.delete(`/v1/vehicle/?plate=${encodeURIComponent(plate)}`);
}
