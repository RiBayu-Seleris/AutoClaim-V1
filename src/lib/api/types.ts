/**
 * Bentuk amplop respons gateway AutoClaim. Payload sebenarnya ada di `data`,
 * pesan error pada `stat_msg`.
 */
export interface ApiEnvelope<T> {
  data: T;
  stat_code?: string;
  stat_msg?: string;
  message?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token?: string;
}
