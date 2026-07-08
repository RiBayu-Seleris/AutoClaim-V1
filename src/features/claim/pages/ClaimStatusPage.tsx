import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Clock, FileText, ShieldCheck, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { EmptyState } from '@/components/feedback/StateViews';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { STORAGE_KEYS } from '@/config/constants';
import { storage } from '@/lib/storage/storage';
import { ROUTES } from '@/app/routes';
import { claimStatusLabel, type Claim } from '../api';
import { useClaimDraftStore } from '../store/claimDraftStore';
import { useDamageStore } from '@/features/damage/store/damageStore';

const STEPS = [
  { key: 'PENDING_REVIEW', label: 'Klaim diajukan' },
  { key: 'UNDER_REVIEW', label: 'Sedang ditinjau' },
  { key: 'APPROVED', label: 'Keputusan klaim' },
];

const AUTO_DECISION_LABEL: Record<string, string> = {
  AUTO_APPROVAL_DISABLED: 'Klaim perlu ditinjau oleh pihak asuransi.',
  AUTO_APPROVAL_RULE_INCOMPLETE: 'Klaim perlu ditinjau oleh pihak asuransi.',
  POLICY_REQUIRED: 'Polis perlu diverifikasi sebelum klaim diputuskan.',
  POLICY_NOT_ACTIVE: 'Status polis perlu diverifikasi oleh pihak asuransi.',
  INCIDENT_OUTSIDE_POLICY_PERIOD: 'Tanggal kejadian perlu diverifikasi.',
  INFERENCE_REQUIRED: 'Hasil analisis kerusakan belum tersedia.',
  INFERENCE_NOT_FOUND: 'Hasil analisis kerusakan tidak ditemukan.',
  INFERENCE_INCOMPLETE: 'Hasil analisis kerusakan perlu dilengkapi.',
  INFERENCE_UNAVAILABLE: 'Evaluasi otomatis belum tersedia.',
  TOTAL_DAMAGE_EXCEEDS_BENEFIT: 'Kerusakan total melewati batas auto approve.',
  SIDE_DAMAGE_EXCEEDS_BENEFIT: 'Kerusakan pada salah satu sisi melewati batas auto approve.',
  ESTIMATED_COST_EXCEEDS_BENEFIT: 'Estimasi biaya melewati batas auto approve.',
  ESTIMATED_COST_EXCEEDS_POLICY_LIMIT: 'Estimasi biaya melewati limit polis.',
  ENGINE_NUMBER_REQUIRED: 'Nomor mesin perlu diverifikasi oleh pihak asuransi.',
  ENGINE_NUMBER_MISMATCH: 'Nomor mesin tidak cocok dengan data polis.',
  CHASSIS_NUMBER_REQUIRED: 'Nomor rangka/VIN perlu diverifikasi oleh pihak asuransi.',
  CHASSIS_NUMBER_MISMATCH: 'Nomor rangka/VIN tidak cocok dengan data polis.',
};

function statusTone(status: string): BadgeProps['tone'] {
  if (status === 'APPROVED' || status === 'COMPLETED') return 'green';
  if (status === 'REJECTED') return 'red';
  return 'yellow';
}

function stepIndex(status: string): number {
  if (status === 'PENDING_REVIEW' || status === 'SUBMITTED') return 0;
  if (status === 'UNDER_REVIEW' || status === 'IN_REVIEW') return 1;
  return 2; // APPROVED / REJECTED / COMPLETED
}

