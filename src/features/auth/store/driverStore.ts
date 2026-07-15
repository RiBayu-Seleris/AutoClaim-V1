import { create } from 'zustand';
import { STORAGE_KEYS } from '@/config/constants';
import { storage } from '@/lib/storage/storage';
import { setDriverSessionExpiredHandler } from '@/lib/api/client';
import { probeAdminLogin } from '../api/authApi';

const DRIVER_ROLE = 'towing_driver';

interface DriverInfo {
  name: string;
}

interface DriverState {
  token: string | null;
  name: string;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;

  hydrate: () => void;
  loginAsDriver: (email: string, password: string) => Promise<boolean>;
  setSession: (token: string, name: string) => void;
  logout: () => void;
  clearError: () => void;
}

function persist(token: string, name: string): void {
  storage.setString(STORAGE_KEYS.driverToken, token);
  storage.setJSON<DriverInfo>(STORAGE_KEYS.driverInfo, { name });
}

export const useDriverStore = create<DriverState>((set) => ({
  token: null,
  name: '',
  isLoading: false,
  error: null,
  isLoggedIn: false,

  hydrate: () => {
    const token = storage.getString(STORAGE_KEYS.driverToken);
    const info = storage.getJSON<DriverInfo>(STORAGE_KEYS.driverInfo);
    if (token) set({ token, name: info?.name ?? '', isLoggedIn: true });
  },

  loginAsDriver: async (email, password) => {
    set({ isLoading: true, error: null });
    const { outcome, errorMessage } = await probeAdminLogin(email, password);
    if (!outcome) {
      set({ isLoading: false, error: errorMessage });
      return false;
    }
    if (outcome.role !== DRIVER_ROLE) {
      set({
        isLoading: false,
        error: 'Akun ini bukan akun sopir towing.',
      });
      return false;
    }
    persist(outcome.token, outcome.name);
    set({ token: outcome.token, name: outcome.name, isLoggedIn: true, isLoading: false });
    return true;
  },

  setSession: (token, name) => {
    persist(token, name);
    set({ token, name, isLoggedIn: true, isLoading: false, error: null });
  },

  logout: () => {
    storage.remove(STORAGE_KEYS.driverToken);
    storage.remove(STORAGE_KEYS.driverInfo);
    set({ token: null, name: '', isLoggedIn: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

setDriverSessionExpiredHandler(() => {
  useDriverStore.getState().logout();
});
