import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { STORAGE_KEYS } from '@/config/constants';
import {
  NGROK_SKIP_BROWSER_WARNING_HEADER,
  NGROK_SKIP_BROWSER_WARNING_VALUE,
} from '@/lib/api/headers';
import { storage } from '@/lib/storage/storage';

interface TokenLike {
  access_token?: string;
  refresh_token?: string;
}

/** Konfigurasi pembuatan satu klien API dengan sesi (token) sendiri. */
interface ApiClientConfig {
  tokenKey: string;
  /** Kunci refresh token. Bila tidak diisi, klien tidak mencoba refresh. */
  refreshTokenKey?: string;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

interface ApiClient {
  instance: AxiosInstance;
  /** Daftarkan handler yang dipanggil saat sesi benar-benar berakhir. */
  setSessionExpiredHandler: (handler: () => void) => void;
}

function createApiClient(config: ApiClientConfig): ApiClient {
  const baseHeaders = {
    'X-Channel': env.apiChannel,
    'Content-Type': 'application/json',
    [NGROK_SKIP_BROWSER_WARNING_HEADER]: NGROK_SKIP_BROWSER_WARNING_VALUE,
  };

  const instance = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: 60_000,
    headers: { ...baseHeaders },
  });

  // Instance polos khusus /auth/refresh — tanpa interceptor agar 401 dari
  // endpoint refresh tidak memicu logika refresh lagi (cegah rekursi).
  const refreshInstance = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: 30_000,
    headers: { ...baseHeaders },
  });

  let onSessionExpired: (() => void) | null = null;

  // Single-flight: beberapa 401 berbarengan hanya memicu satu refresh.
  let refreshPromise: Promise<string | null> | null = null;

  async function performRefresh(): Promise<string | null> {
    if (!config.refreshTokenKey) return null;
    const refreshToken = storage.getString(config.refreshTokenKey);
    if (!refreshToken) return null;
    try {
      const res = await refreshInstance.post<{ data?: { token?: TokenLike } }>('/v1/auth/refresh', {
        refresh_token: refreshToken,
      });
      const token = res.data?.data?.token;
      const newAccess = token?.access_token ?? '';
      const newRefresh = token?.refresh_token ?? '';
      if (newAccess) {
        storage.setString(config.tokenKey, newAccess);
        if (newRefresh) storage.setString(config.refreshTokenKey, newRefresh);
        return newAccess;
      }
    } catch {
      /* refresh token kadaluarsa → null → sesi berakhir */
    }
    return null;
  }

  function refreshAccessToken(): Promise<string | null> {
    refreshPromise ??= performRefresh().finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  }

  instance.interceptors.request.use((request: InternalAxiosRequestConfig) => {
    const token = storage.getString(config.tokenKey);
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    // Biarkan browser menetapkan boundary multipart untuk FormData.
    if (typeof FormData !== 'undefined' && request.data instanceof FormData) {
      request.headers.delete('Content-Type');
    } else {
      // Gateway mewajibkan header Content-Type pada POST/PUT/PATCH. Axios
      // menghapus header itu bila request tidak punya body, sehingga endpoint
      // "aksi tanpa body" (mis. /cancel) ditolak 400 "missing Content-Type
      // header". Kirim objek kosong agar Content-Type: application/json tetap ada.
      const method = (request.method ?? 'get').toLowerCase();
      const isWrite = method === 'post' || method === 'put' || method === 'patch';
      if (isWrite && (request.data === undefined || request.data === null)) {
        request.data = {};
        request.headers.set('Content-Type', 'application/json');
      }
    }
    return request;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      const sentWithToken = Boolean(original?.headers?.Authorization);

      if (error.response?.status === 401 && original && sentWithToken && !original._retried) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          original._retried = true;
          original.headers.set('Authorization', `Bearer ${newToken}`);
          return instance.request(original);
        }
        // Refresh gagal / tidak tersedia → sesi benar-benar berakhir.
        onSessionExpired?.();
      }
      return Promise.reject(error);
    },
  );

  return {
    instance,
    setSessionExpiredHandler: (handler) => {
      onSessionExpired = handler;
    },
  };
}

const userClient = createApiClient({
  tokenKey: STORAGE_KEYS.userToken,
  refreshTokenKey: STORAGE_KEYS.userRefreshToken,
});

const driverClient = createApiClient({
  tokenKey: STORAGE_KEYS.driverToken,
});

const mitraClient = createApiClient({
  tokenKey: STORAGE_KEYS.mitraToken,
});

/** Klien sesi user (dengan auto-refresh). */
export const userApi = userClient.instance;
export const setUserSessionExpiredHandler = userClient.setSessionExpiredHandler;

/** Klien sesi driver towing (token admin role towing_driver, tanpa refresh). */
export const driverApi = driverClient.instance;
export const setDriverSessionExpiredHandler = driverClient.setSessionExpiredHandler;

/** Klien sesi admin mitra bengkel/towing (token admin, tanpa refresh). */
export const mitraApi = mitraClient.instance;
export const setMitraSessionExpiredHandler = mitraClient.setSessionExpiredHandler;

/**
 * Ekstrak pesan error ramah dari berbagai bentuk kegagalan request.
 * Memprioritaskan `stat_msg` dari gateway.
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan. Coba lagi.',
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { stat_msg?: string; message?: string } | undefined;
    if (data?.stat_msg) return data.stat_msg;
    if (data?.message) return data.message;
    if (error.code === 'ECONNABORTED') return 'Koneksi timeout. Periksa jaringan Anda.';
    if (error.message === 'Network Error') return 'Tidak dapat terhubung ke server.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
