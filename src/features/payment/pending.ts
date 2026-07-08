import { STORAGE_KEYS } from '@/config/constants';
import { storage } from '@/lib/storage/storage';
import type { PaymentContext } from './types';

/**
 * Sesi pembayaran tertunda. Disimpan saat invoice dibuat agar pembayaran bisa
 * dilanjutkan bila halaman ditutup/di-refresh, lalu dibersihkan saat selesai.
 */
export function savePendingPayment(ctx: PaymentContext): void {
  storage.setJSON(STORAGE_KEYS.pendingPayment, ctx);
}

export function loadPendingPayment(): PaymentContext | null {
  return storage.getJSON<PaymentContext>(STORAGE_KEYS.pendingPayment);
}

export function clearPendingPayment(): void {
  storage.remove(STORAGE_KEYS.pendingPayment);
}
