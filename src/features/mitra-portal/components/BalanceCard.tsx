function rupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

const CIRCLE_CLASS =
  'grid size-11 place-items-center rounded-full bg-white shadow-[0_4px_10px_rgba(15,23,42,0.14),inset_0_-2px_4px_rgba(15,23,42,0.05)]';

/** Kartu saldo di Home mitra (label + nominal + aksi cepat), sesuai desain Figma. */
export function BalanceCard({ amount, onWithdraw }: { amount: number; onWithdraw?: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_14px_35px_-15px_rgba(15,23,42,0.3)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-12 text-neutral-500">Current Balance</p>
          <p className="mt-1 text-[19px] font-bold text-[#FF725E]">{rupiah(amount)}</p>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <span className={CIRCLE_CLASS} aria-hidden>
            <img src="/assets/mitra/towing/bal-truck.svg" alt="" className="h-5 w-auto" />
          </span>
          <button
            type="button"
            onClick={onWithdraw}
            aria-label="Tarik saldo"
            className={`${CIRCLE_CLASS} transition active:scale-95`}
          >
            <img src="/assets/mitra/towing/bal-arrows.svg" alt="" className="h-4.5 w-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
