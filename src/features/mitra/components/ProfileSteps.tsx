import { useCallback, useId, type ChangeEvent } from 'react';
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Hash,
  IdCard,
  Mail,
  Phone,
  Upload,
  User,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { LocationPicker, type PickedLocation } from '@/components/map/LocationPicker';
import type { MapPoint } from '@/components/map/leafletConfig';
import type { PartnerProfileValues } from '../schemas';

type ProfileRegister = UseFormRegister<PartnerProfileValues>;
type ProfileErrors = FieldErrors<PartnerProfileValues>;
type ProfileSetValue = UseFormSetValue<PartnerProfileValues>;

export interface ProfileFieldProps {
  register: ProfileRegister;
  errors: ProfileErrors;
  setValue: ProfileSetValue;
}

export function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pt-1 pb-2 text-center">
      <h1 className="text-deep-blue-500 text-[24px] leading-[1.18] font-bold">{title}</h1>
      <p className="mt-2 text-sm text-neutral-700">{subtitle}</p>
    </div>
  );
}

export function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-2 rounded-full transition-all ${
            index === current ? 'bg-deep-blue-500 w-6' : 'w-2 bg-neutral-400'
          }`}
        />
      ))}
    </div>
  );
}

export function FileUploadField({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputId = useId();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.currentTarget.files?.[0] ?? null);
  };

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-base font-medium text-neutral-800">
        {label}
      </label>
      <label
        htmlFor={inputId}
        className="hover:border-deep-blue-500 flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-neutral-700 shadow-sm transition"
      >
        {file ? (
          <CheckCircle2 className="text-success size-5 shrink-0" />
        ) : (
          <Upload className="size-5 shrink-0 text-neutral-600" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm">{file ? file.name : 'Pilih gambar'}</span>
        {file && <span className="text-deep-blue-500 text-xs font-semibold">Ganti</span>}
      </label>
      <input id={inputId} type="file" accept="image/*" className="sr-only" onChange={handleChange} />
    </div>
  );
}

export function StepCompany({
  register,
  errors,
  setValue,
  logoFile,
  onLogoChange,
  initialPoint,
}: ProfileFieldProps & {
  logoFile: File | null;
  onLogoChange: (file: File | null) => void;
  /** Titik awal peta (mis. koordinat tersimpan saat resubmit). */
  initialPoint?: MapPoint;
}) {
  // Titik di peta mengisi alamat + kota + provinsi + koordinat; field teks tetap
  // bisa disunting user untuk penyesuaian.
  const handlePick = useCallback(
    (location: PickedLocation) => {
      if (location.address) {
        setValue('officeAddress', location.address, { shouldValidate: true, shouldDirty: true });
      }
      if (location.city) setValue('city', location.city, { shouldDirty: true });
      if (location.province) setValue('province', location.province, { shouldDirty: true });
      setValue('latitude', location.lat, { shouldDirty: true });
      setValue('longitude', location.lng, { shouldDirty: true });
    },
    [setValue],
  );

  return (
    <div className="flex flex-col gap-4 pb-5">
      <StepTitle title="Lengkapi Data Mitra" subtitle="Lengkapi identitas perusahaan Anda" />
      <Input
        label="Nama Perusahaan (PT/CV)"
        placeholder="Masukan Nama Perusahaan (PT/CV)"
        leftIcon={<Building2 className="size-5" />}
        error={errors.companyName?.message}
        {...register('companyName')}
      />
      <Input
        label="Nomor Induk Berusaha (NIB)"
        placeholder="Masukan Nomor Induk Berusaha (NIB)"
        inputMode="numeric"
        leftIcon={<Hash className="size-5" />}
        error={errors.nib?.message}
        {...register('nib')}
      />
      <Input
        label="Nomor NPWP Perusahaan"
        placeholder="Masukan Nomor NPWP Perusahaan"
        inputMode="numeric"
        leftIcon={<FileText className="size-5" />}
        error={errors.npwp?.message}
        {...register('npwp')}
      />

      <div>
        <p className="mb-2 block text-base font-medium text-neutral-800">Lokasi Usaha di Peta</p>
        <LocationPicker value={initialPoint} onPick={handlePick} />
      </div>

      <TextArea
        label="Alamat Usaha"
        placeholder="Pilih di peta atau ketik manual"
        rows={2}
        error={errors.officeAddress?.message}
        {...register('officeAddress')}
      />
      <Input
        label="Kota / Kabupaten"
        placeholder="Masukan Kota / Kabupaten"
        error={errors.city?.message}
        {...register('city')}
      />
      <Input
        label="Provinsi"
        placeholder="Masukan Provinsi"
        error={errors.province?.message}
        {...register('province')}
      />
      <Input
        label="Email Perusahaan"
        type="email"
        placeholder="Masukan Email Perusahaan"
        readOnly
        className="bg-neutral-300 text-neutral-700"
        leftIcon={<Mail className="size-5" />}
        error={errors.companyEmail?.message}
        hint="Untuk mengubah email, kembali ke langkah akun."
        {...register('companyEmail')}
      />
      <Input
        label="Nomor Telepon Kantor"
        type="tel"
        placeholder="Masukan Nomor Telepon Kantor"
        leftIcon={<Phone className="size-5" />}
        error={errors.companyPhone?.message}
        {...register('companyPhone')}
      />
      <FileUploadField label="Logo Perusahaan" file={logoFile} onChange={onLogoChange} />
    </div>
  );
}

export function StepPic({
  register,
  errors,
  ktpFile,
  onKtpChange,
}: Omit<ProfileFieldProps, 'setValue'> & {
  ktpFile: File | null;
  onKtpChange: (file: File | null) => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-5">
      <StepTitle title="Data Penanggung Jawab" subtitle="Masukkan data PIC yang bertanggung jawab" />
      <Input
        label="Nama Lengkap PIC"
        placeholder="Masukan nama lengkap"
        leftIcon={<User className="size-5" />}
        error={errors.picName?.message}
        {...register('picName')}
      />
      <Input
        label="Jabatan di Perusahaan"
        placeholder="Masukan jabatan"
        leftIcon={<BriefcaseBusiness className="size-5" />}
        error={errors.picPosition?.message}
        {...register('picPosition')}
      />
      <Input
        label="Nomor KTP"
        placeholder="Masukan nomor KTP"
        inputMode="numeric"
        leftIcon={<IdCard className="size-5" />}
        error={errors.picKtpNumber?.message}
        {...register('picKtpNumber')}
      />
      <FileUploadField label="Foto KTP" file={ktpFile} onChange={onKtpChange} />
      <Input
        label="Nomor HP (WhatsApp aktif)"
        type="tel"
        placeholder="Masukan nomor HP"
        leftIcon={<Phone className="size-5" />}
        error={errors.picPhone?.message}
        {...register('picPhone')}
      />
      <Input
        label="Email Pribadi PIC"
        type="email"
        placeholder="Masukan email pribadi"
        leftIcon={<Mail className="size-5" />}
        error={errors.picEmail?.message}
        {...register('picEmail')}
      />
    </div>
  );
}

export function StepLegal({
  register,
  errors,
  licenseLabel,
}: Omit<ProfileFieldProps, 'setValue'> & { licenseLabel: string }) {
  return (
    <div className="flex flex-col gap-4 pb-5">
      <StepTitle title="Dokumen Legal Perusahaan" subtitle="Lengkapi dokumen legal perusahaan" />
      <Input
        label="Akta Pendirian Perusahaan"
        placeholder="Masukan nomor akta"
        leftIcon={<FileText className="size-5" />}
        error={errors.legalDeed?.message}
        {...register('legalDeed')}
      />
      <Input
        label={licenseLabel}
        placeholder="Masukan nomor izin"
        leftIcon={<FileText className="size-5" />}
        error={errors.legalBusinessLicense?.message}
        {...register('legalBusinessLicense')}
      />
      <Input
        label="TDP / Sertifikat NIB"
        placeholder="Masukan nomor TDP / NIB"
        leftIcon={<FileText className="size-5" />}
        error={errors.legalTdpNib?.message}
        {...register('legalTdpNib')}
      />
      <Input
        label="NPWP Perusahaan"
        placeholder="Masukan Nomor NPWP Perusahaan"
        inputMode="numeric"
        leftIcon={<FileText className="size-5" />}
        error={errors.npwp?.message}
        {...register('npwp')}
      />
      <Input
        label="Tahun Pembuatan"
        placeholder="Masukan tahun pembuatan"
        inputMode="numeric"
        leftIcon={<CalendarDays className="size-5" />}
        error={errors.establishedYear?.message}
        {...register('establishedYear')}
      />
      <Input
        label="SK Kemenkumham (opsional)"
        placeholder="Masukan nomor SK"
        leftIcon={<FileText className="size-5" />}
        error={errors.skKemenkumham?.message}
        {...register('skKemenkumham')}
      />
    </div>
  );
}
