import { create } from 'zustand';
import { STORAGE_KEYS } from '@/config/constants';
import { storage } from '@/lib/storage/storage';

interface AppState {
  onboardingSeen: boolean;
  hydrate: () => void;
  markOnboardingSeen: () => void;
}

/** Flag level aplikasi (mis. onboarding) yang perlu reaktif untuk guard rute. */
export const useAppStore = create<AppState>((set) => ({
  onboardingSeen: false,
  hydrate: () => set({ onboardingSeen: storage.getBool(STORAGE_KEYS.onboardingSeen) }),
  markOnboardingSeen: () => {
    storage.setBool(STORAGE_KEYS.onboardingSeen, true);
    set({ onboardingSeen: true });
  },
}));
