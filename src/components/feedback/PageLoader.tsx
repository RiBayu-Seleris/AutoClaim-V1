import { Spinner } from '@/components/ui/Spinner';

/** Fallback layar penuh saat potongan rute (lazy) sedang dimuat. */
export function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-200">
      <Spinner className="size-8" />
    </div>
  );
}
