import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/feedback/toast';
import { extractErrorMessage } from '@/lib/api/client';
import { buildPath, ROUTES } from '@/app/routes';
import { MitraShell } from '../../components/MitraShell';
import { createMitraTowingDriver, createMitraTowingDriverAccount } from '../../api';

/** Bungkus label untuk field non-Input (select/date). */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-neutral-800">{label}</label>
      {children}
    </div>
  );
}

const SELECT_CLASS =
  'block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-neutral-900 shadow-sm focus:border-deep-blue-500 focus:ring-2 focus:ring-deep-blue-200 focus:outline-none';

/** Ambil nilai field form sebagai string. */
function field(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === 'string' ? value : '';
}

// Status di UI → status backend (towing_drivers.status).
const STATUS_MAP: Record<string, string> = {
  aktif: 'AVAILABLE',
  on_duty: 'BUSY',
  offline: 'OFFLINE',
};

interface CreateDriverWithAccountInput {
  driver: Parameters<typeof createMitraTowingDriver>[0];
  accountEmail: string;
  accountPassword: string;
}

/**
 * Form tambah AKUN sopir towing (data sopir saja). Pemasangan armada↔sopir
 * dilakukan saat Penugasan order, bukan di sini. Dokumen pribadi (KTP/SIM/
 * selfie) diunggah oleh sopir sendiri lewat portal driver.
 */
export function SopirTambahPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async (input: CreateDriverWithAccountInput) => {
      const driver = await createMitraTowingDriver(input.driver);
      try {
        await createMitraTowingDriverAccount({
          driverId: driver.id,
          email: input.accountEmail,
          password: input.accountPassword,
        });
        return { driver, accountCreated: true, accountError: undefined };
      } catch (accountError) {
        return { driver, accountCreated: false, accountError };
      }
    },
    onSuccess: (result) => {
      if (result.accountCreated) {
        toast.success('Data dan akun login sopir tersimpan.');
        navigate(ROUTES.mitraSopir);
        return;
      }
      toast.error(
        extractErrorMessage(
          result.accountError,
          'Data sopir tersimpan, tetapi akun login gagal dibuat.',
        ),
      );
      navigate(buildPath.mitraSopirDetail(String(result.driver.id)));
    },
    onError: (err) => setError(extractErrorMessage(err, 'Gagal menyimpan data sopir.')),
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const fullname = field(fd, 'fullname').trim();
    const phone = field(fd, 'phone').trim();
    const accountEmail = field(fd, 'account_email').trim();
    const accountPassword = field(fd, 'account_password');
    const confirmPassword = field(fd, 'confirm_password');
    if (!fullname || !phone) {
      setError('Nama lengkap dan nomor HP wajib diisi.');
      return;
    }
    if (!accountEmail) {
      setError('Email login sopir wajib diisi.');
      return;
    }
    if (accountPassword.length < 8) {
      setError('Kata sandi akun sopir minimal 8 karakter.');
      return;
    }
    if (accountPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    const uiStatus = field(fd, 'status') || 'aktif';

    mutation.mutate({
      driver: {
        fullname,
        phone,
        licenseNumber: field(fd, 'license_number').trim(),
        status: STATUS_MAP[uiStatus] ?? 'AVAILABLE',
        isActive: uiStatus !== 'offline',
      },
      accountEmail,
      accountPassword,
    });
  };

  return (
    <MitraShell>
      <AppHeader title="Data Sopir" />

      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
        <Input name="fullname" label="Nama Lengkap Sopir" placeholder="Masukkan nama lengkap" required />
        <Input label="Nomor KTP" placeholder="16 digit NIK" inputMode="numeric" />
        <Input
          name="phone"
          label="Nomor HP (WhatsApp aktif)"
          placeholder="08xxxxxxxxxx"
          inputMode="tel"
          required
        />
        <Input label="Alamat" placeholder="Alamat domisili" />
        <Field label="Tanggal Lahir">
          <Input type="date" />
        </Field>
        <Field label="Jenis Kelamin">
          <select className={SELECT_CLASS} defaultValue="">
            <option value="" disabled>
              Pilih jenis kelamin
            </option>
            <option>Laki-laki</option>
            <option>Perempuan</option>
          </select>
        </Field>
        <Input name="license_number" label="Nomor SIM" placeholder="Nomor SIM B/B II" />
        <Field label="Masa Berlaku SIM">
          <Input type="date" />
        </Field>
        <Input label="Pengalaman Mengemudi (Tahun)" type="number" min={0} placeholder="mis. 5" />
        <Field label="Status Sopir">
          <select name="status" className={SELECT_CLASS} defaultValue="aktif">
            <option value="aktif">Aktif</option>
            <option value="on_duty">On Duty</option>
            <option value="offline">Offline</option>
          </select>
        </Field>
        <Field label="Tanggal Bergabung">
          <Input type="date" />
        </Field>

        <div className="space-y-4 rounded-xl border border-deep-blue-100 bg-white p-4">
          <div>
            <p className="text-14 font-semibold text-neutral-900">Akun Login Sopir</p>
            <p className="text-12 mt-1 text-neutral-600">
              Akun ini dipakai sopir untuk masuk ke portal driver AutoClaim.
            </p>
          </div>
          <Input
            name="account_email"
            label="Email Login Sopir"
            type="email"
            placeholder="driver@perusahaan.com"
            autoComplete="email"
            required
          />
          <Input
            name="account_password"
            label="Kata Sandi"
            type="password"
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            required
          />
          <Input
            name="confirm_password"
            label="Konfirmasi Kata Sandi"
            type="password"
            placeholder="Ulangi kata sandi"
            autoComplete="new-password"
            required
          />
        </div>

        {/* Dokumen pribadi diunggah sopir sendiri di portal driver. */}
        <div className="bg-deep-blue-50 text-deep-blue-700 flex items-start gap-2 rounded-xl p-3">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p className="text-12">
            Dokumen <strong>KTP, SIM, dan foto diri</strong> diunggah oleh sopir sendiri melalui
            portal driver. Armada yang dikemudikan ditentukan saat penugasan order.
          </p>
        </div>

        {error && <p className="text-12 text-danger">{error}</p>}

        <div className="space-y-3 pt-2">
          <Button type="submit" isLoading={mutation.isPending}>
            Tambah Sopir Towing
          </Button>
        </div>
      </form>
    </MitraShell>
  );
}
