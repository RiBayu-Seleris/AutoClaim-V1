import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-deep-blue-500 text-white shadow-sm hover:bg-white hover:text-deep-blue-500 active:bg-deep-blue-600 active:text-white disabled:bg-deep-blue-300 disabled:shadow-none',
  secondary: 'border border-transparent bg-deep-blue-50 text-deep-blue-600 hover:bg-deep-blue-100',
  outline:
    'border border-deep-blue-500 bg-white text-deep-blue-500 hover:bg-deep-blue-50 active:bg-deep-blue-100',
  ghost: 'border border-transparent text-deep-blue-600 hover:bg-deep-blue-50',
  danger: 'border border-transparent bg-danger text-white hover:brightness-95 active:brightness-90',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-4 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = true,
    isLoading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.99]',
        'focus-visible:ring-deep-blue-300 focus-visible:ring-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-70',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});
