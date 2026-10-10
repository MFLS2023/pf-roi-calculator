/**
 * ⚠️ 自动生成的文件 —— DO NOT EDIT。
 *
 * 由 propfirmvip-crawler/export_web.py 生成，手工修改会在下次导出时被覆盖。
 * 要改数据，请改爬虫产物或导出脚本，然后重新运行：
 *
 *     python export_web.py
 *
 * 来源：
 *   - C:\Users\20577\WorkBuddy AI\2026-10-05-19-20-08\propfirmvip-crawler\data\structured\rules_pending.json
 *
 * 机构卡片来源：propfirmvip.com 各机构规则页
 *
 * ⚠️ 两个必须知道的边界，UI 不要越过：
 *   1. 本文件只有「机构级摘要」（分成 / 回撤 / VPN / 大陆 / 账号上限）。
 *      计算器需要的 9 个产品级 ROI 参数不在其中 —— 它们只存在于
 *      src/data/presets.ts，且目前只有 6 条预设经过核对。
 *      因此 presetRefs 为空的机构**不能**一键载入参数，UI 必须说清楚。
 *   2. 卡片是机构级、预设是产品级，两者可能不一致。
 *      例：Apex 卡片写 Intraday，但已核对预设是 50K EOD 账户。
 *      展示时两个都给出，不要用一个覆盖另一个。
 */

/** 三态布尔：明确是 / 明确否 / 来源未提供。 */
export type TriState = 'yes' | 'no' | 'unknown';

/** 回撤类型。 */
export type DrawdownType = 'eod' | 'intraday' | 'tdd' | 'static' | 'unknown';

/** VPN / 梯子政策。conditional = 允许但有附加条件。 */
export type VpnPolicy = 'allowed' | 'conditional' | 'discouraged' | 'forbidden' | 'unknown';

/** 分成比例区间（百分数）。`90` 表示 90%。 */
export interface ProfitSplitRange {
  readonly min: number;
  readonly max: number;
}

/** 卡片里未归一的原始文本，用于兜底展示与人工复核。 */
export interface FirmRawCard {
  readonly profitSplit: string | null;
  readonly drawdownType: string | null;
  readonly vpnPolicy: string | null;
  readonly cnSupport: string | null;
  readonly maxAccounts: string | null;
}

/** 该机构已核对的一条产品线（对应 presets.ts 的一个预设）。 */
export interface FirmPresetRef {
  /** presets.ts 里的预设 id。 */
  readonly id: string;
  /**
   * 该产品线的回撤类型，从预设**自己的 variant 描述**里读出来的。
   * `null` = 预设描述里没提回撤类型 —— 这时只能看机构卡片的 `drawdownType`。
   *
   * 为什么需要它：机构卡片是**机构级摘要**，可能与具体产品不一致。
   * 例：Apex 卡片写 Intraday，但它已核对的产品线是 50K EOD。
   * 筛选「EOD」时应当能把 Apex 检索出来，靠的就是这个字段。
   */
  readonly drawdownType: DrawdownType | null;
}

/** 一家机构的全部可展示信息。 */
export interface Firm {
  /** 稳定标识，与来源站 URL 末段一致。 */
  readonly slug: string;
  /** 机构名。品牌名，永不翻译。 */
  readonly name: string;
  /** 来源规则页。 */
  readonly sourceUrl: string;
  /** 卡片抓取时间（+08:00）。 */
  readonly crawledAt: string;
  /**
   * 该机构在来源站是否已有键值卡片。
   * `false` 表示来源页面当时没有卡片（页面改版/晚于快照），
   * **不是**抓取失败。UI 应隐藏这类机构，而不是显示一张空卡。
   */
  readonly cardAvailable: boolean;
  /** 归一化分成比例；null = 原文无法解析（见 raw）。 */
  readonly profitSplit: ProfitSplitRange | null;
  /** 归一化回撤类型。 */
  readonly drawdownType: DrawdownType;
  /** 归一化 VPN 政策。 */
  readonly vpnPolicy: VpnPolicy;
  /** 中国大陆支持情况。unknown ≠ 不支持。 */
  readonly cnSupport: TriState;
  /** 账号上限；null = 原文有歧义（如 `5+5`）。 */
  readonly maxAccounts: number | null;
  /** 卡片上的附加键值对，原样保留。 */
  readonly extraNotes: Readonly<Record<string, string>>;
  /** 原始文本，供兜底展示与人工复核。 */
  readonly raw: FirmRawCard;
  /**
   * 已核对、可一键载入计算器的产品线（对应 presets.ts）。
   * 空数组表示该机构的产品级 ROI 参数尚未核对 —— UI 不得假装能载入。
   */
  readonly presetRefs: readonly FirmPresetRef[];
  /** 无法自动关联预设时的原因说明（中文）。 */
  readonly presetMappingNote: string | null;
}

