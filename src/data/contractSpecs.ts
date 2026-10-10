/**
 * ⚠️ 自动生成的文件 —— DO NOT EDIT。
 *
 * 由 propfirmvip-crawler/export_web.py 生成，手工修改会在下次导出时被覆盖。
 * 要改数据，请改爬虫产物或导出脚本，然后重新运行：
 *
 *     python export_web.py
 *
 * 来源：
 *   - C:\Users\20577\WorkBuddy AI\2026-10-05-19-20-08\propfirmvip-crawler\data\extracted\contract_specs.json
 *
 * 数据来源页面：https://propfirmvip.com/calculator/
 * 数据来源脚本：https://propfirmvip.com/calculator/assets/js/calculator.js
 */

/** 数据来源元信息。 */
export const CONTRACT_SPECS_META = {
  title: '期货合约规格表',
  sourceUrl: 'https://propfirmvip.com/calculator/',
  sourceScript: 'https://propfirmvip.com/calculator/assets/js/calculator.js',
} as const;

/** 单个期货合约的规格。 */
export interface ContractSpec {
  /** 合约代码，如 MNQ。 */
  readonly code: string;
  /** 中文名称，如「微型纳指 MNQ」。 */
  readonly name: string;
  /** 每点价值（USD）。 */
  readonly pointValue: number;
  /** 最小变动价位。 */
  readonly tickSize: number;
  /** 报价小数位。 */
  readonly decimals: number;
}

export const CONTRACT_SPECS: readonly ContractSpec[] = [
  {
    code: 'MNQ',
    name: '微型纳指 MNQ',
    pointValue: 2,
    tickSize: 0.25,
    decimals: 2,
  },
  {
    code: 'MGC',
    name: '微型黄金 MGC',
    pointValue: 10,
    tickSize: 0.1,
    decimals: 1,
  },
  {
    code: 'MES',
    name: '微型标普 MES',
    pointValue: 5,
    tickSize: 0.25,
    decimals: 2,
  },
  {
    code: 'NQ',
    name: '纳指 NQ',
    pointValue: 20,
    tickSize: 0.25,
    decimals: 2,
  },
  {
    code: 'GC',
    name: '黄金 GC',
    pointValue: 100,
    tickSize: 0.1,
    decimals: 1,
  },
  {
    code: 'ES',
    name: '标普 ES',
    pointValue: 50,
    tickSize: 0.25,
    decimals: 2,
  },
  {
    code: 'MCL',
    name: '微型原油 MCL',
    pointValue: 100,
    tickSize: 0.01,
    decimals: 2,
  },
  {
    code: 'CL',
    name: '原油 CL',
    pointValue: 1000,
    tickSize: 0.01,
    decimals: 2,
  },
  {
    code: 'SIL',
    name: '微型白银 SIL',
    pointValue: 1000,
    tickSize: 0.005,
    decimals: 3,
  },
  {
    code: 'SI',
    name: '白银 SI',
    pointValue: 5000,
    tickSize: 0.005,
    decimals: 3,
  },
  {
    code: '6E',
    name: '欧元 6E',
    pointValue: 125000,
    tickSize: 0.00005,
    decimals: 5,
  },
  {
    code: '6B',
    name: '英镑 6B',
    pointValue: 62500,
    tickSize: 0.0001,
    decimals: 4,
  },
  {
    code: '6J',
    name: '日元 6J',
    pointValue: 12500000,
    tickSize: 0.0000005,
    decimals: 7,
  },
];
