import { describe, expect, it } from 'vitest';

import { calculate, sanitizeInputs, singleStagePassRate, stagePassRate } from '../src/domain/calculator';
import { DEFAULT_INPUTS, MIN_DAYS } from '../src/domain/constants';
import {
  PLACEHOLDER,
  formatCount,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  formatSignedPercent,
  toneOf,
} from '../src/domain/formatter';

/**
 * The reference numbers in this file are copied verbatim from the design spec.
 * If one of these breaks, either the maths regressed or the spec changed — both
 * are worth a failing test.
 */

describe('singleStagePassRate', () => {
  it('implements the gambler\u2019s ruin ratio D / (D + T)', () => {
    expect(singleStagePassRate(1000, 1500)).toBeCloseTo(0.4, 12);
    expect(singleStagePassRate(1000, 4000)).toBeCloseTo(0.2, 12);
    expect(singleStagePassRate(1000, 1000)).toBeCloseTo(0.5, 12);
  });

  it('returns 1 when there is nothing to climb', () => {
    expect(singleStagePassRate(1000, 0)).toBe(1);
  });

  it('degrades to 0 instead of NaN when the denominator is zero', () => {
    expect(singleStagePassRate(0, 0)).toBe(0);
    expect(Number.isNaN(singleStagePassRate(0, 0))).toBe(false);
  });

  it('is monotonically increasing in drawdown', () => {
    expect(singleStagePassRate(2000, 1000)).toBeGreaterThan(singleStagePassRate(1000, 1000));
  });
});

describe('stagePassRate', () => {
  it('compounds the single-stage rate over N days', () => {
    expect(stagePassRate(1000, 1500, 2)).toBeCloseTo(0.16, 12);
    expect(stagePassRate(1000, 4000, 1)).toBeCloseTo(0.2, 12);
  });

  it('clamps days to the documented minimum', () => {
    expect(stagePassRate(1000, 1500, 0)).toBeCloseTo(stagePassRate(1000, 1500, MIN_DAYS), 12);
    expect(stagePassRate(1000, 1500, -5)).toBeCloseTo(stagePassRate(1000, 1500, MIN_DAYS), 12);
  });

  it('never exceeds 1', () => {
    expect(stagePassRate(5000, 0, 3)).toBeLessThanOrEqual(1);
  });
});

describe('calculate() — reference scenario', () => {
  const result = calculate({ ...DEFAULT_INPUTS });

  it('matches every number in the spec', () => {
    expect(result.examPassRate).toBeCloseTo(0.16, 12);
    expect(result.payoutPassRate).toBeCloseTo(0.2, 12);
    expect(result.totalPassRate).toBeCloseTo(0.032, 12);

    expect(result.accountsToBuy).toBeCloseTo(31.25, 9);
    expect(result.fundedAccounts).toBeCloseTo(5, 9);

    expect(result.accountCost).toBeCloseTo(1531.25, 9);
    expect(result.activationCost).toBeCloseTo(745, 9);
    expect(result.totalCost).toBeCloseTo(2276.25, 9);

    expect(result.roi).toBeCloseTo(-20.92257, 4);
    expect(result.netProfit).toBeCloseTo(-476.25, 9);
    expect(result.isViable).toBe(true);
  });

  it('renders exactly the strings shown in the design', () => {
    expect(formatPercent(result.examPassRate, 2)).toBe('16.00%');
    expect(formatPercent(result.payoutPassRate, 2)).toBe('20.00%');
    expect(formatPercent(result.totalPassRate, 4)).toBe('3.2000%');
    expect(formatCount(result.accountsToBuy, 2)).toBe('31.25');
    expect(formatCount(result.fundedAccounts, 2)).toBe('5.00');
    expect(formatMoney(result.accountCost)).toBe('$1531');
    expect(formatMoney(result.activationCost)).toBe('$745');
    expect(formatMoney(result.totalCost)).toBe('$2276');
    expect(formatSignedPercent(result.roi, 2)).toBe('-20.92%');
    expect(formatMoney(result.inputs.actualPayout)).toBe('$1800');
  });

  it('satisfies the identity N_funded = N_buy × P_exam', () => {
    expect(result.fundedAccounts).toBeCloseTo(result.accountsToBuy * result.examPassRate, 6);
  });
});