/** 机构卡片来源元信息。 */
export const FIRMS_META = {
  source: 'https://propfirmvip.com',
  generatedAt: '2026-10-10T17:46:04',
} as const;

export const FIRMS: readonly Firm[] = [
  {
    slug: 'alpha',
    name: 'Alpha 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/alpha.html',
    crawledAt: '2026-10-05T21:12:22+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '5个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'apex',
    name: 'Apex 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/apex.html',
    crawledAt: '2026-10-05T21:12:19+08:00',
    cardAvailable: true,
    profitSplit: { min: 100, max: 100 },
    drawdownType: 'intraday',
    vpnPolicy: 'allowed',
    cnSupport: 'no',
    maxAccounts: null,
    extraNotes: {},
    raw: {
      profitSplit: '100%',
      drawdownType: 'Intraday',
      vpnPolicy: '允许',
      cnSupport: '不支持',
      maxAccounts: null,
    },
    presetRefs: [{ id: 'apex-50k-eod', drawdownType: 'eod' }],
    presetMappingNote: null,
  },
  {
    slug: 'blusky',
    name: 'Blusky 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/blusky.html',
    crawledAt: '2026-10-05T21:12:06+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 2,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '2个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'bulenox',
    name: 'Bulenox 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/bulenox.html',
    crawledAt: '2026-10-05T21:12:16+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'tdd',
    vpnPolicy: 'allowed',
    cnSupport: 'no',
    maxAccounts: null,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'TDD',
      vpnPolicy: '允许',
      cnSupport: '不支持',
      maxAccounts: null,
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'e2t',
    name: 'Earn2Trade 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/e2t.html',
    crawledAt: '2026-10-05T21:12:11+08:00',
    cardAvailable: true,
    profitSplit: { min: 80, max: 80 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 3,
    extraNotes: {},
    raw: {
      profitSplit: '80%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '3个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'fff',
    name: 'Funded Futures Family 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/fff.html',
    crawledAt: '2026-10-05T21:12:12+08:00',
    cardAvailable: true,
    profitSplit: { min: 80, max: 80 },
    drawdownType: 'eod',
    vpnPolicy: 'forbidden',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: {},
    raw: {
      profitSplit: '80%',
      drawdownType: 'EOD',
      vpnPolicy: '严格禁止',
      cnSupport: null,
      maxAccounts: '5个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'ffn',
    name: 'Funded Futures Network 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/ffn.html',
    crawledAt: '2026-10-05T21:12:03+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'unknown',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '看规则图',
      cnSupport: null,
      maxAccounts: '5个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'ftmofutures',
    name: 'FTMO futures 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/ftmofutures.html',
    crawledAt: '2026-10-10T14:51:05+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 3,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '3个',
    },
    presetRefs: [],
    presetMappingNote: '本站现有 FTMO 预设是「外汇 1-Step」产品，与 FTMO 期货不是同一条产品线，因此未自动关联。若要看 FTMO 外汇的 ROI，请从上方预设下拉框直接选择。',
  },
  {
    slug: 'fundednext',
    name: 'FundedNext 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/fundednext.html',
    crawledAt: '2026-10-10T14:51:04+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '5个',
    },
    presetRefs: [{ id: 'fundednext-stellar-100k', drawdownType: null }, { id: 'fundednext-rapid-25k', drawdownType: null }, { id: 'fundednext-flex-50k', drawdownType: null }],
    presetMappingNote: null,
  },
  {
    slug: 'launch',
    name: 'Traders Launch 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/launch.html',
    crawledAt: '2026-10-05T21:11:59+08:00',
    cardAvailable: true,
    profitSplit: { min: 55, max: 55 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: {},
    raw: {
      profitSplit: '55%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '5个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'lucid',
    name: 'Lucid 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/lucid.html',
    crawledAt: '2026-10-05T21:11:48+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '5',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'nexgen',
    name: 'NEXGEN 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/nexgen.html',
    crawledAt: '2026-10-05T21:12:21+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 3,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '3个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'p1futures',
    name: 'P1 futures 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/p1futures.html',
    crawledAt: '2026-10-10T14:51:07+08:00',
    cardAvailable: false,
    profitSplit: null,
    drawdownType: 'unknown',
    vpnPolicy: 'unknown',
    cnSupport: 'unknown',
    maxAccounts: null,
    extraNotes: {},
    raw: {
      profitSplit: null,
      drawdownType: null,
      vpnPolicy: null,
      cnSupport: null,
      maxAccounts: null,
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'phidias',
    name: 'Phidias Prop Firm 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/phidias.html',
    crawledAt: '2026-10-05T21:12:15+08:00',
    cardAvailable: true,
    profitSplit: { min: 80, max: 80 },
    drawdownType: 'eod',
    vpnPolicy: 'unknown',
    cnSupport: 'unknown',
    maxAccounts: null,
    extraNotes: { '一次性支付免激活': 'OTP', 'swing 账户支持': '可隔夜' },
    raw: {
      profitSplit: '80%',
      drawdownType: 'EOD',
      vpnPolicy: null,
      cnSupport: null,
      maxAccounts: null,
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'phoenix',
    name: 'phoenix 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/phoenix.html',
    crawledAt: '2026-10-05T21:12:09+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: null,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '根据类型',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'purdia',
    name: 'Purdia 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/purdia.html',
    crawledAt: '2026-10-05T21:12:05+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 3,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '3个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'topone',
    name: 'TopOne 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/topone.html',
    crawledAt: '2026-10-05T21:12:02+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'conditional',
    cnSupport: 'unknown',
    maxAccounts: null,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许（尽量保持固定地区）',
      cnSupport: null,
      maxAccounts: '5+5',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'topstep',
    name: 'Topstep 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/topstep.html',
    crawledAt: '2026-10-05T21:11:53+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'allowed',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '允许',
      cnSupport: null,
      maxAccounts: '5个',
    },
    presetRefs: [{ id: 'topstep-50k-combine', drawdownType: null }],
    presetMappingNote: null,
  },
  {
    slug: 'tpt',
    name: 'Take Profit Trader 规则汇总',
    sourceUrl: 'https://propfirmvip.com/rule/tpt.html',
    crawledAt: '2026-10-05T21:11:50+08:00',
    cardAvailable: true,
    profitSplit: { min: 80, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'unknown',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: { '出金回撤类型': 'TDD' },
    raw: {
      profitSplit: '80-90%',
      drawdownType: 'EOD',
      vpnPolicy: null,
      cnSupport: null,
      maxAccounts: '5',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'tradeday',
    name: 'TradeDay 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/tradeday.html',
    crawledAt: '2026-10-05T21:11:54+08:00',
    cardAvailable: true,
    profitSplit: { min: 80, max: 80 },
    drawdownType: 'unknown',
    vpnPolicy: 'conditional',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: { '推荐类型': 'FastPass' },
    raw: {
      profitSplit: '80%',
      drawdownType: null,
      vpnPolicy: '允许（特例）',
      cnSupport: null,
      maxAccounts: '5个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'tradeify',
    name: 'Tradeify 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/tradeify.html',
    crawledAt: '2026-10-05T21:12:08+08:00',
    cardAvailable: true,
    profitSplit: { min: 90, max: 90 },
    drawdownType: 'eod',
    vpnPolicy: 'discouraged',
    cnSupport: 'unknown',
    maxAccounts: 5,
    extraNotes: {},
    raw: {
      profitSplit: '90%',
      drawdownType: 'EOD',
      vpnPolicy: '建议不使用',
      cnSupport: null,
      maxAccounts: '5个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
  {
    slug: 'vest',
    name: 'Vest 规则指南',
    sourceUrl: 'https://propfirmvip.com/rule/vest.html',
    crawledAt: '2026-10-10T14:53:17+08:00',
    cardAvailable: true,
    profitSplit: { min: 80, max: 80 },
    drawdownType: 'static',
    vpnPolicy: 'unknown',
    cnSupport: 'unknown',
    maxAccounts: 10,
    extraNotes: { '日损类型': '硬日损' },
    raw: {
      profitSplit: '80%',
      drawdownType: '静态',
      vpnPolicy: null,
      cnSupport: null,
      maxAccounts: '10个',
    },
    presetRefs: [],
    presetMappingNote: null,
  },
];
