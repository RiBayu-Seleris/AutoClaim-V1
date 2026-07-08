/** Profil user yang sedang masuk. */
export interface User {
  fullname: string;
  email: string;
  phone?: string;
  imageName?: string;
  role?: string;
  userRole: string;
  accountStatus: string;
  scopeType?: string;
  scopeId?: number;
  partnerType?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Bentuk `User` dari objek JSON gateway (`data.member` / `data` profil). */
export function parseUser(json: Record<string, unknown>): User {
  return {
    fullname: asString(json.fullname) ?? '',
    email: asString(json.email) ?? '',
    phone: asString(json.phone),
    imageName: asString(json.image_name),
    role: asString(json.role),
    userRole: asString(json.user_role) ?? 'user',
    accountStatus: asString(json.account_status) ?? 'ACTIVE',
    scopeType: asString(json.scope_type),
    scopeId: typeof json.scope_id === 'number' ? json.scope_id : undefined,
    partnerType: asString(json.partner_type),
  };
}

/** Hasil probe login admin/partner (dipakai untuk membedakan driver/mitra). */
export interface AdminLoginOutcome {
  token: string;
  role: string;
  name: string;
  accountStatus: string;
  rejectionReason: string;
  rejectionCount: number;
}

export interface RegisterUserPayload {
  fullname: string;
  email: string;
  password: string;
  retypePassword: string;
}
