import React from 'react';
import { formatINR, cn } from '../../lib/utils';

export interface CurrencyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  paise: number;
  includeDecimals?: boolean;
  compact?: boolean;
  colorize?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  paise,
  includeDecimals = true,
  compact = false,
  colorize = false,
  className,
  ...props
}) => {
  const formatted = formatINR(paise, { includeDecimals, compact });

  const colorClass = colorize
    ? paise > 0
      ? 'text-status-success font-medium'
      : paise < 0
      ? 'text-status-danger font-medium'
      : 'text-text-primary'
    : 'text-text-primary';

  return (
    <span
      className={cn('font-mono tabular-nums tracking-tight font-medium', colorClass, className)}
      {...props}
    >
      {formatted}
    </span>
  );
};

