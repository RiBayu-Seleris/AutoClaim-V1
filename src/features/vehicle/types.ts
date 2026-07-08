export interface SavedVehicle {
  vehiclePlate: string;
  vehicleType: string;
  vehicleName: string;
  vehicleRole: string;
  polisNumber: string;
  polisEnd: string;
  plateImage: string;
  createdAt: string;
  updatedAt: string;
}

const s = (v: unknown, f = ''): string => (typeof v === 'string' ? v : f);

export function parseSavedVehicle(json: Record<string, unknown>): SavedVehicle {
  return {
    vehiclePlate: s(json.vehicle_plate),
    vehicleType: s(json.vehicle_type),
    vehicleName: s(json.vehicle_name),
    vehicleRole: s(json.vehicle_role),
    polisNumber: s(json.polis_number),
    polisEnd: s(json.polis_end),
    plateImage: s(json.plate_image),
    createdAt: s(json.created_at),
    updatedAt: s(json.updated_at),
  };
}

/** Kendaraan berpolis tidak boleh diedit/dihapus (aturan backend). */
export function hasPolis(v: SavedVehicle): boolean {
  return v.polisNumber.length > 0 && v.polisNumber !== '-';
}

export interface VehicleFormInput {
  vehiclePlate: string;
  vehicleName: string;
  vehicleType: string;
  vehicleRole: string;
  polisNumber?: string;
  polisEnd?: string;
  plateImage?: string;
}

export function toCreatePayload(input: VehicleFormInput): Record<string, unknown> {
  return {
    vehicle_plate: input.vehiclePlate,
    vehicle_type: input.vehicleType,
    vehicle_name: input.vehicleName,
    vehicle_role: input.vehicleRole || 'private',
    polis_number: input.polisNumber || '-',
    polis_end: input.polisEnd || '-',
    plate_image: input.plateImage ?? '',
  };
}

export function toUpdatePayload(input: VehicleFormInput): Record<string, unknown> {
  return {
    vehicle_type: input.vehicleType,
    vehicle_name: input.vehicleName,
    plate_image: input.plateImage ?? '',
  };
}

export const VEHICLE_TYPES = ['Mobil', 'Motor', 'SUV', 'Pikap', 'Truk'] as const;
