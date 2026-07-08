import { type FormEvent, type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Camera, Save } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/feedback/toast';
import { extractErrorMessage } from '@/lib/api/client';
import { ROUTES } from '@/app/routes';
import { MitraShell } from '../../components/MitraShell';
import { createMitraTowingFleet, TOWING_FLEET_TYPE_OPTIONS } from '../../api';

/** Kartu pembungkus satu field (label kapital + kontrol), gaya desain Kelola Armada. */
function CardField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <label className="mb-2 block text-[11px] font-semibold tracking-wide text-neutral-500">
        {label}
      </label>
      {children}
    </div>
  );
}

const CONTROL_CLASS =
  'block h-11 w-full rounded-lg border border-gray-200 bg-neutral-50 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-deep-blue-400 focus:bg-white focus:ring-2 focus:ring-deep-blue-100 focus:outline-none';

/** Ambil nilai field form sebagai string (FormData bisa berisi File). */
function field(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === 'string' ? value : '';
}

/** Form tambah armada — menyimpan ke armada milik mitra yang sedang login. */
export function ArmadaTambahPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof createMitraTowingFleet>[0]) =>
      createMitraTowingFleet(input),
    onSuccess: () => {
      toast.success('Data armada tersimpan.');
      navigate(ROUTES.mitraArmada);
    },
    onError: (err) => setError(extractErrorMessage(err, 'Gagal menyimpan data armada.')),
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const plateNumber = field(fd, 'plate_number').trim();
    if (!plateNumber) {
      setError('Nomor plat wajib diisi.');
      return;
    }
    mutation.mutate({
      plateNumber,
      fleetType: field(fd, 'fleet_type') || 'FLATBED',
      capacityLabel: field(fd, 'capacity_label').trim(),
      status: 'AVAILABLE',
      isActive: true,
    });
  };

  return (
    <MitraShell>
      <AppHeader showLogo />

      <form onSubmit={handleSubmit} className="px-5 py-4">
        <h1 className="text-18 font-bold text-neutral-900">Kelola Armada</h1>
        <p className="text-12 mt-1 text-neutral-500">
          Lengkapi detail kendaraan di bawah ini untuk didaftarkan ke dalam sistem manajemen fleet
          AI.
        </p>

        <div className="mt-4 space-y-3">
          <CardField label="NAMA ARMADA">
            <input
              name="capacity_label"
              className={CONTROL_CLASS}
              placeholder="Contoh: Truck Logistik Jakarta"
            />
          </CardField>

          <CardField label="JENIS KENDARAAN">
            <select name="fleet_type" className={CONTROL_CLASS} defaultValue="FLATBED">
              {TOWING_FLEET_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </CardField>

          <CardField label="NOMOR PLAT">
            <input name="plate_number" className={CONTROL_CLASS} placeholder="B 1234 ABC" required />
          </CardField>

          <CardField label="NOMOR RANGKA (VIN)">
            <input className={CONTROL_CLASS} placeholder="17 Karakter VIN" maxLength={17} />
          </CardField>

          <CardField label="TAHUN KENDARAAN">
            <input className={CONTROL_CLASS} placeholder="2024" inputMode="numeric" />
          </CardField>

          <CardField label="FOTO KENDARAAN">
            <button
              type="button"
              onClick={() => toast.info('Unggah foto kendaraan segera hadir.')}
              className="hover:border-deep-blue-400 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-neutral-50 py-7 text-center transition"
            >
              <span className="bg-deep-blue-500 grid size-11 place-items-center rounded-full text-white">
                <Camera className="size-5" />
              </span>
              <span className="text-12 font-medium text-neutral-700">
                Klik atau tarik foto ke sini
              </span>
              <span className="text-[11px] text-neutral-400">
                Maksimum ukuran file 5MB. Format JPG, PNG.
              </span>
            </button>
          </CardField>
        </div>

        {error && <p className="text-12 mt-3 text-danger">{error}</p>}

        <Button
          type="submit"
          className="mt-5"
          isLoading={mutation.isPending}
          leftIcon={<Save className="size-5" />}
        >
          Simpan Data Armada
        </Button>
      </form>
    </MitraShell>
  );
}
