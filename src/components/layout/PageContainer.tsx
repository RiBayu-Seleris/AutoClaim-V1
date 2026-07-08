import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function PageContainer({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="min-h-dvh bg-[#FAFBFC]">
      <div
        className={cn(
          'relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-[#FBFCFF]',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}
