import { DEFAULT_INPUTS } from '../domain/constants';
import type { CalculatorInputs } from '../domain/types';
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
    id: 'apex-50k-intraday',
    firm: 'Apex Trader Funding',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Intraday 盘中追踪回撤', en: '50K · Intraday trailing drawdown' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://support.apextraderfunding.com/hc/en-us/articles/45631563363483-Trailing-Threshold',
    confidence: 'medium',
    note: {
      'zh-CN':
        'Apex 经典盘中最高点实时追踪回撤账户：50K 账户目标 $3,000、盘中追踪回撤 $2,500，标价月费 $167（常年 80%~90% 折扣，请按实付修改），激活费 $180（终身）或 $85/月。出金阶段：5 个非连续盈利日（每日 ≥$250）+ 安全网（$2,600），前两笔单次出金上限 $1,500。注意：盘中追踪回撤会在浮盈回吐时收紧止损，通过难度显著高于 EOD 日终回撤。',
      en: 'Apex classic intraday trailing threshold account: 50K eval target $3,000, intraday trailing drawdown $2,500, list fee $167/mo (frequent 80%-90% off coupons, adjust to what you paid), activation fee $180 (lifetime) or $85/mo. Payout: 5 winning days of $250+ and Safety Net ($2,600), first two payouts capped at $1,500. Intraday trailing trails peak unrealized profit in real-time, making it significantly stricter than EOD.',
    },
    inputs: {
      costPerAccount: 167,
      activationFee: 180,
      examDrawdown: 2500,
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
    source: 'https://help.topstep.com/en/articles/8284233-topstep-payout-policy',
    confidence: 'medium',
    note: {
      'zh-CN':
        '按 Topstep 官方帮助中心最新规则：50K Combine 标价月费 $49，Standard 路径 Express 获资激活费 $149（无月费）；评估目标 6%（$3,000），最大亏损限制（MLL）$2,000，官方无最低交易天数。获资出金政策：累计 5 个盈利日（每日净利 ≥$150）后可申请出金，单次上限为利润的 50%（顶格最高 $5,000）；分成固定为 90%。本预设建模 Standard 路径首笔出金：假设获资账户赚取 $2,000 利润，提取 50%（$1,000），实际到手 $900（扣除 10% 分成）；首次出金后 MLL 锁定为 $0。若选免激活费路径，Combine 月费通常更高。',
      en: 'Per official Topstep Help Center: 50K Combine is $49/mo, Standard Path Express activation fee is $149 (no ongoing sub); eval target 6% ($3,000), Max Loss Limit (MLL) $2,000, 0 minimum days. Payout policy: 5 winning days ($150+ net PnL) required per payout, capped at 50% of profits (up to $5,000); 90% payout split. This preset models the Standard Path first withdrawal: trader makes $2,000 profit and requests 50% ($1,000), netting $900 after 90% split; MLL locks at $0 on first payout. No-activation-fee path has higher monthly fees.',
    },
    inputs: {
      costPerAccount: 49,
      activationFee: 149,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 900,
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
  {
    id: 'tradeify-50k-growth',
    firm: 'Tradeify',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Growth (EOD 日终回撤)', en: '50K · Growth (EOD drawdown)' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://tradeify.co',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：50K Growth 计划标价 $119，免激活费。考核目标 6%（$3,000），EOD 日终回撤 $2,000，官方无最低交易天数。获资阶段无每日亏损限额，40% 一致性规则，出金分成 90%。本预设建模首笔出金：假设获资账户赚取 $2,000 利润，提取 90% 到手 $1,800。',
      en: 'Official rules: 50K Growth plan is $119, no activation fee. Eval target 6% ($3,000), EOD drawdown $2,000, 0 minimum days. Funded stage has no daily loss limit, 40% consistency rule, 90% profit split. Models first payout: trader earns $2,000 and nets $1,800 at 90%.',
    },
    inputs: {
      costPerAccount: 119,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1800,
    },
  },
  {
    id: 'tpt-50k-pro',
    firm: 'Take Profit Trader',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · PRO (EOD 日终回撤)', en: '50K · PRO (EOD drawdown)' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://www.takeprofittrader.com',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：50K 标价 $175/月（常年大促），通过后 PRO 激活费 $130。评估目标 $3,000，EOD 日终回撤 $2,000，最低 5 个交易日。获资后最大亮点为「第 1 天起即可出金」（Day 1 Payout），分成 90%（初级 80%），无每日亏损限制。本预设建模首笔出金赚取 $2,000 利润，90% 分成实得 $1,800。',
      en: 'Official rules: 50K is $175/mo (frequent sales), PRO activation fee $130. Eval target $3,000, EOD drawdown $2,000, 5 minimum trading days. Funded stage offers Day 1 payouts, 90% split (80% entry), no daily loss. Models first payout of $2,000 profit, netting $1,800 at 90%.',
    },
    inputs: {
      costPerAccount: 175,
      activationFee: 130,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1800,
    },
  },
  {
    id: 'e2t-50k-tcp',
    firm: 'Earn2Trade',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Trader Career Path', en: '50K · Trader Career Path' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://www.earn2trade.com',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：Trader Career Path 50K 标价 $170/月，免激活费。考核目标 $3,000，EOD 日终回撤 $2,000，有最低 10-15 交易日与每日亏损限制（$1,100）。获资后固定 80% 分成。本预设建模首笔出金：赚取 $2,000 利润，80% 分成实得 $1,600。',
      en: 'Official rules: Trader Career Path 50K is $170/mo, no activation fee. Eval target $3,000, EOD drawdown $2,000, minimum days and $1,100 daily loss apply. 80% profit split in funded stage. Models first payout of $2,000 profit netting $1,600.',
    },
    inputs: {
      costPerAccount: 170,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1600,
    },
  },
  {
    id: 'bulenox-50k',
    firm: 'Bulenox',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Qualifying (TDD 追踪回撤)', en: '50K · Qualifying (trailing)' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://bulenox.com',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：50K 标价 $145/月（优惠码常年约 $25-$35），终身激活费 $143。评估目标 $3,000，TDD 尾随追踪回撤 $2,500，最少 5 个交易日。获资出金政策：首笔 $10,000 享受 100% 分成，之后 90%。本预设按首笔提取 $2,000、100% 到手 $2,000 建模。注意：不支持中国大陆直连。',
      en: 'Official rules: 50K list $145/mo (heavy coupons often ~$25-$35), lifetime activation $143. Eval target $3,000, trailing drawdown $2,500, minimum 5 days. First $10,000 is 100% split, 90% thereafter. Models first withdrawal of $2,000 netting $2,000. Note: does not support mainland China.',
    },
    inputs: {
      costPerAccount: 145,
      activationFee: 143,
      examDrawdown: 2500,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2500,
      payoutTarget: 2500,
      payoutDays: 1,
      actualPayout: 2000,
    },
  },
  {
    id: 'alpha-50k',
    firm: 'Alpha Futures',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Evaluation (EOD 日终回撤)', en: '50K · Evaluation (EOD drawdown)' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://www.alphafutures.com',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：50K 标价 $99，免激活费。考核目标 $3,000，EOD 日终回撤 $2,000，无最低交易天数限制。获资阶段分成 90%，无复杂缓冲期。本预设建模首笔出金：获资赚取 $2,000 利润，提取 90% 到手 $1,800。',
      en: 'Official rules: 50K is $99, no activation fee. Eval target $3,000, EOD drawdown $2,000, no minimum trading days. 90% profit split in funded phase. Models first withdrawal of $2,000 netting $1,800 at 90%.',
    },
    inputs: {
      costPerAccount: 99,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1800,
    },
  },
  {
    id: 'tradeday-50k',
    firm: 'TradeDay',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Standard (EOD 日终回撤)', en: '50K · Standard (EOD drawdown)' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://www.tradeday.com',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：50K 账户标价 $165/月，免激活费。考核目标 $3,000，EOD 日终回撤 $2,000，无最低交易天数。出金政策：首笔 $10,000 享受 100% 分成（免抽成），之后 90%；出金要求账户余额高于回撤起点。本预设建模首笔提现 $2,000，100% 全额到手 $2,000。',
      en: 'Official rules: 50K is $165/mo, no activation fee. Eval target $3,000, EOD drawdown $2,000, no minimum days. First $10,000 is 100% profit split, 90% thereafter. Models first withdrawal of $2,000 netting $2,000 at 100%.',
    },
    inputs: {
      costPerAccount: 165,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 2000,
    },
  },
  {
    id: 'lucid-50k',
    firm: 'Lucid Trading',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Evaluation (EOD 日终回撤)', en: '50K · Evaluation (EOD drawdown)' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://lucidtrading.com',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：50K 标价 $125，免激活费。考核目标 $3,000，EOD 日终回撤 $2,000，无最低交易天数。出金分成 90%，无每日亏损限制。本预设建模首笔出金：赚取 $2,000 利润，90% 到手 $1,800。',
      en: 'Official rules: 50K is $125, no activation fee. Eval target $3,000, EOD drawdown $2,000, no minimum days. 90% profit split, no daily loss. Models first payout of $2,000 netting $1,800 at 90%.',
    },
    inputs: {
      costPerAccount: 125,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1800,
    },
  },
  {
    id: 'ftmofutures-50k',
    firm: 'FTMO Futures',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Futures Challenge', en: '50K · Futures Challenge' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://ftmo.com/en/trading-objectives/',
    confidence: 'medium',
    note: {
      'zh-CN':
        '官方规则：FTMO 期货 50K 考核报名费约 $350，免激活费。利润目标 10%（$5,000）、最大亏损 10%（$5,000，日结追踪），无强制最低天数。获资阶段初始分成 80%（表现优异可升级至 90%）。本预设按首笔提现假设赚取 $5,000 利润，80% 分成实得 $4,000 建模。',
      en: 'Official rules: FTMO Futures 50K challenge is ~$350, no activation fee. Profit target 10% ($5,000), max loss 10% ($5,000, end-of-day), 0 minimum days. Funded stage starts at 80% profit split (scaleable to 90%). Models first payout of $5,000 profit netting $4,000 at 80%.',
    },
    inputs: {
      costPerAccount: 350,
      activationFee: 0,
      examDrawdown: 5000,
      examTarget: 5000,
      examDays: 1,
      payoutDrawdown: 5000,
      payoutTarget: 5000,
      payoutDays: 1,
      actualPayout: 4000,
    },
  },
  {
    id: 'phidias-50k',
    firm: 'Phidias Prop Firm',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Evaluation (EOD 日终回撤)', en: '50K · Evaluation (EOD drawdown)' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://phidiaspropfirm.com',
    confidence: 'low',
    note: {
      'zh-CN':
        '来源仅为官网首页级信息（非逐条帮助中心核对），置信度标为 low。50K 标价约 $150（常有 60%~80% 促销），激活费约 $139；考核目标约 6%（$3,000）、EOD 回撤约 $2,500。出金按 90% 粗算首笔 $1,800。请以官网结账页为准并按实付改价。',
      en: 'Sourced from homepage-level info only (not a line-by-line help-centre audit) — confidence low. ~$150 list (frequent coupons), ~$139 activation; ~6% target / ~$2,500 EOD. Models ~$1,800 first payout at 90%. Verify on the official checkout page.',
    },
    inputs: {
      costPerAccount: 150,
      activationFee: 139,
      examDrawdown: 2500,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2500,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1800,
    },
  },
  {
    id: 'purdia-50k',
    firm: 'Purdia Capital',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Standard (EOD 日终回撤)', en: '50K · Standard (EOD drawdown)' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://purdiacapital.com',
    confidence: 'low',
    note: {
      'zh-CN':
        '来源为官网汇总级信息，未逐条对照帮助中心全文，置信度 low。约 $120 标价、免激活；目标约 $3,000、EOD 回撤约 $2,000；出金按 90% 粗算 $1,800。请以官网为准并按实付修改。',
      en: 'Homepage-level summary only — confidence low. ~$120 list, no activation; ~$3,000 target / ~$2,000 EOD; ~$1,800 at 90%. Confirm on the official site and adjust cost to what you paid.',
    },
    inputs: {
      costPerAccount: 120,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1800,
    },
  },
  {
    id: 'topone-50k',
    firm: 'TopOne Futures',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · Evaluation (EOD 日终回撤)', en: '50K · Evaluation (EOD drawdown)' },
    market: 'futures',
    verifiedAt: '2026-10',
    source: 'https://www.toponefutures.com',
    confidence: 'low',
    note: {
      'zh-CN':
        '来源为官网汇总级信息，置信度 low。约 $110 标价、免激活；目标约 $3,000、EOD 回撤约 $2,000；出金按 90% 粗算 $1,800。梯子政策要求尽量固定地区。请以官网结账页为准。',
      en: 'Homepage-level summary only — confidence low. ~$110 list, no activation; ~$3,000 target / ~$2,000 EOD; ~$1,800 at 90%. VPN policy: keep a stable region. Confirm on the official checkout page.',
    },
    inputs: {
      costPerAccount: 110,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1800,
    },
  },
  {
    id: 'standard-50k-template',
    firm: '通用标准 50K',
    accountSize: 50000,
    variant: { 'zh-CN': '50K · 标准估算模板 (EOD 回撤)', en: '50K · Standard Template (EOD)' },
    market: 'futures',
    verifiedAt: '2026-10',
    confidence: 'low',
    note: {
      'zh-CN':
        '【非任何一家机构的官方参数】行业通用 50K 估算模板：目标 $3,000、EOD 回撤 $2,000、出金按 90% 粗算 $1,800。仅用于待核对机构的快速试算。请务必按该机构官网实付价格与真实出金规则修改左侧全部参数。',
      en: '[NOT an official firm quote] Generic 50K template: $3,000 target, $2,000 EOD drawdown, ~$1,800 at 90%. For pending firms only. Always replace costs and payout rules with the firm’s official numbers.',
    },
    inputs: {
      costPerAccount: 100,
      activationFee: 0,
      examDrawdown: 2000,
      examTarget: 3000,
      examDays: 1,
      payoutDrawdown: 2000,
      payoutTarget: 2000,
      payoutDays: 1,
      actualPayout: 1800,
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
