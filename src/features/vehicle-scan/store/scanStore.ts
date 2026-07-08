import { create } from 'zustand';
import { STORAGE_KEYS } from '@/config/constants';
import { storage } from '@/lib/storage/storage';
import { VEHICLE_SIDES, type CapturedImage, type VehicleSideState } from '../types';
import { normalizePlate } from '../utils/plate';
import type { InsuranceCoverage } from '../services/types';

export type InsuranceStatus = 'idle' | 'checking' | 'insured' | 'not_insured' | 'error';
export type ScanPurpose = 'standard' | 'emergency_insurance';

interface PlateState {
  image: CapturedImage | null;
  number: string | null;
  /** Cara plat diperoleh: hasil OCR atau diketik manual. */
  source: 'ocr' | 'manual' | null;
}

interface StoredInsuranceCoverage {
  plateNumber: string;
  coverage: InsuranceCoverage;
}

export interface VehicleScanInfo {
  brandModel: string;
  color: string;
  year: string;
}

interface ScanState {
  plate: PlateState;
  vehicleInfo: VehicleScanInfo;
  insuranceStatus: InsuranceStatus;
  insuranceCoverage: InsuranceCoverage | null;
  scanPurpose: ScanPurpose;
  sides: VehicleSideState[];
  currentSideIndex: number;

  reset: () => void;
  setScanPurpose: (purpose: ScanPurpose) => void;
  setVehicleInfo: (info: VehicleScanInfo) => void;
  setPlateImage: (image: CapturedImage | null) => void;
  setPlate: (number: string, source: 'ocr' | 'manual') => void;
  setInsurance: (status: InsuranceStatus, coverage?: InsuranceCoverage | null) => void;
  answerSide: (index: number, damaged: boolean) => void;
  setSidePhoto: (index: number, photo: CapturedImage) => void;
  clearSidePhoto: (index: number) => void;
  goToNextSide: () => void;
}

function freshSides(): VehicleSideState[] {
  return VEHICLE_SIDES.map((s) => ({ id: s.id, label: s.label, damaged: null, photo: null }));
}

function storedPlate(): PlateState {
  const number = normalizePlate(storage.getString(STORAGE_KEYS.lastScanPlateNumber) ?? '');
  const rawSource = storage.getString(STORAGE_KEYS.lastScanPlateSource);
  const source = rawSource === 'ocr' || rawSource === 'manual' ? rawSource : 'manual';
  return number ? { image: null, number, source } : { image: null, number: null, source: null };
}

function storedInsuranceForPlate(plateNumber: string | null): InsuranceCoverage | null {
  const normalizedPlate = normalizePlate(plateNumber ?? '');
  if (!normalizedPlate) return null;

  const cached = storage.getJSON<StoredInsuranceCoverage>(STORAGE_KEYS.insuranceCoverageCache);
  if (!cached?.coverage?.insured) return null;
  if (normalizePlate(cached.plateNumber) !== normalizedPlate) return null;
  return cached.coverage;
}

function rememberInsuranceCoverage(plateNumber: string | null, coverage: InsuranceCoverage | null) {
  const normalizedPlate = normalizePlate(plateNumber ?? '');
  if (!normalizedPlate || !coverage?.insured) return;
  storage.setJSON<StoredInsuranceCoverage>(STORAGE_KEYS.insuranceCoverageCache, {
    plateNumber: normalizedPlate,
    coverage,
  });
}

function forgetInsuranceCoverageForPlate(plateNumber: string | null) {
  const normalizedPlate = normalizePlate(plateNumber ?? '');
  const cached = storage.getJSON<StoredInsuranceCoverage>(STORAGE_KEYS.insuranceCoverageCache);
  if (!normalizedPlate || normalizePlate(cached?.plateNumber ?? '') !== normalizedPlate) return;
  storage.remove(STORAGE_KEYS.insuranceCoverageCache);
}

function clearStoredPlate() {
  storage.remove(STORAGE_KEYS.lastScanPlateNumber);
  storage.remove(STORAGE_KEYS.lastScanPlateSource);
}

