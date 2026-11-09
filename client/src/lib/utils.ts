import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer paise into standard Indian Rupee format
 * e.g., 15000000 -> ₹1,50,000.00
 */
export function formatINR(paise: number = 0, options: { includeDecimals?: boolean; compact?: boolean } = {}): string {
  const { includeDecimals = true, compact = false } = options;
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise || 0));
  const rupees = absPaise / 100;

  if (compact) {
    if (rupees >= 10000000) {
      const cr = (rupees / 10000000).toFixed(2);
      return `${isNegative ? '-' : ''}₹${cr} Cr`;
    }
    if (rupees >= 100000) {
      const lakh = (rupees / 100000).toFixed(2);
      return `${isNegative ? '-' : ''}₹${lakh} L`;
    }
  }

  const integerPart = Math.floor(rupees);
  const remainderPaise = absPaise % 100;
  const decimalsStr = remainderPaise.toString().padStart(2, '0');

  const intStr = integerPart.toString();
  let formattedInt = '';

  if (intStr.length <= 3) {
    formattedInt = intStr;
  } else {
    const lastThree = intStr.substring(intStr.length - 3);
    const rest = intStr.substring(0, intStr.length - 3);
    const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${withCommas},${lastThree}`;
  }

  const result = includeDecimals ? `${formattedInt}.${decimalsStr}` : formattedInt;
  return `${isNegative ? '-' : ''}₹${result}`;
}

export function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleanStr = rupees.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }
  return Math.round((rupees || 0) * 100);
}

export function paiseToRupees(paise: number): number {
  return Math.round(paise || 0) / 100;
}
