import { z } from 'zod';

/**
 * Field profil mitra (perusahaan + PIC + dokumen legal). Dipakai bersama oleh
 * alur pendaftaran dan alur perbaikan data (resubmit), agar konsisten.
 */
const partnerProfileShape = {
  companyName: z.string().min(2, 'Nama perusahaan tidak boleh kosong.'),
  nib: z.string().min(1, 'NIB tidak boleh kosong.'),
  npwp: z.string().optional(),
  officeAddress: z.string().min(5, 'Alamat usaha tidak boleh kosong.'),
  city: z.string().optional(),
  province: z.string().optional(),
  // Koordinat dari pemilih peta (OSM). Diisi via setValue, bukan input teks.
  latitude: z.number().default(0),
  longitude: z.number().default(0),
  companyEmail: z.string().email('Format email perusahaan tidak valid.'),
  companyPhone: z
    .string()
    .regex(/^[0-9+\s-]*$/, 'Nomor telepon kantor tidak valid.')
    .optional(),

  picName: z.string().min(2, 'Nama PIC tidak boleh kosong.'),
  picPosition: z.string().optional(),
  picKtpNumber: z.string().min(1, 'Nomor KTP tidak boleh kosong.'),
  picPhone: z
    .string()
    .min(8, 'Nomor HP minimal 8 digit.')
    .regex(/^[0-9+\s-]+$/, 'Nomor HP tidak valid.'),
  picEmail: z.union([z.literal(''), z.string().email('Format email PIC tidak valid.')]),

  legalDeed: z.string().optional(),
  legalBusinessLicense: z.string().optional(),
  legalTdpNib: z.string().optional(),
  establishedYear: z
    .string()
    .regex(/^\d{0,4}$/, 'Tahun harus berisi maksimal 4 digit.')
    .optional(),
  skKemenkumham: z.string().optional(),
};

/** Skema profil mitra saja (dipakai alur resubmit). */
export const partnerProfileSchema = z.object(partnerProfileShape);
export type PartnerProfileValues = z.infer<typeof partnerProfileSchema>;

/** Skema pendaftaran mitra = akun + profil. */
export const partnerRegisterSchema = z
  .object({
    email: z.string().min(1, 'Email tidak boleh kosong.').email('Format email tidak valid.'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
    retypePassword: z.string().min(1, 'Konfirmasi kata sandi tidak boleh kosong.'),
    ...partnerProfileShape,
  })
  .refine((data) => data.password === data.retypePassword, {
    message: 'Konfirmasi kata sandi tidak cocok.',
    path: ['retypePassword'],
  });

export type PartnerRegisterValues = z.infer<typeof partnerRegisterSchema>;
