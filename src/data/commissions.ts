/**
 * ⚠️ 自动生成的文件 —— DO NOT EDIT。
 *
 * 由 propfirmvip-crawler/export_web.py 生成，手工修改会在下次导出时被覆盖。
 * 要改数据，请改爬虫产物或导出脚本，然后重新运行：
 *
 *     python export_web.py
 *
 * 来源：
 *   - C:\Users\20577\WorkBuddy AI\2026-10-05-19-20-08\propfirmvip-crawler\data\extracted\commissions.json
 *
 * 数据来源页面：https://propfirmvip.com/fees/
 * 数据来源脚本：https://propfirmvip.com/fees/assets/js/commissions.js
 *
 * 语义提醒（三条，UI 都不能越过）：
 *   1. 某个数据源为 null 表示**该平台不支持这个数据源**，不是「抓取失败」。
 *      UI 必须渲染成「不适用」，不能留白、更不能当 0。
 *   2. 手续费是区间而非单值：来源页里有 12 处是 `4.2-4.5` 这样的浮动区间。
 *      统一用 {min,max} 表示，min === max 即固定费率。
 *   3. `cqg` 只是列名，不代表真实通道：Topstep 的 cqgLabel 是 ProjectX。
 *      展示时必须用 cqgLabel ?? 'CQG' 作为该列标题。
 */

/** 数据来源元信息。 */
export const COMMISSIONS_META = {
  title: '平台手续费对照表',
  sourceUrl: 'https://propfirmvip.com/fees/',
  sourceScript: 'https://propfirmvip.com/fees/assets/js/commissions.js',
} as const;

/** 品种代码，顺序与来源页面一致。 */
export const COMMISSION_INSTRUMENTS = [
  'NQ', 'MNQ', 'ES', 'MES', 'GC', 'MGC',
] as const;
export type CommissionInstrument = (typeof COMMISSION_INSTRUMENTS)[number];

/** 经纪商数据源通道。 */
export const COMMISSION_FEEDS = ['cqg', 'rithmic'] as const;
export type CommissionFeed = (typeof COMMISSION_FEEDS)[number];

/**
 * 每手往返手续费（USD）。
 * `min === max` 表示固定费率；`min < max` 表示来源页给的是浮动区间。
 */
export interface CommissionFee {
  readonly min: number;
  readonly max: number;
}

/** 单个平台的手续费。 */
export interface CommissionPlatform {
  /** 平台全名。品牌名，永不翻译。 */
  readonly name: string;
  /** 平台短名。**可能为空字符串**（来源数据里 7 家没给短名），UI 应回退到 name。 */
  readonly short: string;
  /** 来源页面对应的机构规则页；个别平台指向站点首页（该机构没有规则页）。 */
  readonly url: string;
  /**
   * `cqg` 列的实际数据源名称。
   * 未提供（null）时即为 'CQG'；已知 Topstep 为 'ProjectX'。
   * 展示时应在该列标注真实通道名，避免把 ProjectX 费率误读成 CQG 费率。
   */
  readonly cqgLabel: string | null;
  /** CQG 通道手续费；null = 该平台不支持 CQG。 */
  readonly cqg: Readonly<Record<CommissionInstrument, CommissionFee>> | null;
  /** Rithmic 通道手续费；null = 该平台不支持 Rithmic。 */
  readonly rithmic: Readonly<Record<CommissionInstrument, CommissionFee>> | null;
}

