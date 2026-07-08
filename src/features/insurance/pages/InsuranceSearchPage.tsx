import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/feedback/StateViews';
import { formatCurrency } from '@/lib/utils/format';
import { ROUTES } from '@/app/routes';
import { getInsuranceProducts } from '../api';

export function InsuranceSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requiresDamageFreeScan = Boolean(
    (location.state as { requiresDamageFreeScan?: boolean } | null)?.requiresDamageFreeScan,
  );
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['insurance-products'],
    queryFn: getInsuranceProducts,
  });

  return (
    <PageContainer>
      <AppHeader title="Asuransi Kendaraan" />
      <div className="flex-1 px-5 py-5">
        <p className="text-12 mb-3 text-neutral-700">
          Lindungi kendaraan Anda dengan produk asuransi rekanan.
        </p>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="size-7" />}
            title="Belum ada produk"
            description="Produk asuransi belum tersedia saat ini."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() =>
                  navigate(ROUTES.insuranceDetail, {
                    state: { product, requiresDamageFreeScan },
                  })
                }
              >
                <Card className="flex items-center gap-3">
                  <div className="bg-deep-blue-50 text-deep-blue-500 flex size-12 items-center justify-center rounded-lg">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-14 truncate font-semibold text-neutral-900">
                      {product.name}
                    </p>
                    <p className="text-12 text-neutral-700">{product.provider}</p>
                    <p className="text-12 text-deep-blue-600 mt-1 font-medium">
                      {formatCurrency(product.monthlyPremium)}/bln
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-neutral-600" />
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