export function ClaimStatusPage() {
  const navigate = useNavigate();
  const locationClaim = useLocation().state as Claim | null;
  const submittedClaim = useClaimDraftStore((state) => state.submittedClaim);
  const setFlowMode = useDamageStore((state) => state.setFlowMode);
  const claim = locationClaim ?? submittedClaim;

  if (!claim) {
    return (
      <PageContainer>
        <AppHeader title="Status Klaim" />
        <EmptyState
          title="Klaim tidak ditemukan"
          action={
            <Button fullWidth={false} onClick={() => navigate(ROUTES.claims)}>
              Lihat Klaim
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const active = stepIndex(claim.status);
  const isRejected = claim.status === 'REJECTED';
  const isApproved = claim.status === 'APPROVED' || claim.status === 'COMPLETED';
  const settlementPayload = JSON.stringify({
    claim_number: claim.settlementPass.claimNumber || claim.claimNumber,
    repair_covered: claim.settlementPass.repairCovered,
    towing_covered: claim.settlementPass.towingCovered,
    coverage_type: claim.settlementPass.coverageType,
    customer_payable: claim.settlementPass.customerPayable,
  });

  return (
    <PageContainer>
      <AppHeader title="Status Klaim" />
      <div className="flex flex-1 flex-col px-5 py-5">
        <Card className="flex flex-col items-center gap-2 py-6 text-center">
          <FileText className="text-deep-blue-500 size-8" />
          <p className="text-12 text-neutral-700">{claim.claimNumber || 'Klaim'}</p>
          <Badge tone={statusTone(claim.status)}>{claimStatusLabel(claim.status)}</Badge>
        </Card>

        {/* Stepper */}
        <div className="mt-5">
          {STEPS.map((step, idx) => {
            const done = idx < active || (idx === active && isApproved);
            const current = idx === active && !isApproved && !isRejected;
            const failed = idx === 2 && isRejected;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex size-8 items-center justify-center rounded-full ${
                      failed
                        ? 'bg-danger text-white'
                        : done
                          ? 'bg-success text-white'
                          : current
                            ? 'bg-deep-blue-500 text-white'
                            : 'bg-neutral-400 text-neutral-700'
                    }`}
                  >
                    {failed ? (
                      <XCircle className="size-4" />
                    ) : done ? (
                      <Check className="size-4" />
                    ) : (
                      <Clock className="size-4" />
                    )}
                  </div>
                  {idx < STEPS.length - 1 && <div className="h-8 w-0.5 bg-neutral-400" />}
                </div>
                <div className="pb-6">
                  <p className="text-14 font-medium text-neutral-900">
                    {failed ? 'Klaim ditolak' : step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Card className="text-12 text-neutral-800">
          <Row label="Kendaraan" value={claim.vehiclePlate} />
          <Row label="Jenis klaim" value={claim.claimType} />
          <Row label="Tanggal kejadian" value={formatDate(claim.incidentDate)} />
          {claim.description && (
            <p className="mt-2 border-t border-neutral-300 pt-2 text-neutral-700">
              {claim.description}
            </p>
          )}
        </Card>

        {!isApproved && !isRejected && claim.autoApprovalEvaluated && (
          <Card className="border-warning/40 bg-warning/5 text-12 mt-4 text-neutral-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-warning mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold text-neutral-900">Klaim perlu ditinjau manual</p>
                <p className="mt-1 text-neutral-700">
                  Klaim Anda tidak bisa auto approve by sistem karena di luar ketentuan. Perlu
                  dilakukan peninjauan manual oleh asuransi dan memerlukan estimasi 3-5 hari kerja.
                </p>
              </div>
            </div>
            <p className="mt-3 border-t border-neutral-300 pt-3 text-neutral-700">
              {AUTO_DECISION_LABEL[claim.autoApprovalDecision] ||
                'Klaim sedang ditinjau oleh pihak asuransi.'}
            </p>
          </Card>
        )}

        {isApproved && (
          <Card className="mt-4 text-center">
            <p className="text-12 font-semibold text-neutral-900">Kode Klaim</p>
            <div className="mt-3 flex justify-center">
              <QRCodeSVG value={settlementPayload} size={112} marginSize={1} />
            </div>
            <p className="text-14 mt-3 font-bold tracking-wide text-neutral-900">
              {claim.claimNumber}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge tone={claim.settlementPass.repairCovered ? 'green' : 'yellow'}>
                Repair {claim.settlementPass.repairCovered ? 'covered' : 'partial'}
              </Badge>
              <Badge tone={claim.settlementPass.towingCovered ? 'green' : 'yellow'}>
                Towing {claim.settlementPass.towingCovered ? 'covered' : 'self pay'}
              </Badge>
            </div>
            {claim.settlementPass.customerPayable > 0 && (
              <p className="text-12 mt-3 text-neutral-700">
                Sisa estimasi pelanggan:{' '}
                <strong>{formatCurrency(claim.settlementPass.customerPayable)}</strong>
              </p>
            )}
          </Card>
        )}

        {isApproved && (
          <div className="mt-auto pt-6">
            <Button
              size="lg"
              leftIcon={<ShieldCheck className="size-5" />}
              onClick={() =>
                navigate(ROUTES.estimatedCost, {
                  state: {
                    claimNumber: claim.claimNumber,
                    fromApprovedClaim: true,
                    inferenceTicket: claim.inferenceTicket,
                  },
                })
              }
            >
              Lihat Estimasi Biaya
            </Button>
          </div>
        )}
        {!isApproved && !isRejected && (
          <div className="mt-auto pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setFlowMode('self_pay');
                if (claim.inferenceTicket) {
                  storage.setString(STORAGE_KEYS.guestInferenceTicket, claim.inferenceTicket);
                }
                navigate(ROUTES.damageAnalysis);
              }}
            >
              Lanjut Bayar Sendiri
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-neutral-700">{label}</span>
      <span className="font-medium text-neutral-900">{value || '-'}</span>
    </div>
  );
}
