/**
 * Currency & Precision Financial Arithmetic Utilities for AmendFlow
 * All monetary amounts are handled strictly in integer minor units (paise).
 * 1 Rupee (INR) = 100 paise.
 * Absolutely NO floating-point calculations for monetary totals.
 */

export interface CostItemInput {
  quantity: number;
  unitRatePaise: number;
}

export interface EstimateTotals {
  directCostPaise: number;
  overheadPct: number;
  overheadPaise: number;
  preMarkupPaise: number;
  markupPct: number;
  markupPaise: number;
  taxPct: number;
  taxablePaise: number;
  taxPaise: number;
  totalProposedPaise: number;
}

/**
 * Calculates total direct cost from line items.
 * Each line total = Math.round(quantity * unitRatePaise)
 */
export function calculateDirectCost(items: CostItemInput[]): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const r = Math.round(Number(item.unitRatePaise) || 0);
    return sum + Math.round(q * r);
  }, 0);
}

/**
 * Calculates complete estimate breakdown with overhead, profit markup, and tax.
 * All intermediate amounts are rounded to integer paise.
 */
export function calculateEstimateTotals(
  directCostPaise: number,
  overheadPct: number = 0,
  markupPct: number = 0,
  taxPct: number = 0
): EstimateTotals {
  const direct = Math.max(0, Math.round(directCostPaise));
  const overheadPercent = Math.max(0, Number(overheadPct) || 0);
  const markupPercent = Math.max(0, Number(markupPct) || 0);
  const taxPercent = Math.max(0, Number(taxPct) || 0);

  // Overhead = Direct Cost * Overhead %
  const overheadPaise = Math.round((direct * overheadPercent) / 100);

  // Pre-Markup Amount = Direct Cost + Overhead
  const preMarkupPaise = direct + overheadPaise;

  // Profit Markup = Pre-Markup * Markup %
  const markupPaise = Math.round((preMarkupPaise * markupPercent) / 100);

  // Taxable Base = Pre-Markup + Markup
  const taxablePaise = preMarkupPaise + markupPaise;

  // Tax = Taxable Base * Tax %
  const taxPaise = Math.round((taxablePaise * taxPercent) / 100);

  // Total Proposed Amount to Client
  const totalProposedPaise = taxablePaise + taxPaise;

  return {
    directCostPaise: direct,
    overheadPct: overheadPercent,
    overheadPaise,
    preMarkupPaise,
    markupPct: markupPercent,
    markupPaise,
    taxPct: taxPercent,
    taxablePaise,
    taxPaise,
    totalProposedPaise,
  };
}

/**
 * Converts integer paise into standard Indian Rupee currency format (e.g. ₹ 1,50,000.00 or ₹ 1.50 Cr)
 * Follows the Indian numbering system: [Crores, Lakhs, Thousands, Hundreds]
 */
export function formatINR(paise: number, options: { includeDecimals?: boolean; compact?: boolean } = {}): string {
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

  // Format integer part using Indian comma separation
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

/**
 * Converts standard Rupees number or string into integer paise.
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleanStr = rupees.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }
  return Math.round((rupees || 0) * 100);
}

/**
 * Converts integer paise to Rupees (number).
 */
export function paiseToRupees(paise: number): number {
  return (Math.round(paise || 0)) / 100;
}

