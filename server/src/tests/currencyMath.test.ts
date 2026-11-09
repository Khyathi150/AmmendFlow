import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDirectCost,
  calculateEstimateTotals,
  formatINR,
  rupeesToPaise,
  paiseToRupees,
} from '../utils/currencyMath.js';

describe('Financial Engine & Minor Unit (Paise) Precision Math', () => {
  it('calculates direct cost in exact integer paise without floating point drift', () => {
    const items = [
      { quantity: 18, unitRatePaise: 4500000 }, // 18 * ₹45,000.00
      { quantity: 90.5, unitRatePaise: 550000 }, // 90.5 * ₹5,500.00
      { quantity: 3.25, unitRatePaise: 1200000 }, // 3.25 * ₹12,000.00
    ];

    const directCost = calculateDirectCost(items);
    // 18 * 4500000 = 81000000
    // 90.5 * 550000 = 49775000
    // 3.25 * 1200000 = 3900000
    // Sum = 134,675,000 paise = ₹ 13,46,750.00
    assert.equal(directCost, 134675000);
    assert.equal(Number.isInteger(directCost), true);
  });

  it('computes exact overhead, markup, and tax breakdown', () => {
    const directCost = 10000000; // ₹ 1,00,000.00 = 10,000,000 paise
    const overheadPct = 10;
    const markupPct = 15;
    const taxPct = 18;

    const totals = calculateEstimateTotals(directCost, overheadPct, markupPct, taxPct);

    // Direct Cost: 10,000,000 paise (₹ 1,00,000.00)
    assert.equal(totals.directCostPaise, 10000000);

    // Overhead (10%): 1,000,000 paise (₹ 10,000.00)
    assert.equal(totals.overheadPaise, 1000000);

    // Pre-Markup: 11,000,000 paise (₹ 1,10,000.00)
    assert.equal(totals.preMarkupPaise, 11000000);

    // Markup (15% of 11,000,000): 1,650,000 paise (₹ 16,500.00)
    assert.equal(totals.markupPaise, 1650000);

    // Taxable base: 12,650,000 paise (₹ 1,26,500.00)
    assert.equal(totals.taxablePaise, 12650000);

    // Tax GST (18% of 12,650,000): 2,277,000 paise (₹ 22,770.00)
    assert.equal(totals.taxPaise, 2277000);

    // Total Proposed: 14,927,000 paise (₹ 1,49,270.00)
    assert.equal(totals.totalProposedPaise, 14927000);
    assert.equal(Number.isInteger(totals.totalProposedPaise), true);
  });

  it('formats currency correctly according to the Indian numbering system', () => {
    // 1 Lakh (₹ 1,00,000.00)
    assert.equal(formatINR(10000000), '₹1,00,000.00');

    // 1 Crore (₹ 1,00,00,000.00)
    assert.equal(formatINR(1000000000), '₹1,00,00,000.00');

    // ₹ 18.50 Crores
    assert.equal(formatINR(18500000000), '₹18,50,00,000.00');

    // Compact mode
    assert.equal(formatINR(18500000000, { compact: true }), '₹18.50 Cr');
    assert.equal(formatINR(15000000, { compact: true }), '₹1.50 L');
  });

  it('converts correctly between standard Rupees and integer minor units', () => {
    assert.equal(rupeesToPaise(1500.5), 150050);
    assert.equal(rupeesToPaise('₹ 1,50,000.00'), 15000000);
    assert.equal(paiseToRupees(150050), 1500.5);
  });
});
