import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarFront } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useScanStore } from '@/features/vehicle-scan/store/scanStore';
import { firstScanStepRoute } from '../flow';
import { hasCheckupPermissionsGranted } from '../permissions';

const currentYear = new Date().getFullYear();

export function VehicleDataPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const vehicleInfo = useScanStore((s) => s.vehicleInfo);
  const setVehicleInfo = useScanStore((s) => s.setVehicleInfo);
  const [brandModel, setBrandModel] = useState(vehicleInfo.brandModel);
  const [color, setColor] = useState(vehicleInfo.color);
  const [year, setYear] = useState(vehicleInfo.year);

  const yearError = useMemo(() => {
    if (!year.trim()) return '';
    const value = Number(year);
    if (!Number.isInteger(value) || value < 1980 || value > currentYear + 1) {
      return `Tahun harus antara 1980-${currentYear + 1}.`;
    }
    return '';
  }, [year]);

  const canContinue = brandModel.trim().length >= 2 && color.trim().length >= 2 && !yearError;

  const handleContinue = () => {
    if (!canContinue) return;
    setVehicleInfo({
      brandModel,
      color,
      year,
    });
    navigate(
      hasCheckupPermissionsGranted()
        ? firstScanStepRoute(isAuthenticated)
        : ROUTES.checkupPermission,
    );
  };

  return (
    <PageContainer className="bg-white">
      <div className="flex min-h-dvh flex-col px-6 pt-14 pb-8 text-neutral-900">
        <button type="button" onClick={() => navigate(ROUTES.home)} className="mx-auto">
          <Logo className="[&_img]:h-11" />
        </button>

        <div className="mt-10 flex justify-center">
          <span className="bg-deep-blue-50 text-deep-blue-500 flex size-16 items-center justify-center rounded-full">
            <CarFront className="size-8" />
          </span>
        </div>

        <h1 className="mt-6 text-center text-2xl leading-tight font-bold">Data Kendaraan</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-neutral-700">
          Lengkapi data singkat kendaraan yang akan discan agar hasil pemeriksaan lebih mudah
          dikenali.
        </p>

        <div className="mt-8 flex flex-col gap-5">
          <Input
            label="Jenis / Merk Mobil"
            value={brandModel}
            placeholder="Contoh: Toyota Avanza"
            autoCapitalize="words"
            onChange={(event) => setBrandModel(event.currentTarget.value)}
          />
          <Input
            label="Warna Mobil"
            value={color}
            placeholder="Contoh: Hitam"
            autoCapitalize="words"
            onChange={(event) => setColor(event.currentTarget.value)}
          />
          <Input
            label="Tahun Kendaraan (Opsional)"
            value={year}
            inputMode="numeric"
            maxLength={4}
            placeholder="Contoh: 2022"
            error={yearError || undefined}
            onChange={(event) => setYear(event.currentTarget.value.replace(/[^0-9]/g, ''))}
          />
        </div>

        <div className="mt-auto pt-10">
          <Button size="lg" disabled={!canContinue} onClick={handleContinue}>
            Lanjutkan
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
