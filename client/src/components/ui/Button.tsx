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
        'bg-industrial text-parchment hover:bg-industrial-light border border-olive/40 focus-visible:ring-copper shadow-subtle active:scale-[0.99]',
      secondary:
        'bg-copper text-parchment hover:bg-copper-hover border border-copper/80 focus-visible:ring-copper shadow-copper active:scale-[0.99]',
      outline:
        'border border-olive/50 bg-forest text-parchment hover:bg-industrial hover:border-limestone/50 focus-visible:ring-copper active:scale-[0.99]',
      ghost:
        'text-limestone hover:bg-industrial/80 hover:text-parchment focus-visible:ring-copper',
      danger:
        'bg-copper-muted text-parchment hover:bg-copper border border-copper/60 focus-visible:ring-copper shadow-subtle active:scale-[0.99]',
      subtle:
        'bg-industrial/60 text-limestone hover:bg-industrial hover:text-parchment border border-olive/30 focus-visible:ring-copper',
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

