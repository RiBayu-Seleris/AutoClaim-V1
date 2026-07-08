import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/feedback/toast';
import { ROUTES, buildPath } from '@/app/routes';
import { STORAGE_KEYS } from '@/config/constants';
import { extractErrorMessage } from '@/lib/api/client';
import { storage } from '@/lib/storage/storage';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useScanServices } from '@/features/vehicle-scan/services/scanServicesContext';
import { useScanStore } from '@/features/vehicle-scan/store/scanStore';
import { useDamageStore } from '../store/damageStore';
import { claimInferenceTicket, fetchDamageDetail } from '../api/damageApi';
import { RadialProgress } from '../components/RadialProgress';
import type { DamageItem, DamageResult, DamageSide } from '../types';
import Lock from '/assets/damage_analysis/red-lock.svg';

const SIDE_LABELS: Record<DamageSide, string> = {
  front: 'Depan',
  back: 'Belakang',
  left: 'Kiri',
  right: 'Kanan',
};

const FRAME_IMAGE: Record<DamageSide, string> = {
  front: '/assets/damage_analysis/frame-depan.png',
  back: '/assets/damage_analysis/frame-belakang.png',
  left: '/assets/damage_analysis/frame-kiri.png',
  right: '/assets/damage_analysis/frame-kanan.png',
};

const AI_REPORT_PRICE = 'Rp 20.000';
const DAMAGE_FREE_THRESHOLD = 0;

interface DamageAnalysisRouteState {
  source?: 'recent_activity';
}

function hasDamageBreakdown(result: DamageResult) {
  const sides = Object.values(result.repair.avgSeverityPerSide);
  const detail = Object.values(result.repair.detail);
  return sides.some((value) => value > 0) || detail.some((items) => items.length > 0);
}

function barClass(v: number): string {
  if (v <= 33) return 'bg-green-500';
  if (v <= 66) return 'bg-yellow-500';
  return 'bg-red-500';
}
function textClass(v: number): string {
  if (v <= 33) return 'text-green-500';
  if (v <= 66) return 'text-yellow-500';
  return 'text-red-500';
}

