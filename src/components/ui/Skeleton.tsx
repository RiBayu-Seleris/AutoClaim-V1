import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-neutral-400', className)} {...rest} />;
}
