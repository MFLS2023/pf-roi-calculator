import { DEFAULT_INPUTS } from '../core/constants';
import type { CalculatorInputs } from '../core/types';
import type { LocalizedText } from '../i18n/types';

/**
 * Community-maintained firm presets.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO ADD / UPDATE A PRESET (open a PR — it is a one-object change):
 *   1. Add an entry to `PRESETS` below.
 *   2. Fill `verifiedAt` with the month you checked the official page.
 *   3. Put the URL you verified against in `source`.
 *   4. Be honest in `confidence` and explain every derived number in `note`.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * DESIGN NOTE — why the mapping is not always 1:1
 * The model is a *single* evaluation phase plus a *single* payout phase, whereas
 * several firms run a 2-step evaluation. For those we approximate the two phases
 * by keeping the tighter phase's drawdown and setting `examDays = 2`, which
 * compounds the single-stage probability twice. Every approximation is spelled
 * out in the preset's `note` so nobody is misled by a clean-looking number.
 *
 * SECOND CAVEAT — what `days` really means
 * `P = (D/(D+T))^N` treats N as "the trader must independently clear the target
 * N times in a row". Real firms usually mean "you must trade on at least N days",
 * which is a *gate*, not a repeated trial. Setting N to a firm's minimum trading
 * days is therefore the pessimistic reading — and the honest one, since the model
 * has no other knob for it. Presets that are affected say so in their note, and
 * users are free to lower `days` to see the optimistic reading.
 */

/** How much we trust the numbers, given that firms change rules constantly. */
export type Confidence = 'high' | 'medium' | 'low';

export interface FirmPreset {
  /** Stable slug — also used as the `<option value>`. */
  id: string;
  /** Brand name; never translated. */
  firm: string;
  /** Nominal account size in USD, or `0` for the abstract reference example. */
  accountSize: number;
  /** Account flavour, e.g. "EOD drawdown" vs "intraday trailing". */
  variant: LocalizedText;
  market: 'futures' | 'forex';
  /** `YYYY-MM` of the last manual verification against the official source. */
  verifiedAt: string;
  /** Official page the numbers were read from, when available. */
  source?: string;
  confidence: Confidence;
  /** Plain-language caveats about how the firm's rules were mapped onto the model. */
  note: LocalizedText;
  inputs: CalculatorInputs;
}

/** The spec's reference example — always first in the list. */
export const REFERENCE_PRESET_ID = 'reference';

