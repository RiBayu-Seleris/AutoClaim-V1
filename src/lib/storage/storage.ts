/**
 * Pembungkus localStorage yang aman: menangani lingkungan tanpa `window`,
 * quota penuh, dan JSON rusak tanpa melempar error ke pemanggil.
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export const storage = {
  getString(key: string): string | null {
    if (!isBrowser()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setString(key: string, value: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage penuh / mode privat — abaikan agar tidak crash */
    }
  },

  getJSON<T>(key: string): T | null {
    const raw = this.getString(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJSON<T>(key: string, value: T): void {
    try {
      this.setString(key, JSON.stringify(value));
    } catch {
      /* nilai tidak bisa di-serialize — abaikan */
    }
  },

  remove(key: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* abaikan */
    }
  },

  getBool(key: string): boolean {
    return this.getString(key) === 'true';
  },

  setBool(key: string, value: boolean): void {
    this.setString(key, value ? 'true' : 'false');
  },
};