describe('calculate() — edge cases', () => {
  it('flags a zero-denominator scenario as non-viable without producing NaN', () => {
    const result = calculate({
      ...DEFAULT_INPUTS,
      examDrawdown: 0,
      examTarget: 0,
      payoutDrawdown: 0,
      payoutTarget: 0,
    });

    expect(result.isViable).toBe(false);
    expect(result.totalPassRate).toBe(0);
    expect(result.accountsToBuy).toBe(0);
    expect(Number.isFinite(result.totalCost)).toBe(true);
    expect(Number.isFinite(result.roi)).toBe(true);
  });

  it('treats a zero profit target as a certain pass', () => {
    const result = calculate({ ...DEFAULT_INPUTS, examTarget: 0, payoutTarget: 0 });
    expect(result.examPassRate).toBe(1);
    expect(result.payoutPassRate).toBe(1);
    expect(result.totalPassRate).toBe(1);
    expect(result.accountsToBuy).toBeCloseTo(1, 9);
  });

  it('reports non-viable when there is no cost at all (ROI undefined)', () => {
    const result = calculate({
      ...DEFAULT_INPUTS,
      costPerAccount: 0,
      activationFee: 0,
      examTarget: 0,
      payoutTarget: 0,
    });
    expect(result.totalCost).toBe(0);
    expect(result.roi).toBe(0);
    expect(result.isViable).toBe(false);
  });

  it('is monotonic: more drawdown room means fewer accounts to buy', () => {
    const tight = calculate({ ...DEFAULT_INPUTS, examDrawdown: 500 });
    const loose = calculate({ ...DEFAULT_INPUTS, examDrawdown: 2000 });
    expect(loose.accountsToBuy).toBeLessThan(tight.accountsToBuy);
  });

  it('is monotonic: a bigger payout improves ROI', () => {
    const small = calculate({ ...DEFAULT_INPUTS, actualPayout: 1800 });
    const large = calculate({ ...DEFAULT_INPUTS, actualPayout: 9000 });
    expect(large.roi).toBeGreaterThan(small.roi);
  });

  it('never returns NaN for any field, however absurd the input', () => {
    const result = calculate({
      ...DEFAULT_INPUTS,
      examDays: Number.POSITIVE_INFINITY,
      payoutDays: Number.NaN,
      actualPayout: -100,
    });
    for (const value of Object.values(result)) {
      if (typeof value === 'number') expect(Number.isNaN(value)).toBe(false);
    }
  });
});

describe('sanitizeInputs()', () => {
  it('falls back to the documented defaults for missing fields', () => {
    expect(sanitizeInputs({})).toEqual({ ...DEFAULT_INPUTS });
  });

  it('clamps negatives to zero', () => {
    expect(sanitizeInputs({ costPerAccount: -5 }).costPerAccount).toBe(0);
    expect(sanitizeInputs({ actualPayout: -1 }).actualPayout).toBe(0);
  });

  it('raises day counts to the minimum', () => {
    expect(sanitizeInputs({ examDays: 0 }).examDays).toBe(MIN_DAYS);
    expect(sanitizeInputs({ payoutDays: -3 }).payoutDays).toBe(MIN_DAYS);
  });

  it('coerces numeric strings coming from the DOM', () => {
    expect(sanitizeInputs({ examTarget: '2500' }).examTarget).toBe(2500);
  });

  it('turns unparseable values into 0 rather than NaN', () => {
    expect(sanitizeInputs({ examTarget: 'abc' }).examTarget).toBe(0);
    expect(sanitizeInputs({ examTarget: null }).examTarget).toBe(DEFAULT_INPUTS.examTarget);
  });
});

