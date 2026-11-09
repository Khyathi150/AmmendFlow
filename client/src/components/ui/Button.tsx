import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-md select-none';

    const variants = {
      primary:
        'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary shadow-sm active:scale-[0.99]',
      secondary:
        'bg-secondary text-white hover:bg-secondary-hover focus-visible:ring-secondary shadow-sm active:scale-[0.99]',
      outline:
        'border border-border bg-surface text-text-primary hover:bg-surface-subtle hover:border-border-dark focus-visible:ring-primary active:scale-[0.99]',
      ghost:
        'text-text-primary hover:bg-surface-muted hover:text-text-primary focus-visible:ring-primary',
      danger:
        'bg-status-danger text-white hover:bg-red-700 focus-visible:ring-red-600 shadow-sm active:scale-[0.99]',
      subtle:
        'bg-secondary-light text-secondary hover:bg-teal-100 focus-visible:ring-secondary',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : LeftIcon ? (
          <LeftIcon className="w-4 h-4 shrink-0" />
        ) : null}
        <span>{children}</span>
        {!isLoading && RightIcon ? <RightIcon className="w-4 h-4 shrink-0" /> : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
