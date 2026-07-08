import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Kartu putih berjudul (ikon + judul) untuk blok informasi detail. */
export function LabeledCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm', className)}>
      <div className="flex items-center gap-2 text-neutral-900">
        <Icon className="text-deep-blue-500 size-4" />
        <h3 className="text-14 font-semibold">{title}</h3>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

/** Baris label–nilai di dalam kartu informasi. */
export function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-12 shrink-0 text-neutral-500">{label}</span>
      <span className={cn('text-12 text-right font-medium text-neutral-900', valueClassName)}>
        {value}
      </span>
    </div>
  );
}

/** Kartu statistik kecil (ikon + nilai + label) untuk header detail. */
export function StatTile({
  icon: Icon,
  value,
  label,
  iconClassName,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  iconClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-sm">
      <Icon className={cn('text-deep-blue-500 size-5', iconClassName)} />
      <span className="text-16 mt-1 font-bold text-neutral-900">{value}</span>
      <span className="text-[11px] text-neutral-500">{label}</span>
    </div>
  );
}
