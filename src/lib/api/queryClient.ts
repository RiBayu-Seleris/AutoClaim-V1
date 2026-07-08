import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Konfigurasi global TanStack Query. Tidak retry pada error klien (4xx) karena
 * percuma dan bisa menutupi bug; retry sekali untuk error jaringan/server.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof AxiosError) {
          const status = error.response?.status ?? 0;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
