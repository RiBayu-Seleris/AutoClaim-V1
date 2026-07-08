import type { ReactNode } from 'react';
import { Inbox, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-neutral-300 text-neutral-600">
        {icon ?? <Inbox className="size-7" />}
      </div>
      <div>
        <p className="text-16 font-semibold text-neutral-900">{title}</p>
        {description && <p className="text-14 mt-1 text-neutral-700">{description}</p>}
      </div>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Gagal memuat data',
  description = 'Periksa koneksi Anda lalu coba lagi.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="bg-danger/10 text-danger flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="size-7" />
      </div>
      <div>
        <p className="text-16 font-semibold text-neutral-900">{title}</p>
        <p className="text-14 mt-1 text-neutral-700">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" fullWidth={false} onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
