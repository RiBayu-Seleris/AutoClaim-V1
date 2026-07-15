import axios from 'axios';
import { env } from '@/config/env';

/**
 * Unggah satu file ke storage publik Seleris (tanpa autentikasi) dan kembalikan
 * URL hasilnya (`data.path`). Dipakai lintas fitur (analisis kerusakan user &
 * foto kelayakan armada oleh sopir) karena tidak butuh token AutoClaim.
 */
export async function uploadFilePublic(blob: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append('file', blob, filename);
  const res = await axios.post<{ data?: { path?: string } }>(env.selerisUploadUrl, form);
  const path = res.data?.data?.path;
  if (typeof path !== 'string' || !path) {
    throw new Error('Gagal mengunggah foto: respons tidak berisi path.');
  }
  return path;
}
