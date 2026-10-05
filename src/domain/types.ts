/**
 * Domain types for the Prop Firm ROI model.
 *
 * The whole calculation core is deliberately DOM-free and side-effect-free so it
 * can be unit-tested, reused by the CLI/desktop shell, and reasoned about in
 * isolation from the UI.
 */

/** Every tunable input of the model. All monetary values are in USD. */
export interface CalculatorInputs {
  /** Cost of buying one evaluation (challenge) account. */
  costPerAccount: number;
  /** One-off activation fee charged when a challenge account is passed. */
  activationFee: number;
  /** Max drawdown allowed during the evaluation phase. */
  examDrawdown: number;
  /** Profit target that must be reached during the evaluation phase. */
  examTarget: number;
  /** Number of trading days the evaluation phase is compounded over. */
  examDays: number;
  /** Max drawdown allowed on the funded / payout phase. */
  payoutDrawdown: number;
  /** Profit target that must be reached before a payout can be requested. */
  payoutTarget: number;
  /** Number of trading days the payout phase is compounded over. */
  payoutDays: number;
  /** Cash actually received after the firm's profit split. */
  actualPayout: number;
}

/** Union of all input field names — used for generic iteration / binding. */
export type InputKey = keyof CalculatorInputs;

/** Ordered list of input keys, matching the visual order of the form. */
export const INPUT_KEYS: readonly InputKey[] = [
  'costPerAccount',
  'activationFee',
  'examDrawdown',
  'examTarget',
  'examDays',
  'payoutDrawdown',
  'payoutTarget',
  'payoutDays',
  'actualPayout',
] as const;

/** Everything the renderer needs, computed in one pass. */
export interface CalculatorResult {
  /** Echo of the (sanitised) inputs that produced this result. */
  inputs: CalculatorInputs;
  /** Probability of passing the evaluation phase, 0..1. */
  examPassRate: number;
  /** Probability of passing the payout phase, 0..1. */
  payoutPassRate: number;
  /** examPassRate × payoutPassRate, 0..1. */
  totalPassRate: number;
  /** Expected number of evaluation accounts to buy for one successful payout. */
  accountsToBuy: number;
  /** Expected number of accounts that reach the funded phase. */
  fundedAccounts: number;
  /** accountsToBuy × costPerAccount. */
  accountCost: number;
  /** fundedAccounts × activationFee. */
  activationCost: number;
  /** accountCost + activationCost. */
  totalCost: number;
  /** Return on investment as a percentage, e.g. -20.92. */
  roi: number;
  /** actualPayout − totalCost. */
  netProfit: number;
  /**
   * `false` when the inputs cannot produce a meaningful result
   * (a zero denominator), in which case the UI must render placeholder dashes
   * instead of `NaN` / `Infinity`.
   */
  isViable: boolean;
}

/** A saved scenario used by the comparison table. */
export interface SavedScenario {
  /** Stable id (crypto.randomUUID where available). */
  id: string;
  /** User-facing label. */
  name: string;
  /** Unix epoch milliseconds of creation. */
  createdAt: number;
  /** The inputs snapshot. */
  inputs: CalculatorInputs;
  /** Cached ROI so the table can render without recomputing. */
  roi: number;
  /** Cached total cost, same reason. */
  totalCost: number;
  /** Cached pass rate, same reason. */
  totalPassRate: number;
}
