/** Pola plat Indonesia: 1–2 huruf wilayah, 1–4 angka, 1–3 huruf akhir. */
const PLATE_REGEX = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3}$/;

/** Normalisasi input plat: huruf besar, rapikan spasi antar-grup. */
export function normalizePlate(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const match = /^([A-Z]{1,2})\s?(\d{1,4})\s?([A-Z]{0,3})$/.exec(cleaned);
  if (!match) return cleaned;
  const [, region, number, suffix] = match;
  return [region, number, suffix].filter(Boolean).join(' ');
}

export function isValidPlate(value: string): boolean {
  return PLATE_REGEX.test(normalizePlate(value));
}
