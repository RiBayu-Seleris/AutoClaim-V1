function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export interface TowingOrder {
  orderCode: string;
  status: string;
  towingType: string;
  inferenceTicket: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffType: string;
  dropoffAddress: string;
  workshopName: string;
  driverName: string;
  driverPhone: string;
  /** Profil sopir (opsional dari backend; 0 = tidak tersedia). */
  driverRating: number;
  driverTotalTrips: number;
  driverJoinedYears: number;
  driverVerified: boolean;
  fleetPlateNumber: string;
  fleetType: string;
  quotedPrice: number;
  insuranceCoverage: number;
  userPayable: number;
  notes: string;
  requestedAt?: string;
  assignedAt?: string;
  completedAt?: string;
}

export function parseTowingOrder(json: Record<string, unknown>): TowingOrder {
  return {
    orderCode: str(json.order_code),
    status: str(json.status, 'REQUESTED'),
    towingType: str(json.towing_type, 'TOWING_ONLY'),
    inferenceTicket: str(json.inference_ticket),
    pickupAddress: str(json.pickup_address),
    pickupLatitude: num(json.pickup_latitude),
    pickupLongitude: num(json.pickup_longitude),
    dropoffType: str(json.dropoff_type, 'WORKSHOP'),
    dropoffAddress: str(json.dropoff_address),
    workshopName: str(json.workshop_name),
    driverName: str(json.driver_name),
    driverPhone: str(json.driver_phone),
    driverRating: num(json.driver_rating),
    driverTotalTrips: num(json.driver_total_trips),
    driverJoinedYears: num(json.driver_joined_years),
    driverVerified: json.driver_verified === true,
    fleetPlateNumber: str(json.fleet_plate_number),
    fleetType: str(json.fleet_type),
    quotedPrice: num(json.quoted_price),
    insuranceCoverage: num(json.insurance_coverage),
    userPayable: num(json.user_payable),
    notes: str(json.notes),
    requestedAt: str(json.requested_at) || undefined,
    assignedAt: str(json.assigned_at) || undefined,
    completedAt: str(json.completed_at) || undefined,
  };
}

export interface TowingTracking {
  status: string;
  hasLocation: boolean;
  driverLatitude: number;
  driverLongitude: number;
  lastSeenAt?: string;
  target: string;
  distanceKm: number;
}

export function parseTowingTracking(json: Record<string, unknown>): TowingTracking {
  return {
    status: str(json.status),
    hasLocation: json.has_location === true,
    driverLatitude: num(json.driver_latitude),
    driverLongitude: num(json.driver_longitude),
    lastSeenAt: str(json.last_seen_at) || undefined,
    target: str(json.target),
    distanceKm: num(json.distance_km),
  };
}

export const TOWING_STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Mencari derek',
  PENDING_ASSIGNMENT: 'Mencari derek',
  OFFERED: 'Menunggu konfirmasi mitra',
  ASSIGNED: 'Sopir ditetapkan',
  EN_ROUTE_TO_PICKUP: 'Sopir menuju lokasi Anda',
  ARRIVED_PICKUP: 'Sopir tiba di lokasi',
  PICKED_UP: 'Kendaraan diangkat',
  EN_ROUTE_TO_DROPOFF: 'Menuju tujuan',
  DROPPED_OFF: 'Tiba di tujuan',
  COMPLETED: 'Selesai',
  CANCELED: 'Dibatalkan',
};

export function towingStatusLabel(status: string): string {
  return TOWING_STATUS_LABEL[status] ?? status;
}

const SEARCHING = new Set(['REQUESTED', 'PENDING_ASSIGNMENT', 'OFFERED']);
const ACTIVE = new Set([
  'ASSIGNED',
  'EN_ROUTE_TO_PICKUP',
  'ARRIVED_PICKUP',
  'PICKED_UP',
  'EN_ROUTE_TO_DROPOFF',
  'DROPPED_OFF',
]);

export const isTowingSearching = (status: string): boolean => SEARCHING.has(status);
export const isTowingActive = (status: string): boolean => ACTIVE.has(status);
// Hanya boleh batal selama masih mencari sopir (belum diterima mitra).
// Begitu mitra menerima/menugaskan (ASSIGNED dst), order tidak bisa dibatalkan.
export const isTowingCancelable = (status: string): boolean => SEARCHING.has(status);
