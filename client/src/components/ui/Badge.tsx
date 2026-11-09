import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border';

  const variants = {
    success: 'bg-status-success-bg text-status-success border-status-success-border',
    warning: 'bg-status-warning-bg text-status-warning border-status-warning-border',
    danger: 'bg-status-danger-bg text-status-danger border-status-danger-border',
    info: 'bg-status-info-bg text-status-info border-status-info-border',
    neutral: 'bg-surface-muted text-text-secondary border-border',
    brand: 'bg-primary-light text-primary border-primary/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] tracking-wide uppercase',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
