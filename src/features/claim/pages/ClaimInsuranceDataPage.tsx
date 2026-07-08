import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/feedback/StateViews';
import { ROUTES } from '@/app/routes';
import { getInsurancePolicies } from '@/features/insurance/api';
import { useScanStore } from '@/features/vehicle-scan/store/scanStore';

export function ClaimInsuranceDataPage() {
  const navigate = useNavigate();
  const coverage = useScanStore((state) => state.insuranceCoverage);
  const plate = useScanStore((state) => state.plate.number);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['insurance-policies'],
    queryFn: getInsurancePolicies,
  });

  const policy = useMemo(() => {
    const policies = data ?? [];
    return (
      policies.find((item) => item.policyNumber === coverage?.policyNumber) ??
      policies.find(
        (item) =>
          item.vehiclePlate.replace(/[^a-z0-9]/gi, '').toUpperCase() ===
          plate?.replace(/[^a-z0-9]/gi, '').toUpperCase(),
      )
    );
  }, [coverage?.policyNumber, data, plate]);

  const continueWithPolicy = () => {
    if (!policy) return;
    navigate(ROUTES.claimSelectPolicy);
  };

  return (
    <PageContainer>
      <AppHeader showLogo />
      <div className="flex flex-1 flex-col px-5 py-5">
        <div className="mb-6 text-center">
          <ShieldCheck className="text-deep-blue-500 mx-auto size-9" />
          <h1 className="text-20 mt-3 font-semibold text-neutral-900">Data Asuransi</h1>
          <p className="text-12 mt-2 text-neutral-700">
            Pastikan data perlindungan kendaraan Anda sudah benar.
          </p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : !policy ? (
          <EmptyState
            title="Polis tidak ditemukan"
            description="Data coverage plat tidak terhubung dengan polis akun Anda."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <Input label="Perusahaan Asuransi" value={policy.provider} readOnly />
            <Input label="Nama Pemegang Polis" value={policy.holderName} readOnly />
            <Input label="Nomor Polis" value={policy.policyNumber} readOnly />
            <Input label="Nomor Kendaraan" value={policy.vehiclePlate} readOnly />
          </div>
        )}

        <div className="mt-auto pt-8">
          <Button size="lg" disabled={!policy} onClick={continueWithPolicy}>
            Lanjutkan
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
