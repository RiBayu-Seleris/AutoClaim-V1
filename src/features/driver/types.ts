function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}
function time(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export interface DriverTask {
  orderCode: string;
  status: string;
  inferenceTicket: string;
  userFullname: string;
  userPhone: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffType: string;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  workshopName: string;
  towingName: string;
  fleetPlateNumber: string;
  fleetType: string;
  quotedPrice: number;
  userPayable: number;
  notes: string;
  requestedAt: string | null;
  assignedAt: string | null;
  completedAt: string | null;
}

export function parseDriverTask(json: Record<string, unknown>): DriverTask {
  return {
    orderCode: str(json.order_code),
    status: str(json.status),
    inferenceTicket: str(json.inference_ticket),
    userFullname: str(json.user_fullname),
    userPhone: str(json.user_phone),
    pickupAddress: str(json.pickup_address),
    pickupLatitude: num(json.pickup_latitude),
    pickupLongitude: num(json.pickup_longitude),
    dropoffType: str(json.dropoff_type, 'WORKSHOP'),
    dropoffAddress: str(json.dropoff_address),
    dropoffLatitude: num(json.dropoff_latitude),
    dropoffLongitude: num(json.dropoff_longitude),
    workshopName: str(json.workshop_name),
    towingName: str(json.towing_name),
    fleetPlateNumber: str(json.fleet_plate_number),
    fleetType: str(json.fleet_type),
    quotedPrice: num(json.quoted_price),
    userPayable: num(json.user_payable),
    notes: str(json.notes),
    requestedAt: time(json.requested_at),
    assignedAt: time(json.assigned_at),
    completedAt: time(json.completed_at),
  };
}

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Ditugaskan',
  EN_ROUTE_TO_PICKUP: 'Menuju lokasi penjemputan',
  ARRIVED_PICKUP: 'Tiba di lokasi',
  PICKED_UP: 'Kendaraan diangkat',
  EN_ROUTE_TO_DROPOFF: 'Menuju tujuan',
  DROPPED_OFF: 'Tiba di tujuan',
  COMPLETED: 'Selesai',
  CANCELED: 'Dibatalkan',
  REJECTED: 'Ditolak',
};

const NEXT_STATUS: Record<string, string> = {
  ASSIGNED: 'EN_ROUTE_TO_PICKUP',
  EN_ROUTE_TO_PICKUP: 'ARRIVED_PICKUP',
  ARRIVED_PICKUP: 'PICKED_UP',
  PICKED_UP: 'EN_ROUTE_TO_DROPOFF',
  EN_ROUTE_TO_DROPOFF: 'DROPPED_OFF',
};

const NEXT_ACTION_LABEL: Record<string, string> = {
  ASSIGNED: 'Terima order',
  EN_ROUTE_TO_PICKUP: 'Tiba di lokasi penjemputan',
  ARRIVED_PICKUP: 'Kendaraan sudah diangkat',
  PICKED_UP: 'Berangkat ke tujuan',
  EN_ROUTE_TO_DROPOFF: 'Tiba di tujuan',
};

export const driverStatusLabel = (status: string): string => STATUS_LABEL[status] ?? status;
export const driverNextStatus = (status: string): string | null => NEXT_STATUS[status] ?? null;
export const driverNextActionLabel = (status: string): string => NEXT_ACTION_LABEL[status] ?? '';

export const isDriverTaskActive = (status: string): boolean => status in NEXT_STATUS;

export const isDriverTaskFinished = (status: string): boolean =>
  status === 'DROPPED_OFF' || status === 'COMPLETED';

export const isDriverTaskCanceled = (status: string): boolean =>
  status === 'CANCELED' || status === 'REJECTED';

export const driverDestinationLabel = (task: DriverTask): string =>
  task.workshopName || task.dropoffAddress || 'Tujuan';

export const driverTaskRevenue = (task: DriverTask): number =>
  task.quotedPrice > 0 ? task.quotedPrice : task.userPayable;

export function driverTaskPlate(task: DriverTask): string {
  const match = task.notes.match(/plat\s*:\s*([A-Z0-9 .-]+)/i);
  return match?.[1]?.trim() || '-';
}

export function driverTaskProblem(task: DriverTask): string {
  const lines = task.notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^plat\s*:/i.test(line));
  return lines[0] || 'Permintaan towing';
}