export function DamageAnalysisPage() {
  const navigate = useNavigate();
  const routeState = useLocation().state as DamageAnalysisRouteState | null;
  const services = useScanServices();
  const result = useDamageStore((s) => s.result);
  const setResult = useDamageStore((s) => s.setResult);
  const reportUnlocked = useDamageStore((s) => s.reportUnlocked);
  const flowMode = useDamageStore((s) => s.flowMode);
  const viewMode = useDamageStore((s) => s.viewMode);
  const setViewMode = useDamageStore((s) => s.setViewMode);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const plateNumber = useScanStore((s) => s.plate.number);
  const scanPurpose = useScanStore((s) => s.scanPurpose);
  const insuranceStatus = useScanStore((s) => s.insuranceStatus);
  const setInsurance = useScanStore((s) => s.setInsurance);
  const [selectedSide, setSelectedSide] = useState<DamageSide>('front');
  const [storedTicket, setStoredTicket] = useState(() =>
    storage.getString(STORAGE_KEYS.guestInferenceTicket),
  );
  const [claimedTicket, setClaimedTicket] = useState<string | null>(null);
  const [isRecoveringResult, setIsRecoveringResult] = useState(false);
  const isHistoryView = routeState?.source === 'recent_activity' || viewMode === 'history';

  useEffect(() => {
    if (routeState?.source === 'recent_activity' && viewMode !== 'history') {
      setViewMode('history');
    }
  }, [routeState?.source, setViewMode, viewMode]);

  useEffect(() => {
    if (!result) return;
    if (!plateNumber) {
      setInsurance('idle', null);
      return;
    }

    let active = true;
    setInsurance('checking', null);

    services.insuranceCheck
      .checkByPlate(plateNumber)
      .then((coverage) => {
        if (!active) return;
        setInsurance(coverage.insured ? 'insured' : 'not_insured', coverage);
      })
      .catch(() => {
        if (!active) return;
        setInsurance('error', null);
      });

    return () => {
      active = false;
    };
  }, [plateNumber, result, services, setInsurance]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const ticket = result?.ticket ?? storedTicket;
    if (!ticket || claimedTicket === ticket) return;

    let active = true;
    setIsRecoveringResult(true);
    void claimInferenceTicket(ticket)
      .then(() => fetchDamageDetail(ticket))
      .then((detail) => {
        if (!active) return;
        if (!result || hasDamageBreakdown(detail) || !hasDamageBreakdown(result)) {
          setResult(detail);
        }
        setStoredTicket(ticket);
        setClaimedTicket(ticket);
      })
      .catch((error) => {
        if (!active) return;
        storage.remove(STORAGE_KEYS.guestInferenceTicket);
        setStoredTicket(null);
        setClaimedTicket(ticket);
        toast.error(
          extractErrorMessage(error, 'Hasil analisis guest tidak bisa dikaitkan ke akun ini.'),
        );
        if (!result) navigate(ROUTES.home, { replace: true });
      })
      .finally(() => {
        if (active) setIsRecoveringResult(false);
      });

    return () => {
      active = false;
    };
  }, [claimedTicket, isAuthenticated, navigate, result, setResult, storedTicket]);

  // Halaman hasil bersifat terminal: tanpa hasil (mis. di-refresh / dibuka
  // langsung → store di memori kosong) tak ada yang ditampilkan. Alihkan ke
  // Beranda dengan toast singkat — lebih mulus daripada modal yang memaksa.
  useEffect(() => {
    if (result) return;
    if (isAuthenticated && storedTicket) return;
    toast.info('Hasil analisis tidak tersedia. Silakan cek kondisi kendaraan lagi.');
    navigate(ROUTES.home, { replace: true });
  }, [isAuthenticated, result, navigate, storedTicket]);

  if (!result) {
    // Sedang dialihkan ke Beranda atau memulihkan hasil by-ticket setelah login.
    return (
      <PageContainer>
        <AppHeader title="Hasil Kerusakan" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Spinner className="text-deep-blue-500 size-6" />
          {isAuthenticated && storedTicket && (
            <p className="text-12 text-neutral-700">
              {isRecoveringResult ? 'Memulihkan hasil analisis...' : 'Menyiapkan hasil analisis...'}
            </p>
          )}
        </div>
      </PageContainer>
    );
  }

  const { avgSeverityPerSide, detail, percentage } = result.repair;
  const sideDetails: DamageItem[] = detail[selectedSide] ?? [];
  const payLocked = isAuthenticated && !reportUnlocked;
  const damageFree = percentage <= DAMAGE_FREE_THRESHOLD;
  const emergencyInsuranceMode = scanPurpose === 'emergency_insurance';
  const showZeroDamageOffer = damageFree && insuranceStatus === 'not_insured';
  const hideDamageDetailForOffer =
    showZeroDamageOffer || (damageFree && ['idle', 'checking'].includes(insuranceStatus));

  const goLogin = () => navigate(buildPath.loginWithRedirect(ROUTES.damageAnalysis));
  const currentTicket = result?.ticket ?? storedTicket ?? '';
  const goPay = (
    redirectRoute: string = ROUTES.damageAnalysis,
    redirectState: Record<string, unknown> | undefined = isHistoryView
      ? { source: 'recent_activity' }
      : undefined,
  ) =>
    navigate(ROUTES.payment, {
      state: {
        payment_type: 'AI_REPORT',
        redirect_route: redirectRoute,
        redirect_state: redirectState,
        ticket: currentTicket,
      },
    });
  const goEstimate = () =>
    navigate(ROUTES.estimatedCost, {
      state: { selfPay: flowMode === 'self_pay', inferenceTicket: currentTicket },
    });
  const canOpenEstimate = reportUnlocked;

  return (
    <PageContainer>
      <AppHeader showLogo />

      <div className="relative flex-1 pb-8">
        {/* Judul */}
        <div className="flex items-center justify-center gap-3 py-5">
          <img src="/assets/damage_analysis/smart-car.png" alt="" className="w-7" />
          <div>
            <p className="text-14 font-semibold text-neutral-900">Hasil Kerusakan Pada Mobil</p>
            <p className="text-10 text-neutral-600">Total seluruh kerusakan pada mobil Anda</p>
          </div>
        </div>

        {/* Konten hasil — di-blur untuk guest */}
        <div className={isAuthenticated ? '' : 'pointer-events-none blur-[3px] select-none'}>
          {/* Gauge */}
          <div className="flex justify-center py-2">
            <div className="flex size-[300px] items-center justify-center rounded-full bg-white p-[30px] shadow-[0_4px_30px_0_#0000000d]">
              <RadialProgress value={percentage} className="relative size-full" />
            </div>
          </div>

          {emergencyInsuranceMode && !damageFree && (
            <div className="border-danger/30 bg-danger/10 mx-4 mb-4 rounded-lg border p-3 text-left">
              <p className="text-12 text-danger font-semibold">
                Pembelian asuransi belum bisa dilanjutkan karena hasil scan {percentage.toFixed(0)}%
                damage. Kendaraan harus 0% damage.
              </p>
            </div>
          )}

          <SideSeverityCards
            avgSeverityPerSide={avgSeverityPerSide}
            selectedSide={selectedSide}
            grid={damageFree}
            onSelect={setSelectedSide}
          />

          {showZeroDamageOffer && !isHistoryView && (
            <ZeroDamageInsuranceOffer onBuyInsurance={() => navigate(ROUTES.insuranceSearch)} />
          )}

          {/* Bagian detail — pay-lock untuk yang sudah login tapi belum bayar */}
          {!hideDamageDetailForOffer && (
            <div className="relative mt-4">
              {payLocked && <ReportUnlockPrompt onClick={() => goPay()} />}

              <div className={payLocked ? 'pointer-events-none blur-[3px] select-none' : ''}>
                {/* Frame sisi terpilih */}
                <div className="flex justify-center p-4">
                  <img
                    src={FRAME_IMAGE[selectedSide]}
                    alt={`Kerusakan bagian ${SIDE_LABELS[selectedSide]}`}
                    className="w-72"
                  />
                </div>

                {/* Daftar kerusakan */}
                <div className="space-y-3 px-4">
                  {sideDetails.length === 0 ? (
                    <p className="text-12 py-4 text-center text-neutral-600">
                      Tidak ada kerusakan terdeteksi pada bagian{' '}
                      {SIDE_LABELS[selectedSide].toLowerCase()}.
                    </p>
                  ) : (
                    sideDetails.map((item, index) => (
                      <button
                        key={`${item.position}-${index}`}
                        type="button"
                        onClick={() =>
                          navigate(ROUTES.detailDamage, {
                            state: isHistoryView ? { ...item, source: 'recent_activity' } : item,
                          })
                        }
                        className="flex w-full items-center gap-4 rounded-lg border border-neutral-300 bg-white p-4 text-left"
                      >
                        <img
                          src={item.damage_image}
                          alt="Kerusakan"
                          className="size-24 flex-shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h2 className="text-12 font-semibold text-neutral-800">
                            Kerusakan Bagian {index + 1}
                          </h2>
                          <p className={`text-10 ${textClass(item.severity_score)}`}>
                            {item.severity.toLowerCase()}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-neutral-400">
                              <div
                                className={`h-2 rounded-full ${barClass(item.severity_score)}`}
                                style={{ width: `${item.severity_score}%` }}
                              />
                            </div>
                            <span
                              className={`text-12 font-semibold ${textClass(item.severity_score)}`}
                            >
                              {item.severity_score.toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-10 mt-2 line-clamp-2 text-neutral-600">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estimasi biaya */}
          {!isHistoryView && !payLocked && !hideDamageDetailForOffer && (
            <div className="mt-6 px-4">
              <Button
                size="lg"
                disabled={!canOpenEstimate}
                onClick={() => {
                  if (canOpenEstimate) goEstimate();
                }}
              >
                {canOpenEstimate ? 'Estimasi Biaya Perbaikan' : 'Buka Detail Analisis Dulu'}
              </Button>
              {!canOpenEstimate && (
                <p className="text-10 mt-2 text-center text-neutral-600">
                  Buka detail analisis terlebih dahulu sebelum melihat estimasi biaya.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Overlay login untuk guest */}
        {!isAuthenticated && (
          <div className="absolute inset-x-0 top-[36%] z-50 px-5">
            <div className="flex flex-row gap-x-3 rounded-2xl bg-white px-4 py-5 shadow-[0_14px_35px_0_rgba(15,23,42,0.14)]">
              <div className="mt-3 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#4DCAFF] to-[#4EA3E0] p-2 text-white">
                <Info className="h-full w-full" />
              </div>
              <div className="flex min-w-0 flex-col items-start justify-center gap-y-3">
                <div className="flex h-auto w-full flex-col items-start justify-center gap-y-1">
                  <p className="text-[16px] font-bold text-neutral-900">Attention</p>
                  <p className="text-[12px] text-neutral-800">
                    Untuk melihat analisis kerusakan secara rinci, silakan login ke akun Anda.
                  </p>
                </div>
                <Button size="sm" className="rounded-md py-4" onClick={goLogin}>
                  <span className="text-[12px]">Login Sekarang</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showZeroDamageOffer && isAuthenticated && <BottomNav />}
    </PageContainer>
  );
}

function SideSeverityCards({
  avgSeverityPerSide,
  selectedSide,
  grid,
  onSelect,
}: {
  avgSeverityPerSide: Record<DamageSide, number>;
  selectedSide: DamageSide;
  grid: boolean;
  onSelect: (side: DamageSide) => void;
}) {
  const sides = Object.keys(avgSeverityPerSide) as DamageSide[];
  const wrapperClass = grid
    ? 'mt-5 grid grid-cols-2 gap-3 px-5'
    : 'no-scrollbar mt-5 flex gap-4 overflow-x-auto px-4';

  return (
    <div className={wrapperClass}>
      {sides.map((side) => {
        const value = avgSeverityPerSide[side];
        return (
          <button
            key={side}
            type="button"
            onClick={() => onSelect(side)}
            className={`rounded-lg border bg-white p-3 text-left shadow-sm ${
              grid ? 'min-w-0' : 'w-56 flex-shrink-0'
            } ${selectedSide === side ? 'border-deep-blue-500' : 'border-neutral-300'}`}
          >
            <p className="truncate text-center text-xs text-neutral-600">
              Total Kerusakan {SIDE_LABELS[side]}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-neutral-300">
                <div
                  className={`h-1.5 rounded-full ${barClass(value)}`}
                  style={{ width: `${Math.max(value, grid ? 45 : 0)}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${textClass(value)}`}>
                {value.toFixed(0)}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ReportUnlockPrompt({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <div className={`px-5 pb-4 ${className}`}>
      <div className="flex flex-row gap-4 p-2">
        <div className="flex h-auto w-auto shrink-0 items-center justify-center">
          <div className="flex size-[38px] items-center justify-center rounded-full bg-[#FFF2F4] text-[#E50032]">
            <img src={Lock} alt="" srcSet="" />
          </div>
        </div>
        <div className="h-auto w-full">
          <p className="text-[14px] leading-tight font-bold text-neutral-900">Buka Laporan!</p>
          <p className="mt-1 text-[10px] text-neutral-700">
            Untuk membuka laporan lengkap dan detail analisis, aktifkan akses penuh sekarang
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="bg-deep-blue-500 mt-5 flex h-[42px] w-full items-center justify-between rounded-md px-5 text-[12px] font-bold text-white"
      >
        <span>Buka Detail Analisis</span>
        <span>{AI_REPORT_PRICE}</span>
      </button>
    </div>
  );
}

function ZeroDamageInsuranceOffer({ onBuyInsurance }: { onBuyInsurance: () => void }) {
  return (
    <div className="mx-5 mt-6 pb-24">
      <img
        src="/assets/damage_analysis/insurance-banner.png"
        alt="AutoClaim klaim mudah, aman, dan terlindungi"
        className="w-full rounded-lg object-cover shadow-sm"
      />
      <Button size="lg" className="mt-5" onClick={onBuyInsurance}>
        Beli Asuransi
      </Button>
    </div>
  );
}
