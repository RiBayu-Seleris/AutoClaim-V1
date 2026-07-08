import { Truck, ArrowLeftRight } from 'lucide-react';

function rupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

/** Kartu saldo di Home mitra (label + nominal + aksi cepat). */
export function BalanceCard({ amount, onWithdraw }: { amount: number; onWithdraw?: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_14px_35px_-15px_rgba(15,23,42,0.3)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-10 text-neutral-600">Current Balance</p>
          <p className="mt-1 text-[18px] font-bold text-[#E11D48]">{rupiah(amount)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <span className="grid size-10 place-items-center rounded-full bg-[#E11D48]/10 text-[#E11D48]">
            <Truck className="size-5" />
          </span>
          <button
            type="button"
            onClick={onWithdraw}
            aria-label="Tarik saldo"
            className="text-deep-blue-600 grid size-10 place-items-center rounded-full bg-neutral-100 transition active:scale-95"
          >
            <ArrowLeftRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