function emptyVehicleInfo(): VehicleScanInfo {
  return { brandModel: '', color: '', year: '' };
}

function storedVehicleInfo(): VehicleScanInfo {
  const value = storage.getJSON<Partial<VehicleScanInfo>>(STORAGE_KEYS.lastScanVehicleInfo);
  if (!value || typeof value !== 'object') return emptyVehicleInfo();
  return {
    brandModel: typeof value.brandModel === 'string' ? value.brandModel : '',
    color: typeof value.color === 'string' ? value.color : '',
    year: typeof value.year === 'string' ? value.year : '',
  };
}

const initialPlate = storedPlate();
const initialInsuranceCoverage = storedInsuranceForPlate(initialPlate.number);

export const useScanStore = create<ScanState>((set) => ({
  plate: initialPlate,
  vehicleInfo: storedVehicleInfo(),
  insuranceStatus: initialInsuranceCoverage ? 'insured' : 'idle',
  insuranceCoverage: initialInsuranceCoverage,
  scanPurpose: 'standard',
  sides: freshSides(),
  currentSideIndex: 0,

  reset: () => {
    clearStoredPlate();
    set((state) => ({
      plate: { image: null, number: null, source: null },
      vehicleInfo: state.vehicleInfo,
      insuranceStatus: 'idle',
      insuranceCoverage: null,
      scanPurpose: 'standard',
      sides: freshSides(),
      currentSideIndex: 0,
    }));
  },

  setScanPurpose: (purpose) => set({ scanPurpose: purpose }),

  setVehicleInfo: (info) => {
    const normalized = {
      brandModel: info.brandModel.trim(),
      color: info.color.trim(),
      year: info.year.trim(),
    };
    storage.setJSON(STORAGE_KEYS.lastScanVehicleInfo, normalized);
    set({ vehicleInfo: normalized });
  },

  setPlateImage: (image) => {
    clearStoredPlate();
    set({
      plate: { image, number: null, source: null },
      insuranceStatus: 'idle',
      insuranceCoverage: null,
    });
  },

  setPlate: (number, source) => {
    const normalized = normalizePlate(number);
    storage.setString(STORAGE_KEYS.lastScanPlateNumber, normalized);
    storage.setString(STORAGE_KEYS.lastScanPlateSource, source);
    set((s) => ({
      plate: { ...s.plate, number: normalized, source },
      ...(s.plate.number !== normalized
        ? (() => {
            const cachedCoverage = storedInsuranceForPlate(normalized);
            return cachedCoverage
              ? { insuranceStatus: 'insured' as const, insuranceCoverage: cachedCoverage }
              : { insuranceStatus: 'idle' as const, insuranceCoverage: null };
          })()
        : {}),
    }));
  },

  setInsurance: (status, coverage) =>
    set((state) => {
      if (status === 'insured' && coverage?.insured) {
        rememberInsuranceCoverage(state.plate.number, coverage);
      } else if (status === 'not_insured') {
        forgetInsuranceCoverageForPlate(state.plate.number);
      }
      return { insuranceStatus: status, insuranceCoverage: coverage ?? null };
    }),

  answerSide: (index, damaged) =>
    set((s) => {
      const sides = s.sides.slice();
      const current = sides[index];
      if (!current) return {};
      sides[index] = { ...current, damaged, photo: damaged ? current.photo : null };
      return { sides };
    }),

  setSidePhoto: (index, photo) =>
    set((s) => {
      const sides = s.sides.slice();
      const current = sides[index];
      if (!current) return {};
      sides[index] = { ...current, photo };
      return { sides };
    }),

  clearSidePhoto: (index) =>
    set((s) => {
      const sides = s.sides.slice();
      const current = sides[index];
      if (!current) return {};
      sides[index] = { ...current, photo: null };
      return { sides };
    }),

  goToNextSide: () =>
    set((s) => ({ currentSideIndex: Math.min(s.currentSideIndex + 1, s.sides.length - 1) })),
}));
