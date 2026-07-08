import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { AppHeader } from '@/components/layout/AppHeader';
import { LoadingState } from '@/components/ui/Spinner';
import { toast } from '@/components/feedback/toast';
import { extractErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { MitraShell } from '../components/MitraShell';
import { getMitraSaldo, type MitraSaldoResult } from '../financeApi';
import type { SaldoTx } from '../types';

function rupiah(value: number): string {
  return 'Rp ' + Math.abs(value).toLocaleString('id-ID');
}

type SaldoTab = 'semua' | 'pendapatan' | 'penarikan';

/** Laporan transaksi saldo mitra (sesuai desain "Laporan Transaksi"). */
export function SaldoPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SaldoTab>('semua');
  const [saldo, setSaldo] = useState<MitraSaldoResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMitraSaldo()
      .then((res) => {
        if (active) setSaldo(res);
      })
      .catch((error) => toast.error(extractErrorMessage(error, 'Gagal memuat saldo.')))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const list = useMemo(() => {
    const transactions = saldo?.transactions ?? [];
    if (tab === 'pendapatan') return transactions.filter((tx) => tx.amount >= 0);
    if (tab === 'penarikan') return transactions.filter((tx) => tx.amount < 0);
    return transactions;
  }, [tab, saldo]);

  return (
    <MitraShell>
      <AppHeader showLogo />

      {loading ? (
        <LoadingState label="Memuat saldo…" />
      ) : (
        <div className="px-5 py-4">
          {/* Hero saldo */}
          <div className="from-deep-blue-500 to-deep-blue-700 relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg">
            <p className="text-[11px] tracking-wide text-white/70">SISA SALDO ANDA</p>
            <p className="mt-1 text-3xl font-bold">{rupiah(saldo?.balance ?? 0)}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-wide">
                ACTIVE ACCOUNT
              </span>
              <button
                type="button"
                onClick={() => navigate(ROUTES.mitraTarikSaldo)}
                className="text-deep-blue-700 rounded-lg bg-white px-4 py-2 text-xs font-semibold"
              >
                Tarik Dana
              </button>
            </div>
            <CreditCard className="absolute -top-2 -right-3 size-24 text-white/10" strokeWidth={1} />
          </div>

          {/* Ringkasan pendapatan / penarikan */}
          <div className="mt-4 space-y-3">
            <SummaryRow
              icon={Truck}
              tint="bg-deep-blue-50 text-deep-blue-600"
              label="Pendapatan"
              value={rupiah(saldo?.income ?? 0)}
              valueClass="text-deep-blue-600"
            />
            <SummaryRow
              icon={CreditCard}
              tint="bg-danger/10 text-danger"
              label="Penarikan"
              value={rupiah(saldo?.withdraw ?? 0)}
              valueClass="text-danger"
            />
          </div>

          {/* Tab garis */}
          <div className="mt-5 flex gap-6 border-b border-neutral-200">
            <TabButton active={tab === 'semua'} onClick={() => setTab('semua')}>
              Semua
            </TabButton>
            <TabButton active={tab === 'pendapatan'} onClick={() => setTab('pendapatan')}>
              Pendapatan
            </TabButton>
            <TabButton active={tab === 'penarikan'} onClick={() => setTab('penarikan')}>
              Penarikan
            </TabButton>
          </div>

          <div className="mt-4 space-y-3">
            {list.map((tx) => (
              <TxCard key={tx.id} tx={tx} />
            ))}
          </div>

          <button
            type="button"
            className="text-deep-blue-500 text-12 mt-4 w-full text-center font-semibold"
          >
            Lihat Semua Riwayat ›
          </button>
        </div>
      )}
    </MitraShell>
  );
}

function SummaryRow({
  icon: Icon,
  tint,
  label,
  value,
  valueClass,
}: {
  icon: typeof Truck;
  tint: string;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', tint)}>
        <Icon className="size-5" />
      </span>
      <div className="flex-1">
        <p className="text-[11px] text-neutral-500">{label}</p>
        <p className={cn('text-16 font-bold', valueClass)}>{value}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-13 -mb-px border-b-2 pb-2.5 font-semibold transition',
        active ? 'border-danger text-danger' : 'border-transparent text-neutral-400',
      )}
    >
      {children}
    </button>
  );
}

function TxCard({ tx }: { tx: SaldoTx }) {
  const income = tx.amount >= 0;
  const Icon = income ? Truck : CreditCard;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl',
          income ? 'bg-deep-blue-50 text-deep-blue-600' : 'bg-danger/10 text-danger',
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-13 truncate font-semibold text-neutral-900">{tx.title}</p>
        <p className="text-[11px] text-neutral-500">{tx.date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('text-13 font-bold', income ? 'text-deep-blue-600' : 'text-danger')}>
          {income ? '+' : '-'}
          {rupiah(tx.amount)}
        </p>
        <span
          className={cn(
            'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold',
            tx.status === 'berhasil'
              ? 'bg-deep-blue-50 text-deep-blue-600'
              : 'bg-neutral-200 text-neutral-500',
          )}
        >
          {tx.status === 'berhasil' ? 'Berhasil' : 'Proses'}
        </span>
      </div>
    </div>
  );
}