export const PRESETS: readonly FirmPreset[] = Object.freeze([
  {
    id: REFERENCE_PRESET_ID,
    firm: 'Reference',
    accountSize: 0,
    variant: { 'zh-CN': '规格书默认示例', en: 'Spec default example' },
    market: 'futures',
    verifiedAt: '2026-10',
    confidence: 'high',
    note: {
      'zh-CN': '抽象示例，不是任何一家机构的真实报价。适合先理解模型再换成真实参数。',
      en: 'An abstract example, not a real firm quote. Good for understanding the model first.',
    },
    inputs: { ...DEFAULT_INPUTS },
  },
  {
    id: 'apex-50k-eod',
    firm: 'Apex Trader Funding',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · EOD 日终回撤', en: '50K · EOD trailing drawdown' },
    market: 'futures',
    verifiedAt: '2026-09',
    source:
      'https://forexcalculator.pro/apex-trader-funding-rules-evaluation-payout-and-account-rules/',
    confidence: 'medium',
    note: {
      'zh-CN':
        '评估费 $249 为标价，Apex 常年有大幅促销，实际可能低至 $30 左右，请按你付款时的价格改。评估阶段无最低天数要求，故天数取模型下限 1。出金目标取「安全网 + $500 最低出金」≈ $2,600。⚠️ 出金阶段的「5 个合格交易日」在现实中是门槛，而本模型把它当作「连续 5 次独立达成目标」来复合计算，因此这一条会明显高估所需账号数，建议把出金天数改成 1 再看。',
      en: 'The $249 evaluation price is list price — Apex runs deep discounts, so edit it to what you actually paid. Apex sets no minimum trading days for the evaluation, so days fall back to the model floor of 1. The payout target is the safety-net plus the $500 minimum withdrawal ≈ $2,600. ⚠️ The "5 qualifying days" payout gate is treated by this model as five independent attempts at the target, which materially overstates the number of accounts you would need — try setting payout days to 1 as well.',
    },
    inputs: {
      costPerAccount: 249,
      activationFee: 59,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2600,
      payoutDays: 5,
      actualPayout: 2600,
    },
  },
  {
    id: 'topstep-50k-combine',
    firm: 'Topstep',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Trading Combine', en: '50K · Trading Combine' },
    market: 'futures',
    verifiedAt: '2026-10',
    confidence: 'low',
    note: {
      'zh-CN':
        'Topstep 按「月费」计费而非一次性买断，这里的 $49 是 50K 组合的月费。通过后没有激活费。获资账户没有固定利润目标，只有「5 个 $200+ 盈利日」才能出金，因此出金阶段的数字是常见首次出金的假设值，请按你的计划改。',
      en: 'Topstep bills monthly rather than selling a one-off evaluation; $49 is the 50K Combine monthly fee. There is no activation fee. The funded account has no fixed profit target — only a "5 winning days of $200+" gate before a withdrawal — so the payout-phase numbers are typical first-payout assumptions. Adjust them to your plan.',
    },
    inputs: {
      costPerAccount: 49,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 5,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 5,
      actualPayout: 1800,
    },
  },
  {
    id: 'ftmo-100k-1step',
    firm: 'FTMO',
    accountSize: 100000,
    variant: { 'zh-CN': '100K · 1-Step Challenge', en: '100K · 1-Step Challenge' },
    market: 'forex',
    verifiedAt: '2026-10',
    source: 'https://ftmo.com/en/trading-objectives/',
    confidence: 'medium',
    note: {
      'zh-CN':
        '评估阶段来自官网：利润目标 10%（$10,000）、最大亏损 10%（$10,000，日终追踪）。1-Step 没有最低交易天数要求，故天数取 1。获资账户本身没有利润目标，出金阶段的数字是「再赚 10% 后按 80% 分成提取」的假设，请按你的实际出金计划改。',
      en: 'The evaluation phase is taken from the official page: 10% profit target ($10,000) and 10% maximum loss ($10,000, end-of-day trailing). The 1-Step challenge sets no minimum trading days, so days fall back to 1. The funded account has no profit target of its own, so the payout phase assumes "grow another 10%, then withdraw at an 80% split" — adjust to your own withdrawal plan.',
    },
    inputs: {
      costPerAccount: 540,
      activationFee: 0,
      examDrawdown: 10000,
      examTarget: 10000,
      examDays: 1,
      payoutDrawdown: 10000,
      payoutTarget: 10000,
      payoutDays: 1,
      actualPayout: 8000,
    },
  },
  {
    id: 'fundednext-stellar-100k',
    firm: 'FundedNext',
    accountSize: 100000,
    variant: { 'zh-CN': '100K · Stellar 2-Step', en: '100K · Stellar 2-Step' },
    market: 'forex',
    verifiedAt: '2026-10',
    source:
      'https://proptradingarea.com/prop-trading-firm-challenges/funded-next/stellar-2-step-100k',
    confidence: 'low',
    note: {
      'zh-CN':
        'Stellar 是两阶段考核（利润目标 8% / 5%），而本模型只有一个考试阶段。这里用「较严阶段的目标 + 天数 2」来近似两阶段的复合概率，属于近似值，不是精确复刻。获资后需完成 5 个 Benchmark Day 才能出金，故出金天数取 5。',
      en: 'Stellar is a 2-step evaluation (8% / 5% profit targets) while this model has a single evaluation phase. We approximate the compounded two-phase probability by using the first phase target with `days = 2` — an approximation, not an exact replica. Funded accounts need 5 Benchmark Days before a payout, hence payout days = 5.',
    },
    inputs: {
      costPerAccount: 550,
      activationFee: 0,
      examDrawdown: 10000,
      examTarget: 8000,
      examDays: 2,
      payoutDrawdown: 10000,
      payoutTarget: 5000,
      payoutDays: 5,
      actualPayout: 4000,
    },
  },
]);

/** Look up a preset by id. */
export function getPreset(id: string): FirmPreset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}

/** `$50,000` / `—` for the abstract reference preset. */
export function presetAccountSizeLabel(preset: FirmPreset): string {
  if (!preset.accountSize) return '';
  return `$${preset.accountSize.toLocaleString('en-US')}`;
}
