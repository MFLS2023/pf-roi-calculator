/**
 * Presentation-layer number formatting.
 *
 * Kept separate from the calculation core so that rounding rules can be unit
 * tested and changed without touching the maths.
 *
 * Rounding contract (matches the reference design pixel-for-pixel):
 *   • exam / payout pass rate ....... 2 decimals, e.g. `16.00%`
 *   • total pass rate ............... 4 decimals, e.g. `3.2000%`
 *   • ROI ........................... 2 decimals, signed, e.g. `-20.92%`
 *   • money ......................... rounded to whole dollars, `$1531`
 *   • account counts ................ 2 decimals, e.g. `31.25`
 *
 * Thousands separators are intentionally *not* used for money so that the
 * output stays byte-identical to the reference screenshots (`$1531`, not `$1,531`).
 */

/** Rendered in place of a value that cannot be computed. */
export const PLACEHOLDER = '--';

const isUsable = (value: number): boolean => Number.isFinite(value);

/** `0.16 → "16.00%"` */
export function formatPercent(value: number, decimals = 2): string {
  if (!isUsable(value)) return PLACEHOLDER;
  return `${(value * 100).toFixed(decimals)}%`;
}

/** `-20.92257 → "-20.92%"`, `18.45 → "+18.45%"` */
export function formatSignedPercent(value: number, decimals = 2): string {
  if (!isUsable(value)) return PLACEHOLDER;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** `1531.25 → "$1531"` */
export function formatMoney(value: number): string {
  if (!isUsable(value)) return PLACEHOLDER;
  return `$${Math.round(value)}`;
}

/** Same as {@link formatMoney} but always shows an explicit sign. */
export function formatSignedMoney(value: number): string {
  if (!isUsable(value)) return PLACEHOLDER;
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}$${Math.round(Math.abs(value))}`;
}

/** `31.25 → "31.25"` */
export function formatCount(value: number, decimals = 2): string {
  if (!isUsable(value)) return PLACEHOLDER;
  return value.toFixed(decimals);
}

/** Semantic tone of a numeric value, used to pick a colour class. */
export type Tone = 'positive' | 'negative' | 'neutral';

export function toneOf(value: number): Tone {
  if (!isUsable(value) || value === 0) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}