describe('formatter', () => {
  it('formats percentages with the documented precision', () => {
    expect(formatPercent(0.16, 2)).toBe('16.00%');
    expect(formatPercent(0.032, 4)).toBe('3.2000%');
    expect(formatPercent(0.0000123, 4)).toBe('0.0012%');
  });

  it('signs positive ROI but not negative ROI', () => {
    expect(formatSignedPercent(18.45, 2)).toBe('+18.45%');
    expect(formatSignedPercent(-20.92257, 2)).toBe('-20.92%');
    expect(formatSignedPercent(0, 2)).toBe('0.00%');
  });

  it('rounds money to whole dollars without thousands separators', () => {
    expect(formatMoney(1531.25)).toBe('$1531');
    expect(formatMoney(2276.25)).toBe('$2276');
    expect(formatMoney(0)).toBe('$0');
  });

  it('signs money explicitly', () => {
    expect(formatSignedMoney(476.25)).toBe('+$476');
    expect(formatSignedMoney(-476.25)).toBe('-$476');
  });

  it('degrades non-finite values to the placeholder', () => {
    expect(formatPercent(Number.NaN, 2)).toBe(PLACEHOLDER);
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe(PLACEHOLDER);
    expect(formatCount(Number.NaN)).toBe(PLACEHOLDER);
    expect(formatSignedPercent(Number.NaN)).toBe(PLACEHOLDER);
  });

  /**
   * Regression guard for the "exponential notation leaks into the UI" defect.
   *
   * `Number.prototype.toFixed()` silently switches to exponential form at 1e21,
   * so `(1e21).toFixed(2)` is the 6-character string `"1e+21"`, and the naive
   * implementation emitted 21-character monsters such as
   * `9.999999999999985e+89` into metric tiles that are only ~90px wide.
   */
  describe('never emits an unbounded string', () => {
    // Longest legitimate output is `999.0T` (6) or `1.0e+45` (7); `1e300` needs 8.
    const MAX_WIDTH = 8;

    const cases = [1e7, 1e9, 1e12, 9.99e14, 1e15, 1e21, 9.999999999999993e44, 1e300];

    it.each(cases)('formatCount(%p) stays within a fixed width', (value) => {
      expect(formatCount(value, 2).length).toBeLessThanOrEqual(MAX_WIDTH);
    });

    it.each(cases)('formatMoney(%p) stays within a fixed width', (value) => {
      expect(formatMoney(value).length).toBeLessThanOrEqual(MAX_WIDTH + 1); // + `$`
    });

    it('never leaks a long mantissa, which is what actually broke the tiles', () => {
      // The old implementation produced 21-character monsters like this.
      const monster = formatCount(9.999999999999993e44, 2);
      expect(monster).toBe('1.0e+45');
      expect(monster.length).toBeLessThanOrEqual(MAX_WIDTH);
      // General shape guard: one digit, a decimal point, one digit, then e±NN.
      expect(monster).toMatch(/^-?\d\.\de[+-]\d+$/i);
    });

    it('uses suffixes for the readable range', () => {
      expect(formatCount(1.2e6, 2)).toBe('1200000.00'); // still exact below 1e7
      expect(formatCount(1.2e7, 2)).toBe('12.0M'); // 12 < 100 -> 1 decimal
      expect(formatCount(1.2e9, 2)).toBe('1.20B'); // 1.2 < 10 -> 2 decimals
      expect(formatCount(4.9e12, 2)).toBe('4.90T');
      expect(formatCount(9.99e14, 2)).toBe('999T'); // >= 100 -> 0 decimals
    });

    it('keeps everyday money formatting byte-identical to the design', () => {
      // The abbreviation layer must not disturb the reference values.
      expect(formatMoney(1531.25)).toBe('$1531');
      expect(formatMoney(2276.25)).toBe('$2276');
      expect(formatMoney(745)).toBe('$745');
      expect(formatMoney(1800)).toBe('$1800');
    });

    it('abbreviates percentages on the percentage, not the ratio', () => {
      expect(formatPercent(0.16, 2)).toBe('16.00%'); // unaffected
      expect(formatPercent(1e7, 2)).toBe('1.00B%'); // 1e7 ratio == 1e9 percent
      expect(formatPercent(1e7, 2).length).toBeLessThanOrEqual(MAX_WIDTH + 1);
    });
  });

  it('classifies tone for the colour rules', () => {
    expect(toneOf(12.5)).toBe('positive');
    expect(toneOf(-0.01)).toBe('negative');
    expect(toneOf(0)).toBe('neutral');
    expect(toneOf(Number.NaN)).toBe('neutral');
  });
});
