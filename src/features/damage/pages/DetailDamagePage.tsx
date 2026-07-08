import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/StateViews';
import { ROUTES } from '@/app/routes';
import type { DamageItem } from '../types';
import { useDamageStore } from '../store/damageStore';

type DetailDamageRouteState = DamageItem & { source?: 'recent_activity' };

function severityClasses(v: number): { bar: string; text: string } {
  if (v <= 25) return { bar: 'bg-severity-blue', text: 'text-severity-blue' };
  if (v <= 50) return { bar: 'bg-severity-green', text: 'text-severity-green' };
  if (v <= 75) return { bar: 'bg-severity-yellow', text: 'text-severity-yellow' };
  return { bar: 'bg-severity-red', text: 'text-severity-red' };
}

export function DetailDamagePage() {
  const navigate = useNavigate();
  const item = useLocation().state as DetailDamageRouteState | null;
  const markDetailViewed = useDamageStore((state) => state.markDetailViewed);
  const flowMode = useDamageStore((state) => state.flowMode);
  const viewMode = useDamageStore((state) => state.viewMode);
  const isHistoryView = item?.source === 'recent_activity' || viewMode === 'history';

  useEffect(() => {
    if (item) markDetailViewed();
  }, [item, markDetailViewed]);

  if (!item) {
    return (
      <PageContainer>
        <AppHeader title="Detail Analisis" />
        <EmptyState
          title="Detail tidak tersedia"
          description="Pilih salah satu kerusakan dari halaman hasil."
          action={
            <Button fullWidth={false} onClick={() => navigate(ROUTES.damageAnalysis)}>
              Kembali ke Hasil
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const colors = severityClasses(item.severity_score);

  return (
    <PageContainer>
      <AppHeader title="Detail Analisis Kerusakan" />
      <div className="flex-1 px-5 py-5">
        <img
          src={item.damage_image}
          alt="Kerusakan"
          className="aspect-video w-full rounded-lg object-cover"
        />

        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-16 font-semibold text-neutral-900 capitalize">
            Bagian {item.position}
          </h1>
          <span className={`text-14 font-semibold ${colors.text}`}>{item.severity}</span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-2.5 flex-1 rounded-full bg-neutral-400">
            <div
              className={`h-2.5 rounded-full ${colors.bar}`}
              style={{ width: `${item.severity_score}%` }}
            />
          </div>
          <span className={`text-14 font-semibold ${colors.text}`}>
            {item.severity_score.toFixed(0)}%
          </span>
        </div>

        <h2 className="text-14 mt-6 font-semibold text-neutral-900">Deskripsi</h2>
        <p className="text-12 mt-2 leading-relaxed text-neutral-700">{item.description}</p>

        {!isHistoryView && (
          <div className="mt-8">
            <Button
              onClick={() =>
                navigate(ROUTES.estimatedCost, { state: { selfPay: flowMode === 'self_pay' } })
              }
            >
              Lihat Estimasi Biaya
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
