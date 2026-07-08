import axios from 'axios';
import { env } from '@/config/env';
import { buildPartnerProfileBody, type PartnerProfileFields } from '@/features/auth/api/authApi';
import {
  NGROK_SKIP_BROWSER_WARNING_HEADER,
  NGROK_SKIP_BROWSER_WARNING_VALUE,
} from '@/lib/api/headers';

/**
 * Klien khusus sesi mitra untuk alur perbaikan data (resubmit). Token diberikan
 * eksplisit per panggilan dan TIDAK disimpan (ephemeral) — webapp hanya untuk
 * memperbaiki data yang ditolak admin, bukan dashboard backoffice.
 */
const partnerHttp = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 60_000,
  headers: {
    'X-Channel': env.apiChannel,
    'Content-Type': 'application/json',
    [NGROK_SKIP_BROWSER_WARNING_HEADER]: NGROK_SKIP_BROWSER_WARNING_VALUE,
  },
});

function authConfig(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/** Batas penolakan pendaftaran mitra (sinkron backend PartnerMaxRejections). */
export const PARTNER_MAX_REJECTIONS = 3;

/** Peran admin yang merupakan mitra. */
const PARTNER_ROLES = ['insurance_admin', 'workshop_admin', 'towing_admin'] as const;

export function isPartnerRole(role: string): boolean {
  return (PARTNER_ROLES as readonly string[]).includes(role);
}

/** Peran admin → jenis mitra (untuk label izin usaha & teks). */
export function partnerTypeFromRole(role: string): string {
  switch (role) {
    case 'workshop_admin':
      return 'workshop';
    case 'insurance_admin':
      return 'insurance';
    default:
      return 'towing_provider';
  }
}

export interface PartnerProfilePrefill extends PartnerProfileFields {
  latitude: number;
  longitude: number;
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  return typeof value === 'number' ? value : Number(value) || 0;
}

/** Ambil profil mitra terkini untuk prefill form perbaikan. */
export async function getPartnerProfilePrefill(token: string): Promise<PartnerProfilePrefill> {
  const res = await partnerHttp.get<{ data?: { profile?: Record<string, unknown> } }>(
    '/v1/admin/partner/me',
    authConfig(token),
  );
  const p = res.data?.data?.profile ?? {};
  return {
    companyName: readString(p, 'company_name'),
    nib: readString(p, 'nib'),
    npwp: readString(p, 'npwp'),
    officeAddress: readString(p, 'office_address'),
    city: readString(p, 'city'),
    province: readString(p, 'province'),
    latitude: readNumber(p, 'latitude'),
    longitude: readNumber(p, 'longitude'),
    companyEmail: readString(p, 'company_email'),
    companyPhone: readString(p, 'company_phone'),
    logoUrl: readString(p, 'logo_url'),
    picName: readString(p, 'pic_name'),
    picPosition: readString(p, 'pic_position'),
    picKtpNumber: readString(p, 'pic_ktp_number'),
    picKtpPhotoUrl: readString(p, 'pic_ktp_photo_url'),
    picPhone: readString(p, 'pic_phone'),
    picEmail: readString(p, 'pic_email'),
    legalDeed: readString(p, 'legal_deed'),
    legalBusinessLicense: readString(p, 'legal_business_license'),
    legalTdpNib: readString(p, 'legal_tdp_nib'),
    establishedYear: readString(p, 'established_year'),
    skKemenkumham: readString(p, 'sk_kemenkumham'),
  };
}

/** Kirim ulang profil mitra yang sudah diperbaiki. */
export async function resubmitPartnerProfile(
  token: string,
  fields: PartnerProfileFields,
): Promise<void> {
  await partnerHttp.post(
    '/v1/admin/partner/resubmit',
    buildPartnerProfileBody(fields),
    authConfig(token),
  );
}
