import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Clock,
  FileText,
  PhoneOff,
  Phone,
  Star,
  Truck,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/Spinner';
import { toast } from '@/components/feedback/toast';
import { confirm } from '@/components/feedback/confirm';
import { extractErrorMessage } from '@/lib/api/client';
import { ROUTES } from '@/app/routes';
import { MitraShell } from '../../components/MitraShell';
import { LabeledCard, InfoRow, StatTile } from '../../components/MitraCard';
import {
  createMitraTowingDriverAccount,
  deleteMitraTowingDriver,
  driverStatusLabel,
  fleetTypeLabel,
  getMitraTowingDrivers,
  type MitraTowingDriver,
} from '../../api';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'S';
}

function driverCode(id: number): string {
  return `DRV-${String(id).padStart(4, '0')}`;
}

/** Detail profil sopir: statistik, info pribadi/kendaraan, dokumen, aksi. */
export function SopirDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const driverID = Number(id);
  const [drivers, setDrivers] = useState<MitraTowingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMitraTowingDrivers()
      .then((items) => {
        if (active) setDrivers(items);
      })
      .catch((error) => toast.error(extractErrorMessage(error, 'Gagal memuat detail sopir.')))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const sopir = useMemo(
    () => drivers.find((item) => item.id === driverID),
    [drivers, driverID],
  );

  if (loading) {
    return (
      <MitraShell>
        <AppHeader showLogo />
        <LoadingState label="Memuat detail sopir…" />
      </MitraShell>
    );
  }

  if (!sopir || !Number.isFinite(driverID)) {
    return (
      <MitraShell>
        <AppHeader showLogo />
        <p className="text-12 px-5 py-20 text-center text-neutral-500">Sopir tidak ditemukan.</p>
      </MitraShell>
    );
  }

  const handleDeactivate = async () => {
    const ok = await confirm({
      title: 'Nonaktifkan Sopir',
      message: `Nonaktifkan ${sopir.fullname} dari armada Anda?`,
      confirmText: 'Nonaktifkan',
      tone: 'danger',
    });
    if (!ok) return;
    setSubmitting(true);
    try {
      await deleteMitraTowingDriver(sopir.id);
      toast.success('Sopir dinonaktifkan.');
      navigate(ROUTES.mitraSopir);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Gagal menonaktifkan sopir.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    const email = accountEmail.trim();
    if (!email) {
      toast.error('Email login sopir wajib diisi.');
      return;
    }
    if (accountPassword.length < 8) {
      toast.error('Kata sandi akun sopir minimal 8 karakter.');
      return;
    }
    if (accountPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak sama.');
      return;
    }

    setAccountSubmitting(true);
    try {
      await createMitraTowingDriverAccount({
        driverId: sopir.id,
        email,
        password: accountPassword,
      });
      setDrivers((items) =>
        items.map((item) => (item.id === sopir.id ? { ...item, driverUserId: 1 } : item)),
      );
      setAccountEmail('');
      setAccountPassword('');
      setConfirmPassword('');
      toast.success('Akun login sopir dibuat.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Gagal membuat akun login sopir.'));
    } finally {
      setAccountSubmitting(false);
    }
  };

  const online = sopir.status !== 'OFFLINE' && sopir.status !== 'INACTIVE';
  // Sopir tidak terikat ke satu kendaraan; fleetType = spesialisasi (opsional).
  const specialization = sopir.fleetType ? fleetTypeLabel(sopir.fleetType) : 'Semua jenis armada';

  return (
    <MitraShell>
      <AppHeader
        showLogo
        rightSlot={
          <button
            type="button"
            onClick={() => toast.info('Ubah data sopir segera hadir.')}
            className="text-deep-blue-500 text-12 font-semibold"
          >
            Edit
          </button>
        }
      />

      <div className="px-5 pt-2 pb-6">
        {/* Identitas */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="bg-deep-blue-50 text-deep-blue-600 grid size-24 place-items-center rounded-full text-2xl font-bold ring-4 ring-white">
              {initials(sopir.fullname)}
            </div>
            <span
              className={cn(
                'absolute right-1.5 bottom-1.5 size-5 rounded-full border-[3px] border-white',
                online ? 'bg-green-cust' : 'bg-neutral-400',
              )}
            />
          </div>
          <h1 className="text-18 mt-3 font-bold text-neutral-900">{sopir.fullname}</h1>
          <p className="text-12 text-neutral-500">
            {driverCode(sopir.id)} • {driverStatusLabel(sopir.status)}
          </p>
        </div>

        {/* Statistik */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatTile
            icon={Star}
            iconClassName="fill-warning text-warning"
            value={sopir.isActive ? 'Aktif' : 'Nonaktif'}
            label="Akun"
          />
          <StatTile icon={Truck} value={specialization} label="Spesialisasi" />
          <StatTile icon={Clock} value={driverStatusLabel(sopir.status)} label="Status" />
        </div>

        {/* Informasi Pribadi */}
        <LabeledCard icon={User} title="Informasi Pribadi" className="mt-4">
          <InfoRow label="Nomor Telepon" value={sopir.phone} />
          <InfoRow label="Nomor SIM" value={sopir.licenseNumber || 'Belum diisi'} />
          <InfoRow label="Mitra Towing" value={sopir.towingName || 'Mitra login'} />
        </LabeledCard>

        <LabeledCard icon={BadgeCheck} title="Akun Login Sopir" className="mt-4">
          {sopir.driverUserId > 0 ? (
            <InfoRow label="Status Akun" value="Aktif untuk portal driver" />
          ) : (
            <div className="space-y-3">
              <Input
                label="Email Login"
                type="email"
                value={accountEmail}
                onChange={(event) => setAccountEmail(event.target.value)}
                placeholder="driver@perusahaan.com"
                autoComplete="email"
              />
              <Input
                label="Kata Sandi"
                type="password"
                value={accountPassword}
                onChange={(event) => setAccountPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
              />
              <Input
                label="Konfirmasi Kata Sandi"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ulangi kata sandi"
                autoComplete="new-password"
              />
              <Button onClick={handleCreateAccount} isLoading={accountSubmitting}>
                Buat Akun Sopir
              </Button>
            </div>
          )}
        </LabeledCard>

        {/* Spesialisasi armada — bukan kendaraan tetap milik sopir. */}
        <LabeledCard icon={Truck} title="Spesialisasi Armada" className="mt-4">
          <InfoRow label="Jenis Armada" value={specialization} />
          <InfoRow
            label="Catatan"
            value="Sopir tetap bisa ditugaskan ke jenis armada lain saat penugasan order."
          />
        </LabeledCard>

        {/* Dokumen */}
        <LabeledCard icon={FileText} title="Dokumen" className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            <DocTile
              label="SIM"
              sub={sopir.licenseNumber || 'Nomor SIM belum diisi'}
              ok={Boolean(sopir.licenseNumber)}
            />
            <DocTile
              label="Status Akun"
              sub={sopir.isActive ? 'Aktif di sistem' : 'Nonaktif'}
              ok={sopir.isActive}
            />
          </div>
        </LabeledCard>

        {/* Aksi */}
        <div className="mt-6 space-y-3">
          <Button
            leftIcon={<Phone className="size-5" />}
            onClick={() => toast.info(`Menghubungi ${sopir.fullname}…`)}
          >
            Hubungi Sopir
          </Button>
          <Button
            variant="outline"
            className="border-danger text-danger hover:bg-danger/5"
            leftIcon={<PhoneOff className="size-5" />}
            onClick={handleDeactivate}
            isLoading={submitting}
          >
            Nonaktifkan Sopir
          </Button>
        </div>
      </div>
    </MitraShell>
  );
}

function DocTile({ label, sub, ok }: { label: string; sub: string; ok: boolean }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-12 font-semibold text-neutral-900">{label}</span>
        {ok && <BadgeCheck className="text-green-cust size-4" />}
      </div>
      <p className="mt-1 text-[11px] text-neutral-500">{sub}</p>
    </div>
  );
}
