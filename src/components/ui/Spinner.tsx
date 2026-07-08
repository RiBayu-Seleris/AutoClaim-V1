import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('text-deep-blue-500 size-6 animate-spin', className)} aria-hidden />
  );
}

/** Pembungkus full-area untuk status loading sebuah halaman. */
export function LoadingState({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-700">
      <Spinner className="size-8" />
      <p className="text-14">{label}</p>
    </div>
  );
}