export const COMMISSION_PLATFORMS: readonly CommissionPlatform[] = [
  {
    name: 'Lucid Trading',
    short: 'Lucid',
    url: 'https://propfirmvip.com/rule/lucid.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 3.5, max: 3.5 },
      MNQ: { min: 1, max: 1 },
      ES: { min: 3.5, max: 3.5 },
      MES: { min: 1, max: 1 },
      GC: { min: 4.6, max: 4.6 },
      MGC: { min: 1.6, max: 1.6 },
    },
    rithmic: {
      NQ: { min: 3.5, max: 3.5 },
      MNQ: { min: 1, max: 1 },
      ES: { min: 3.5, max: 3.5 },
      MES: { min: 1, max: 1 },
      GC: { min: 4.6, max: 4.6 },
      MGC: { min: 1.6, max: 1.6 },
    },
  },
  {
    name: 'TakeProfitTrader',
    short: 'TPT',
    url: 'https://propfirmvip.com/rule/tpt.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 5, max: 5 },
      MNQ: { min: 1.5, max: 1.5 },
      ES: { min: 5, max: 5 },
      MES: { min: 1.5, max: 1.5 },
      GC: { min: 5, max: 5 },
      MGC: { min: 1.5, max: 1.5 },
    },
    rithmic: {
      NQ: { min: 5, max: 5 },
      MNQ: { min: 1.5, max: 1.5 },
      ES: { min: 5, max: 5 },
      MES: { min: 1.5, max: 1.5 },
      GC: { min: 5, max: 5 },
      MGC: { min: 1.5, max: 1.5 },
    },
  },
  {
    name: 'FundedNext',
    short: 'FN',
    url: 'https://propfirmvip.com/rule/fundednext.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 5.76, max: 5.76 },
      MNQ: { min: 1.9, max: 1.9 },
      ES: { min: 5.76, max: 5.76 },
      MES: { min: 1.9, max: 1.9 },
      GC: { min: 6.2, max: 6.2 },
      MGC: { min: 2.4, max: 2.4 },
    },
    rithmic: null,
  },
  {
    name: 'Topstep',
    short: 'TS',
    url: 'https://propfirmvip.com/rule/topstep.html',
    cqgLabel: 'ProjectX',
    cqg: {
      NQ: { min: 3.8, max: 3.8 },
      MNQ: { min: 1.24, max: 1.24 },
      ES: { min: 3.8, max: 3.8 },
      MES: { min: 1.24, max: 1.24 },
      GC: { min: 4.24, max: 4.24 },
      MGC: { min: 1.74, max: 1.74 },
    },
    rithmic: null,
  },
  {
    name: 'Purdia Capital',
    short: 'Purdia',
    url: 'https://propfirmvip.com/rule/purdia.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 5.68, max: 5.68 },
      MNQ: { min: 1.74, max: 1.74 },
      ES: { min: 5.68, max: 5.68 },
      MES: { min: 1.74, max: 1.74 },
      GC: { min: 6.12, max: 6.12 },
      MGC: { min: 2.04, max: 2.04 },
    },
    rithmic: null,
  },
  {
    name: 'Topone',
    short: '',
    url: 'https://propfirmvip.com/rule/topone.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 5.76, max: 5.76 },
      MNQ: { min: 1.9, max: 1.9 },
      ES: { min: 5.76, max: 5.76 },
      MES: { min: 1.9, max: 1.9 },
      GC: { min: 6.2, max: 6.2 },
      MGC: { min: 2.4, max: 2.4 },
    },
    rithmic: null,
  },
  {
    name: 'Tradeify',
    short: '',
    url: 'https://propfirmvip.com/rule/tradeify.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 5.76, max: 5.76 },
      MNQ: { min: 1.9, max: 1.9 },
      ES: { min: 5.76, max: 5.76 },
      MES: { min: 1.9, max: 1.9 },
      GC: { min: 6.2, max: 6.2 },
      MGC: { min: 2.4, max: 2.4 },
    },
    rithmic: null,
  },
  {
    name: 'TradersLaunch',
    short: '',
    url: 'https://propfirmvip.com/rule/launch.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 4.2, max: 4.5 },
      MNQ: { min: 1.2, max: 1.8 },
      ES: { min: 4.2, max: 4.5 },
      MES: { min: 1.2, max: 1.8 },
      GC: { min: 4.5, max: 5.5 },
      MGC: { min: 1.5, max: 2 },
    },
    rithmic: null,
  },
  {
    name: 'FundedFuturesNetwork',
    short: 'FFN',
    url: 'https://propfirmvip.com/rule/ffn.html',
    cqgLabel: null,
    cqg: null,
    rithmic: {
      NQ: { min: 4.98, max: 4.98 },
      MNQ: { min: 1.78, max: 1.78 },
      ES: { min: 4.98, max: 4.98 },
      MES: { min: 1.78, max: 1.78 },
      GC: { min: 4.98, max: 4.98 },
      MGC: { min: 1.78, max: 1.78 },
    },
  },
  {
    name: 'FundedFuturesFamily',
    short: 'FFF',
    url: 'https://propfirmvip.com/rule/fff.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 5.76, max: 5.76 },
      MNQ: { min: 1.9, max: 1.9 },
      ES: { min: 5.76, max: 5.76 },
      MES: { min: 1.9, max: 1.9 },
      GC: { min: 6.2, max: 6.2 },
      MGC: { min: 2.4, max: 2.4 },
    },
    rithmic: null,
  },
  {
    name: 'Blusky',
    short: '',
    url: 'https://propfirmvip.com/rule/blusky.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 2.8, max: 2.8 },
      MNQ: { min: 0.74, max: 0.74 },
      ES: { min: 2.8, max: 2.8 },
      MES: { min: 0.74, max: 0.74 },
      GC: { min: 3.24, max: 3.24 },
      MGC: { min: 1.04, max: 1.04 },
    },
    rithmic: {
      NQ: { min: 4, max: 4 },
      MNQ: { min: 1, max: 1 },
      ES: { min: 4, max: 4 },
      MES: { min: 1, max: 1 },
      GC: { min: 4, max: 4 },
      MGC: { min: 1, max: 1 },
    },
  },
  {
    name: 'Earn2Trade',
    short: 'E2T',
    url: 'https://propfirmvip.com/rule/e2t.html',
    cqgLabel: null,
    cqg: null,
    rithmic: {
      NQ: { min: 4, max: 5 },
      MNQ: { min: 1.6, max: 2.2 },
      ES: { min: 4, max: 5 },
      MES: { min: 1.6, max: 2.2 },
      GC: { min: 4, max: 5 },
      MGC: { min: 1.6, max: 2.2 },
    },
  },
  {
    name: 'Phidias',
    short: '',
    url: 'https://propfirmvip.com/rule/phidias.html',
    cqgLabel: null,
    cqg: null,
    rithmic: {
      NQ: { min: 4.2, max: 4.2 },
      MNQ: { min: 1.54, max: 1.54 },
      ES: { min: 4.2, max: 4.2 },
      MES: { min: 1.54, max: 1.54 },
      GC: { min: 4.64, max: 4.64 },
      MGC: { min: 1.84, max: 1.84 },
    },
  },
  {
    name: 'TradeDay',
    short: '',
    url: 'https://propfirmvip.com/rule/tradeday.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 4.68, max: 4.68 },
      MNQ: { min: 1.54, max: 1.54 },
      ES: { min: 4.68, max: 4.68 },
      MES: { min: 1.54, max: 1.54 },
      GC: { min: 5.12, max: 5.12 },
      MGC: { min: 1.84, max: 1.84 },
    },
    rithmic: null,
  },
  {
    name: 'Apex Trader Funding',
    short: 'Apex',
    url: 'https://propfirmvip.com/rule/apex.html',
    cqgLabel: null,
    cqg: null,
    rithmic: {
      NQ: { min: 3.98, max: 3.98 },
      MNQ: { min: 1.02, max: 1.02 },
      ES: { min: 3.98, max: 3.98 },
      MES: { min: 1.02, max: 1.02 },
      GC: { min: 4.62, max: 4.62 },
      MGC: { min: 1.52, max: 1.52 },
    },
  },
  {
    name: 'Alpha Futures',
    short: 'Alpha',
    url: 'https://propfirmvip.com/rule/alpha.html',
    cqgLabel: null,
    cqg: {
      NQ: { min: 5.76, max: 5.76 },
      MNQ: { min: 1.82, max: 1.82 },
      ES: { min: 5.76, max: 5.76 },
      MES: { min: 1.82, max: 1.82 },
      GC: { min: 6.4, max: 6.4 },
      MGC: { min: 2.12, max: 2.12 },
    },
    rithmic: null,
  },
  {
    name: 'MFFU',
    short: '',
    url: 'https://propfirmvip.com/',
    cqgLabel: null,
    cqg: null,
    rithmic: {
      NQ: { min: 4.68, max: 4.68 },
      MNQ: { min: 1.9, max: 1.9 },
      ES: { min: 4.68, max: 4.68 },
      MES: { min: 1.9, max: 1.9 },
      GC: { min: 4.6, max: 4.6 },
      MGC: { min: 2, max: 2 },
    },
  },
];
