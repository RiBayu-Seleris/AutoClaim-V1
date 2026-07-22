import { create } from 'zustand';
import { STORAGE_KEYS } from '@/config/constants';
import { storage } from '@/lib/storage/storage';
import { setUserSessionExpiredHandler, extractErrorMessage } from '@/lib/api/client';
import { toast } from '@/components/feedback/toast';
import { loginUser, registerUser } from '../api/authApi';
import type { RegisterUserPayload, User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  hydrate: () => void;
  loginUser: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterUserPayload) => Promise<boolean>;
  setSession: (args: { token: string; refreshToken?: string; user: User }) => void;
  setUser: (user: User) => void;
  logout: () => void;
  clearError: () => void;
}

function persistSession(token: string, refreshToken: string | undefined, user: User): void {
  storage.setString(STORAGE_KEYS.userToken, token);
  if (refreshToken) storage.setString(STORAGE_KEYS.userRefreshToken, refreshToken);
  storage.setJSON(STORAGE_KEYS.userInfo, user);
}

function clearSession(): void {
  storage.remove(STORAGE_KEYS.userToken);
  storage.remove(STORAGE_KEYS.userRefreshToken);
  storage.remove(STORAGE_KEYS.userInfo);
  storage.remove(STORAGE_KEYS.guestInferenceTicket);
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  hydrate: () => {
    const token = storage.getString(STORAGE_KEYS.userToken);
    const user = storage.getJSON<User>(STORAGE_KEYS.userInfo);
    if (token) {
      set({ token, user, isAuthenticated: true });
    }
  },

  loginUser: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await loginUser(email, password);
      persistSession(result.token, result.refreshToken, result.user);
      set({
        token: result.token,
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Email atau kata sandi salah.') });
      return false;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await registerUser(payload);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Registrasi gagal. Coba lagi.') });
      return false;
    }
  },

  setSession: ({ token, refreshToken, user }) => {
    persistSession(token, refreshToken, user);
    set({ token, user, isAuthenticated: true, isLoading: false, error: null });
  },

  setUser: (user) => {
    storage.setJSON(STORAGE_KEYS.userInfo, user);
    set({ user });
  },

  logout: () => {
    clearSession();
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

// Saat sesi user kadaluarsa (401 + refresh gagal), bersihkan sesi otomatis.
// Guard rute akan mengalihkan ke /login pada render berikutnya.
setUserSessionExpiredHandler((message) => {
  const { isAuthenticated, logout } = useAuthStore.getState();
  if (!isAuthenticated) return;
  logout();
  toast.error(message);
});
