import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { MitraBottomNav } from './MitraBottomNav';

/**
 * Kerangka halaman portal mitra: kanvas mobile terpusat + bottom nav tetap.
 * `pb-24` memberi ruang agar konten tidak tertutup nav.
 */
export function MitraShell({
  children,
  className,
  hideNav = false,
}: {
  children: ReactNode;
  className?: string;
  /** Sembunyikan bottom nav untuk alur fokus (mis. sukses/konfirmasi). */
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-[#FAFBFC]">
      <div
        className={cn(
          'relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#FBFCFF]',
          hideNav ? 'pb-0' : 'pb-24',
          className,
        )}
      >
        {children}
        {!hideNav && <MitraBottomNav />}
      </div>
    </div>
  );
}
