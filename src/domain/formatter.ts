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
 *
 * ## Why the compact-notation layer exists
 *
 * `Number.prototype.toFixed()` silently switches to **exponential notation** once
 * the value reaches 1e21 — `(1e21).toFixed(2) === '1e+21'`, not a long string of
 * digits. That is not a rounding problem, it is a representation change, and it
 * used to leak a 21-character string such as `9.999999999999985e+89` into a
 * metric tile that is only ~90px wide, where it was clipped into garbage.
 *
 * Every formatter here therefore funnels magnitudes through {@link abbreviate},
 * which guarantees a **bounded output length** regardless of the input:
 *
 *   | magnitude          | output shape        | max width |
 *   | ------------------ | ------------------- | --------- |
 *   | < 1e7              | `1234.56` / `$1531` | 9 chars   |
 *   | 1e7 … < 1e15       | `12.3M` … `999.0T`  | 6 chars   |
 *   | >= 1e15            | `1.0e+45`           | 7 chars   |
 */

/** Rendered in place of a value that cannot be computed. */
export const PLACEHOLDER = '--';

/** Below this magnitude nothing is abbreviated — everyday numbers stay exact. */
const ABBREVIATE_FROM = 1e7;

/** Above this magnitude the suffixes run out and scientific notation takes over. */
const SCIENTIFIC_FROM = 1e15;

const SUFFIXES = ['', 'K', 'M', 'B', 'T'] as const;

const isUsable = (value: number): boolean => Number.isFinite(value);

/**
 * Shorten a large magnitude to a fixed-width-ish string.
 * Output is never longer than 7 characters, so it cannot overflow a tile.
 */
function abbreviate(value: number): string {
  const abs = Math.abs(value);

  if (abs < ABBREVIATE_FROM) return value.toFixed(2);

  if (abs < SCIENTIFIC_FROM) {
    const tier = Math.min(Math.floor(Math.log10(abs) / 3), SUFFIXES.length - 1);
    // Each suffix step is three decimal orders: K = 1e3, M = 1e6, B = 1e9, T = 1e12.
    const scaled = value / 10 ** (tier * 3);
    const magnitude = Math.abs(scaled);
    const decimals = magnitude < 10 ? 2 : magnitude < 100 ? 1 : 0;
    return `${scaled.toFixed(decimals)}${SUFFIXES[tier]}`;
  }

  // Past `999.9T` there is no honest suffix left; keep it short instead.
  return value.toExponential(1);
}

/** `0.16 → "16.00%"` */
export function formatPercent(value: number, decimals = 2): string {
  if (!isUsable(value)) return PLACEHOLDER;
  // `value` is a ratio; the displayed percentage is `value * 100`, so the
  // abbreviation threshold has to be applied to that, not to the ratio.
  const percent = value * 100;
  if (Math.abs(percent) >= ABBREVIATE_FROM) return `${abbreviate(percent)}%`;
  return `${percent.toFixed(decimals)}%`;
}

/** `-20.92257 → "-20.92%"`, `18.45 → "+18.45%"` */
export function formatSignedPercent(value: number, decimals = 2): string {
  if (!isUsable(value)) return PLACEHOLDER;
  const sign = value > 0 ? '+' : '';
  if (Math.abs(value) >= ABBREVIATE_FROM) return `${sign}${abbreviate(value)}%`;
  return `${sign}${value.toFixed(decimals)}%`;
}

/** `1531.25 → "$1531"` */
export function formatMoney(value: number): string {
  if (!isUsable(value)) return PLACEHOLDER;
  if (Math.abs(value) >= ABBREVIATE_FROM) return `$${abbreviate(value)}`;
  return `$${Math.round(value)}`;
}

/** Same as {@link formatMoney} but always shows an explicit sign. */
export function formatSignedMoney(value: number): string {
  if (!isUsable(value)) return PLACEHOLDER;
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatMoney(Math.abs(value))}`;
}

/** `31.25 → "31.25"`, `9.9e45 → "9.9e+45"` */
export function formatCount(value: number, decimals = 2): string {
  if (!isUsable(value)) return PLACEHOLDER;
  if (Math.abs(value) >= ABBREVIATE_FROM) return abbreviate(value);
  return value.toFixed(decimals);
}

/** Semantic tone of a numeric value, used to pick a colour class. */
export type Tone = 'positive' | 'negative' | 'neutral';

export function toneOf(value: number): Tone {
  if (!isUsable(value) || value === 0) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}
