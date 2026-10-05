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
 * SECOND CAVEAT — what payout "days" really mean (verified 2026-10)
 * `P = (D/(D+T))^N` treats N as "the trader must independently clear the FULL
 * target N times in a row". Real firms do not ask for that. Verified against
 * official pages, payout gates come in three shapes:
 *   1. Calendar cycles — just wait (FundedNext 21-day option: no target, no days).
 *   2. N non-consecutive *winning days*, each clearing a small daily profit floor
 *      (Apex: 5 days ≥ $250 on 50K EOD; Topstep: 5 days ≥ $200; FundedNext 3-day
 *      option: 3 days ≥ 1%). This is strictly easier than N full-target clears,
 *      and the model has no knob for it.
 *   3. Minimum-balance gates (Apex Safety Net: balance ≥ DD + $100).
 * Presets therefore model the payout phase as a SINGLE attempt (`days = 1`)
 * aimed at the realistic minimum-balance target, and each preset's note spells
 * out the official rule it abstracts. `days > 1` is only used to approximate
 * multi-phase *evaluations* (e.g. FundedNext Stellar's two sequential targets).
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
    verifiedAt: '2026-10',
    source:
      'https://apextraderfunding.com/help-center/eod-trailing-drawdown-accounts/eod-payouts',
    confidence: 'medium',
    note: {
      'zh-CN':
        '按 2026-03 后的新版规则与官方帮助中心：50K EOD 评估目标 $3,000、回撤 $2,000，最低通过天数 1，一次性收费（$249 为标价，常年大幅促销，请按实付改）。官方出金规则不是「5 次达成总目标」，而是「5 个非连续盈利日、每天 ≥$250」+ 安全网（回撤+$100 = $2,600）+ 单次上限（前两笔 $1,500）+ 50% 一致性，无时间限制。因此本预设把出金阶段按单次尝试建模：天数 1、目标 $2,600（最低请求余额 − 起始资金）、回撤 $2,500，实际到手按首笔上限 $1,500 计。一致性规则与最多 6 次出金未建模。',
      en: 'Per the new Apex rules (accounts bought after 2026-03) and the official help centre: 50K EOD eval target $3,000, drawdown $2,000, minimum days to pass 1, one-time fee ($249 list — deep coupons are common, use what you actually paid). The official payout rule is NOT "clear the target five times": it is 5 non-consecutive winning days of $250+ each, plus a Safety Net (drawdown + $100 = $2,600), a per-payout cap ($1,500 for the first two), and a 50% consistency rule, with no deadline. This preset therefore models the payout phase as a single attempt: days 1, target $2,600 (min balance to request minus start), drawdown $2,500, and $1,500 actual payout (first-payout cap). Consistency and the 6-payout lifetime cap are not modelled.',
    },
    inputs: {
      costPerAccount: 249,
      activationFee: 59,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2500,
      payoutTarget: 2600,
      payoutDays: 1,
      actualPayout: 1500,
    },
  },
  {
    id: 'topstep-50k-combine',
    firm: 'Topstep',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Trading Combine', en: '50K · Trading Combine' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://www.quantvps.com/blog/topstep-payout-policy',
    confidence: 'low',
    note: {
      'zh-CN':
        'Topstep 按月订阅（$49 为 50K 组合月费），无激活费。评估目标为 6%（50K 即 $3,000），官方无最低交易天数，故天数取模型下限 1。出金规则（多个 2026 年来源一致）：累计 5 个非连续「盈利日」（每日净利 ≥$200）后可申请，单次上限 $5,000 或利润的 50%（取低者），最低 $125，每次出金后重新计 5 天。本预设假设首次出金前赚 $2,000，按 50% 取 $1,000 到手。2026 年起分成约为 90/10（旧规则为首笔 $10,000 内 100%），来源间有出入，请以官网结账页为准；官方规则页需登录查看。',
      en: 'Topstep bills monthly ($49 is the 50K Combine fee); no activation fee. The eval target is 6% ($3,000 on 50K) and there is no minimum trading day, so days fall back to the model floor of 1. Payout rule (consistent across several 2026 sources): after 5 non-consecutive winning days (Net PnL ≥ $200 each) you may request up to $5,000 or 50% of profit (whichever is lower), minimum $125; the 5 days reset after each payout. This preset assumes a $2,000 profit before the first withdrawal and takes 50% → $1,000. The split changed around 2026 to 90/10 from the first dollar (older sources say 100% of the first $10,000) — check the official checkout page; Topstep\u2019s own rules page requires login.',
    },
    inputs: {
      costPerAccount: 49,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1000,
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
      'https://help.fundednext.com/en/articles/9430123-is-there-a-minimum-trading-day-and-profit-target-in-the-fundednext-account-of-the-stellar-2-step-model',
    confidence: 'medium',
    note: {
      'zh-CN':
        'Stellar 是两阶段考核（8% / 5%），本模型只有单个考试阶段，用「较严目标 + 天数 2」近似两阶段的复合概率（近似，非精确）。获资阶段按官方帮助中心有三种出金选项（结账时选定、不可更改）：①21 天周期——无目标、无最低天数，分成 80%；②3 天周期——每周期 3 个盈利日、每日 ≥1%（100K 即 $1,000），分成 60%；③按需——总增长 ≥2%（$2,000）且最佳单日 ≤40% 总利润，分成 90%。本预设按选项③建模：目标 $2,000、天数 1、到手 $1,800（90%）。旧资料中的「5 个 Benchmark Day」与官方当前帮助中心不一致，请以你结账时所选选项为准。',
      en: 'Stellar is a 2-step evaluation (8% / 5% profit targets) while this model has a single evaluation phase; we approximate the compounded two-phase probability with the stricter target and days = 2 — an approximation, not an exact replica. The funded phase has three payout options per the official help centre (fixed at checkout): (1) 21-day cycles — no target, no minimum days, 80% split; (2) 3-day cycles — 3 profitable days per cycle at ≥1% each ($1,000 on 100K), 60% split; (3) On-Demand — ≥2% total growth ($2,000) with the best day ≤40% of total profit, 90% split. This preset models option (3): target $2,000, days 1, $1,800 payout. Older third-party pages mention "5 Benchmark Days", which does not match the current official help centre — check the option you actually selected at checkout.',
    },
    inputs: {
      costPerAccount: 550,
      activationFee: 0,
      examDrawdown: 10000,
      examTarget: 8000,
      examDays: 2,
      payoutDrawdown: 10000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1800,
    },
  },
  {
    id: 'fundednext-rapid-25k',
    firm: 'FundedNext',
    accountSize: 25000,
    variant: { 'zh-CN': '25K · Rapid Pro', en: '25K · Rapid Pro' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://fundednext.com/futures/rapid',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：考核阶段无一致性、无日损，1 天可过（目标 $1,500、EOD 回撤 $1,000）；获资阶段有 40% 一致性、单笔出金上限 $800（首笔）、最低 $250、每 3 天可领、分成 90%。⚠️ 分摊约定：因出金阶段 40% 一致性迫使至少分 3 天，本预设的「出金利润」填的是每天需达到的均摊利润（800÷3≈267）、天数填 3——不是总目标 800；这等效于「连续 3 天、每天 +267 先于 −1000」。实际到手 694.8 = 800×90%×96.5%（约 3.5% 出金手续费）。账号价格随促销浮动：官方当前半价 $79.99，社区折扣码价约 $90，请按实付修改。已按此参数有多个实战出金案例。',
      en: 'Official rules: no consistency, no daily loss in the challenge (pass in 1 day; target $1,500, EOD MLL $1,000); the funded phase has a 40% consistency rule, $800 first-withdrawal cap, $250 minimum, rewards every 3 days, 90% split. ⚠️ Averaging convention: because the 40% consistency forces at least 3 days, this preset fills the payout-profit field with the PER-DAY share (800÷3≈267) and days = 3 — not the $800 total; equivalent to "three consecutive days of +267 before −1000". Actual payout 694.8 = 800×90%×96.5% (~3.5% payout fee). Price floats with promos: $79.99 (current official 50% off) vs ~$90 via creator codes — use what you actually paid. Multiple community cash-outs verified these parameters.',
    },
    inputs: {
      costPerAccount: 90,
      activationFee: 0,
      examDrawdown: 1000,
      examTarget: 1500,
      examDays: 1,
      payoutDrawdown: 1000,
      payoutTarget: 267,
      payoutDays: 3,
      actualPayout: 694.8,
    },
  },
  {
    id: 'fundednext-flex-50k',
    firm: 'FundedNext',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Flex', en: '50K · Flex' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://fundednext.com/general-rules/futures/trading-objectives',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：考核阶段 40% 一致性（超限不判负，而是把目标按「最高单日÷40%」重算上调）、无日损，目标 $2,500、EOD 回撤 $1,500（随日结余额上移，锁在 $50,100）；获资阶段无一致性（可以暴击），每周期需 5 个 ≥$200 的基准日，出金只能提利润的 50%（提满 $1,500 上限需先赚到 $3,000），分成 95%，首次出金后 MLL 锁定、最多 5 次奖励。⚠️ 分摊约定：考试利润填 2500÷3≈834、天数填 3（40% 一致性迫使至少 3 天）。实际到手按顶格 1375 = 1500×95%×96.5%。注意：5 个基准日的研磨期不在模型内，实际比计算结果略难（社区有在混基准日阶段打炸账户的案例）。价格 $69.99 为官方前 5 次购入价（第 6 次起 $79.99）。',
      en: 'Official rules: challenge has a 40% consistency rule that does NOT fail you — it recalculates the target upward (highest day ÷ 40%); no daily loss; target $2,500, EOD MLL $1,500 (trails on end-of-day balance, locks at $50,100). Funded phase has NO consistency (spikes allowed), needs 5 benchmark days ≥ $200 per cycle, pays out at most 50% of profit (to take the $1,500 cap you must first make $3,000), 95% split, MLL locks after the first payout, account concludes after 5 rewards. ⚠️ Averaging convention: the exam-profit field holds the per-day share (2500÷3≈834) with days = 3, because the 40% consistency forces at least 3 days. Actual payout models the cap: 1375 = 1500×95%×96.5%. Caveat: the 5-benchmark-day grind is outside the model — real life is slightly harder (community reports of accounts blown while grinding benchmark days). Price $69.99 is the official first-5-purchases rate ($79.99 from the 6th).',
    },
    inputs: {
      costPerAccount: 69.99,
      activationFee: 0,
      examDrawdown: 1500,
      examTarget: 834,
      examDays: 3,
      payoutDrawdown: 1500,
      payoutTarget: 3000,
      payoutDays: 1,
      actualPayout: 1375,
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
