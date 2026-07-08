/** Hasil tangkapan kamera (mirip output CameraPicture.vue). */
export interface CapturedImage {
  blob: Blob;
  /** Object URL untuk preview. Ingat revoke saat tidak dipakai. */
  url: string;
  dataUrl: string;
  width: number;
  height: number;
  facingMode: string;
}

export type VehicleSideId = 'front' | 'right' | 'left' | 'rear';

export interface VehicleSideState {
  id: VehicleSideId;
  label: string;
  /** null = belum dijawab, true = rusak (perlu foto), false = tidak rusak. */
  damaged: boolean | null;
  photo: CapturedImage | null;
}

export const VEHICLE_SIDES: ReadonlyArray<{ id: VehicleSideId; label: string }> = [
  { id: 'front', label: 'Bagian Depan Mobil' },
  { id: 'right', label: 'Bagian Samping Kanan Mobil' },
  { id: 'left', label: 'Bagian Samping Kiri Mobil' },
  { id: 'rear', label: 'Bagian Belakang Mobil' },
];
