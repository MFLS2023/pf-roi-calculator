import { DEFAULT_INPUTS, MIN_DAYS } from './constants';
import type { CalculatorInputs, CalculatorResult, InputKey } from './types';
import { INPUT_KEYS } from './types';

/**
 * Single-stage pass probability under a zero-drift random walk
 * (the classic gambler's ruin result):
 *
 *     P = D / (D + T)
 *
 * where `D` is the drawdown that busts the account and `T` is the profit target.
 * Both distances are measured from the starting equity, so the ratio is simply
 * "how much room do I have below me vs. how far must I climb".
 *
 * @returns a probability in [0, 1], or `0` when the denominator degenerates.
 */
export function singleStagePassRate(drawdown: number, target: number): number {
  const denom = drawdown + target;
  if (!Number.isFinite(denom) || denom <= 0) return 0;
  const rate = drawdown / denom;
  if (!Number.isFinite(rate)) return 0;
  return Math.min(1, Math.max(0, rate));
}

/**
 * Compounded pass probability over `days` consecutive trading days:
 *
 *     P = (D / (D + T)) ^ N
 *
 * @param days clamped to at least {@link MIN_DAYS}.
 */
export function stagePassRate(drawdown: number, target: number, days: number): number {
  const n = Math.max(MIN_DAYS, Number.isFinite(days) ? days : MIN_DAYS);
  const single = singleStagePassRate(drawdown, target);
  const rate = Math.pow(single, n);
  return Number.isFinite(rate) ? rate : 0;
}

/** Coerce an arbitrary value into a finite, non-negative number. */
function toNonNegative(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

/**
 * Defensive normaliser applied to *any* untrusted input source
 * (DOM fields, localStorage, a preset file, an URL hash…).
 *
 * Guarantees: every field is a finite number, monetary values are >= 0,
 * and day counts are >= {@link MIN_DAYS}.
 */
export function sanitizeInputs(raw: Partial<Record<InputKey, unknown>>): CalculatorInputs {
  const out = {} as CalculatorInputs;
  for (const key of INPUT_KEYS) {
    const fallback = DEFAULT_INPUTS[key];
    const provided = raw[key];
    const value = provided === undefined || provided === null ? fallback : toNonNegative(provided);
    out[key] = key === 'examDays' || key === 'payoutDays' ? Math.max(MIN_DAYS, value) : value;
  }
  return out;
}

/**
 * The heart of the app. Pure, total, and never throws — degenerate input yields
 * `isViable: false` plus zeroed metrics rather than `NaN` / `Infinity`.
 */
export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const safe = sanitizeInputs(inputs);

  const examPassRate = stagePassRate(safe.examDrawdown, safe.examTarget, safe.examDays);
  const payoutPassRate = stagePassRate(safe.payoutDrawdown, safe.payoutTarget, safe.payoutDays);
  const totalPassRate = examPassRate * payoutPassRate;

  // Expectation of a geometric distribution: to obtain 1 success you must, on
  // average, attempt 1 / p times. N_funded = N_buy × P_exam ≡ 1 / P_payout.
  const accountsToBuy = totalPassRate > 0 ? 1 / totalPassRate : 0;
  const fundedAccounts = payoutPassRate > 0 ? 1 / payoutPassRate : 0;

  const accountCost = accountsToBuy * safe.costPerAccount;
  const activationCost = fundedAccounts * safe.activationFee;
  const totalCost = accountCost + activationCost;

  const netProfit = safe.actualPayout - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  const isViable =
    totalPassRate > 0 &&
    totalCost > 0 &&
    Number.isFinite(accountsToBuy) &&
    Number.isFinite(totalCost);

  return {
    inputs: safe,
    examPassRate,
    payoutPassRate,
    totalPassRate,
    accountsToBuy,
    fundedAccounts,
    accountCost,
    activationCost,
    totalCost,
    roi,
    netProfit,
    isViable,
  };
}
