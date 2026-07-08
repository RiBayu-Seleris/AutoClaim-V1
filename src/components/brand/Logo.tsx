import { cn } from '@/lib/utils/cn';

/** Wordmark AutoClaim memakai asset yang sama dengan webapp lama. */
export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src="/assets/auth/logo-autoclaim.png"
        alt={withText ? 'AutoClaim' : ''}
        className={cn(withText ? 'h-9 w-auto' : 'h-8 w-auto object-contain')}
      />
    </span>
  );
}
