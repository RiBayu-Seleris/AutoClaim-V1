/**
 * Pembungkus tipis Nominatim (OpenStreetMap) untuk pencarian alamat & reverse
 * geocoding. Gratis tanpa API key. Catatan kebijakan pemakaian: batasi ~1
 * permintaan/detik — pemanggil sudah men-debounce input. Header User-Agent
 * tidak bisa diset dari browser; Referer otomatis dikirim browser.
 */
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  province: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
}

interface NominatimPlace {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

function toResult(place: NominatimPlace): GeocodeResult {
  const address = place.address ?? {};
  return {
    lat: Number(place.lat),
    lng: Number(place.lon),
    displayName: place.display_name,
    city: address.city ?? address.town ?? address.village ?? address.county ?? '',
    province: address.state ?? '',
  };
}

/** Cari alamat/POI di Indonesia. Mengembalikan daftar kandidat (maks 5). */
export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: trimmed,
    addressdetails: '1',
    limit: '5',
    countrycodes: 'id',
    'accept-language': 'id',
  });
  try {
    const res = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as NominatimPlace[];
    return data.map(toResult);
  } catch {
    return [];
  }
}

/** Ubah koordinat menjadi alamat terbaca. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
    'accept-language': 'id',
  });
  try {
    const res = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimPlace & { error?: string };
    if (data.error || !data.lat) return null;
    return toResult(data);
  } catch {
    return null;
  }
}
