import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'primary' | 'danger';
  /** Sembunyikan tombol batal & cegah dismiss (untuk notif yang wajib diakui). */
  hideCancel?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmState {
  request: ConfirmRequest | null;
  open: (options: ConfirmOptions) => Promise<boolean>;
  resolve: (value: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  open: (options) =>
    new Promise<boolean>((resolve) => {
      set({ request: { ...options, resolve } });
    }),
  resolve: (value) => {
    get().request?.resolve(value);
    set({ request: null });
  },
}));

/**
 * Konfirmasi imperatif (pengganti SweetAlert2 confirm).
 * `const ok = await confirm({ title, message })`.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().open(options);
}
