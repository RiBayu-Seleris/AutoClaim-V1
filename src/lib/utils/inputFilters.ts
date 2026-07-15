import type { FormEvent } from 'react';

type InputEvent = FormEvent<HTMLInputElement>;

/**
 * Handler onChange untuk input tak-terkontrol (pakai `name`/FormData): membuang
 * karakter yang tak sesuai saat user mengetik. Untuk input terkontrol (useState),
 * saring langsung di dalam setState.
 */

/** Angka murni (NIK, NIB, tahun, nomor SIM). */
export function keepDigits(event: InputEvent): void {
  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '');
}

/** Angka & tanda '+' (nomor telepon/HP). */
export function keepPhone(event: InputEvent): void {
  event.currentTarget.value = event.currentTarget.value.replace(/[^0-9+]/g, '');
}

/** Huruf besar + alfanumerik saja (VIN/nomor rangka, nomor mesin). */
export function keepUpperAlnum(event: InputEvent): void {
  event.currentTarget.value = event.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
