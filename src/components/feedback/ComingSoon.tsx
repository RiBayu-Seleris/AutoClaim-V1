import { Hammer } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyState } from '@/components/feedback/StateViews';

/** Placeholder sementara untuk rute yang halamannya sedang dibangun. */
export function ComingSoon({ title = 'Segera hadir' }: { title?: string }) {
  return (
    <PageContainer>
      <AppHeader title={title} />
      <EmptyState
        icon={<Hammer className="size-7" />}
        title={title}
        description="Halaman ini sedang dalam pengembangan."
      />
    </PageContainer>
  );
}
