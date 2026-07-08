import { userApi } from '@/lib/api/client';
import { parseUser, type AdminLoginOutcome, type RegisterUserPayload, type User } from '../types';

interface TokenNode {
  access_token?: string;
  refresh_token?: string;
}

interface LoginResult {
  token: string;
  refreshToken: string;
  user: User;
}

/** Login user biasa via gateway customer. */
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const res = await userApi.post<{
    data?: { token?: TokenNode; member?: Record<string, unknown> };
  }>('/v1/auth/login', { email, password });

  const data = res.data?.data;
  const token = data?.token?.access_token ?? '';
  if (!token) throw new Error('Respons login tidak valid.');

  const memberJson = data?.member ?? {};
  const user = parseUser(memberJson);
  return {
    token,
    refreshToken: data?.token?.refresh_token ?? '',
    user: user.email ? user : { ...user, email },
  };
}

/** Registrasi user baru (account_type = user). */
export async function registerUser(payload: RegisterUserPayload): Promise<void> {
  await userApi.post('/v1/auth/register', {
    fullname: payload.fullname,
    email: payload.email,
    password: payload.password,
    retype_password: payload.retypePassword,
    account_type: 'user',
    partner_type: '',
    business_name: '',
    business_phone: '',
    business_address: '',
  });
}

/** Field profil mitra dalam bentuk camelCase (sumber form). */
export interface PartnerProfileFields {
  companyName: string;
  nib: string;
  npwp?: string;
  officeAddress: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  companyEmail: string;
  companyPhone?: string;
  logoUrl?: string;
  picName: string;
  picPosition?: string;
  picKtpNumber: string;
  picKtpPhotoUrl?: string;
  picPhone: string;
  picEmail?: string;
  legalDeed?: string;
  legalBusinessLicense?: string;
  legalTdpNib?: string;
  establishedYear?: string;
  skKemenkumham?: string;
}

/** Ubah field profil mitra ke bentuk snake_case yang diharapkan backend. */
export function buildPartnerProfileBody(p: PartnerProfileFields): Record<string, unknown> {
  return {
    company_name: p.companyName,
    nib: p.nib,
    npwp: p.npwp ?? '',
    office_address: p.officeAddress,
    city: p.city ?? '',
    province: p.province ?? '',
    company_email: p.companyEmail,
    company_phone: p.companyPhone ?? '',
    latitude: p.latitude ?? 0,
    longitude: p.longitude ?? 0,
    logo_url: p.logoUrl ?? '',
    pic_name: p.picName,
    pic_position: p.picPosition ?? '',
    pic_ktp_number: p.picKtpNumber,
    pic_ktp_photo_url: p.picKtpPhotoUrl ?? '',
    pic_phone: p.picPhone,
    pic_email: p.picEmail ?? '',
    legal_deed: p.legalDeed ?? '',
    legal_business_license: p.legalBusinessLicense ?? '',
    legal_tdp_nib: p.legalTdpNib ?? '',
    established_year: p.establishedYear ?? '',
    sk_kemenkumham: p.skKemenkumham ?? '',
  };
}

export interface RegisterPartnerPayload extends PartnerProfileFields {
  partnerType: string;
  email: string;
  password: string;
  retypePassword: string;
}

/** Registrasi mitra (account_type = partner). Login mitra dilakukan di backoffice. */
export async function registerPartner(payload: RegisterPartnerPayload): Promise<void> {
  const accountName = payload.picName.trim() || payload.companyName.trim() || payload.email;
  const companyEmail = payload.companyEmail.trim() || payload.email;

  await userApi.post('/v1/auth/register', {
    fullname: accountName,
    email: payload.email,
    password: payload.password,
    retype_password: payload.retypePassword,
    account_type: 'partner',
    partner_type: payload.partnerType,
    business_name: payload.companyName,
    business_phone: payload.companyPhone ?? '',
    business_address: payload.officeAddress,
    partner_profile: buildPartnerProfileBody({ ...payload, companyEmail }),
  });
}

/** Upload gambar onboarding mitra sebelum akun punya token login. */
export async function uploadPartnerOnboardingImage(file: File, category: string): Promise<string> {
  const form = new FormData();
  form.append('uploadfile', file, file.name || `${category}.jpg`);
  form.append('category', category);

  const res = await userApi.post<{ data?: unknown }>('/v1/s3/onboarding/image/upload', form);
  const data = res.data?.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const value = obj.image_name ?? obj.url ?? obj.key;
    if (typeof value === 'string') return value;
  }
  throw new Error('Respons unggah gambar tidak valid.');
}

/** Ambil profil user terkini. */
export async function fetchProfile(): Promise<User> {
  const res = await userApi.get<{ data?: Record<string, unknown> }>('/v1/member/profile');
  return parseUser(res.data?.data ?? {});
}

export interface UpdateProfilePayload {
  fullname: string;
  email: string;
  phone: string;
  imageName?: string;
}

/** Simpan perubahan profil user. */
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const res = await userApi.put<{ data?: Record<string, unknown> }>('/v1/member/profile', {
    fullname: payload.fullname,
    email: payload.email,
    phone: payload.phone,
    image_name: payload.imageName ?? '',
  });
  return parseUser(res.data?.data ?? {});
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  retypePassword: string;
}

/** Ubah kata sandi user yang sedang login. */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await userApi.put('/v1/member/password', {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
    retype_password: payload.retypePassword,
  });
}

/** Upload avatar profil user yang sudah login. */
export async function uploadProfileImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('uploadfile', file, file.name || 'profile-avatar.jpg');
  form.append('category', 'profile_avatar');

  const res = await userApi.post<{ data?: unknown }>('/v1/s3/image/upload', form);
  const data = res.data?.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const value = obj.file_path ?? obj.image_name ?? obj.url ?? obj.key;
    if (typeof value === 'string') return value;
  }
  throw new Error('Respons unggah foto profil tidak valid.');
}

/**
 * Login admin/partner (`/v1/admin/auth/login`) untuk halaman mitra/sopir.
 * Mengembalikan null bila kredensial ditolak gateway.
 */
export async function probeAdminLogin(
  email: string,
  password: string,
): Promise<AdminLoginOutcome | null> {
  try {
    const res = await userApi.post<{
      data?: { access_token?: string; admin?: Record<string, unknown> };
    }>('/v1/admin/auth/login', { email, password }, { headers: { Authorization: undefined } });
    const data = res.data?.data;
    const admin = data?.admin ?? {};
    const token = data?.access_token ?? '';
    const role = typeof admin.role === 'string' ? admin.role : '';
    if (!token || !role) return null;
    return {
      token,
      role,
      name: typeof admin.fullname === 'string' ? admin.fullname : '',
      accountStatus: typeof admin.account_status === 'string' ? admin.account_status : 'ACTIVE',
      rejectionReason: typeof admin.rejection_reason === 'string' ? admin.rejection_reason : '',
      rejectionCount: typeof admin.rejection_count === 'number' ? admin.rejection_count : 0,
    };
  } catch {
    return null;
  }
}
