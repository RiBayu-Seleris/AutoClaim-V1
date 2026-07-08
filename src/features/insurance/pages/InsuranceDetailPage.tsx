import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/feedback/StateViews';
import { formatCurrency } from '@/lib/utils/format';
import { ROUTES } from '@/app/routes';
import type { InsuranceProduct } from '../api';

type InsuranceRouteState =
  | InsuranceProduct
  | { product?: InsuranceProduct; requiresDamageFreeScan?: boolean }
  | null;

function isInsuranceRouteWrapper(
  state: Exclude<InsuranceRouteState, null>,
): state is { product?: InsuranceProduct; requiresDamageFreeScan?: boolean } {
  return 'product' in state || 'requiresDamageFreeScan' in state;
}

function routeProduct(state: InsuranceRouteState): InsuranceProduct | null {
  if (!state) return null;
  if (isInsuranceRouteWrapper(state)) return state.product ?? null;
  return state;
}

function routeRequiresDamageFreeScan(state: InsuranceRouteState): boolean {
  return Boolean(state && 'requiresDamageFreeScan' in state && state.requiresDamageFreeScan);
}

export function InsuranceDetailPage() {
  const navigate = useNavigate();
  const state = useLocation().state as InsuranceRouteState;
  const product = routeProduct(state);
  const requiresDamageFreeScan = routeRequiresDamageFreeScan(state);

  if (!product) {
    return (
      <PageContainer>
        <AppHeader title="Detail Asuransi" />
        <EmptyState
          title="Produk tidak ditemukan"
          action={
            <Button fullWidth={false} onClick={() => navigate(ROUTES.insuranceSearch)}>
              Lihat Produk
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AppHeader title="Detail Asuransi" />
      <div className="flex flex-1 flex-col px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="bg-deep-blue-50 text-deep-blue-500 flex size-12 items-center justify-center rounded-lg">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-16 font-semibold text-neutral-900">{product.name}</h1>
            <p className="text-12 text-neutral-700">
              {product.provider} · {product.category}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card className="text-center">
            <p className="text-10 text-neutral-600">Premi / bulan</p>
            <p className="text-16 text-deep-blue-600 mt-1 font-bold">
              {formatCurrency(product.monthlyPremium)}
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-10 text-neutral-600">Limit Klaim</p>
            <p className="text-16 mt-1 font-bold text-neutral-900">
              {formatCurrency(product.claimLimit)}
            </p>
          </Card>
        </div>

        {product.description && (
          <p className="text-12 mt-4 leading-relaxed text-neutral-700">{product.description}</p>
        )}

        {product.benefits.length > 0 && (
          <>
            <h2 className="text-14 mt-5 mb-2 font-semibold text-neutral-900">Manfaat</h2>
            <ul className="flex flex-col gap-2">
              {product.benefits.map((b) => (
                <li key={b} className="text-12 flex items-start gap-2 text-neutral-800">
                  <Check className="text-success mt-0.5 size-4 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </>
        )}

        {product.terms.length > 0 && (
          <>
            <h2 className="text-14 mt-5 mb-2 font-semibold text-neutral-900">Syarat & Ketentuan</h2>
            <ul className="text-12 list-inside list-disc space-y-1 text-neutral-700">
              {product.terms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-auto pt-6">
          <Button
            size="lg"
            onClick={() =>
              navigate(ROUTES.insurancePurchase, {
                state: { product, requiresDamageFreeScan },
              })
            }
          >
            Beli Polis Ini
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
