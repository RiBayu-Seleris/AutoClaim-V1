import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeTone = 'neutral' | 'blue' | 'green' | 'yellow' | 'red';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-300 text-neutral-800',
  blue: 'bg-deep-blue-50 text-deep-blue-600',
  green: 'bg-green-cust/15 text-green-cust',
  yellow: 'bg-warning/15 text-warning',
  red: 'bg-danger/15 text-danger',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'text-12 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium',
        TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    />
  );
}
