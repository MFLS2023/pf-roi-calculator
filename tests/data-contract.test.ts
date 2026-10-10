import { describe, expect, it } from 'vitest';

import {
  COMMISSION_FEEDS,
  COMMISSION_INSTRUMENTS,
  COMMISSION_PLATFORMS,
} from '../src/data/commissions';
import { CONTRACT_SPECS } from '../src/data/contractSpecs';
import { FIRMS, type DrawdownType, type TriState, type VpnPolicy } from '../src/data/firms';
import { PRESETS } from '../src/data/presets';

/**
 * 数据契约测试 —— 守住「爬虫导出 → 计算器数据文件」这条边界。
 *
 * 为什么需要：`src/data/{commissions,contractSpecs,firms}.ts` 是自动生成的
 * （见 propfirmvip-crawler/export_web.py）。生成器一旦改错，或者爬虫产物变形状，
 * 计算器会在运行时才炸。这里把**契约本身**固化成断言：数量、值域、三态语义、
 * 以及最要紧的一条 —— 机构卡片关联的预设 id 必须真实存在。
 *
 * 这里刻意**不**去读爬虫仓库的 JSON：那会让计算器依赖爬虫目录，而计算器
 * 应当能单独 clone 下来就跑。所以期望值是写死的「契约快照」，数字变了就该
 * 有人看一眼是有意更新还是回归。
 */

/** 本次导出时的契约快照。改这些数字前请先确认爬虫侧确实变了。 */
const EXPECTED = {
  commissionPlatforms: 17,
  commissionInstruments: 6,
  /** 来源页里标记为「不支持该数据源」的单元格组数（不是抓取失败）。 */
  notApplicableFeeds: 14,
  /** 来源页给出浮动区间（min < max）的单元格数。 */
  floatingFeeCells: 12,
  contractSpecs: 13,
  firms: 22,
  /** 有键值卡片的机构数；其余 1 家（p1futures）UI 应隐藏。 */
  firmsWithCard: 21,
  /** 明确写「不支持中国大陆」的机构数。 */
  firmsCnUnsupported: 2,
  /** 已核对、可一键载入 ROI 参数的机构数（含首批新增的主流机构）。 */
  firmsWithPreset: 10,
} as const;

const DRAWDOWN_TYPES: readonly DrawdownType[] = [
  'eod',
  'intraday',
  'tdd',
  'static',
  'unknown',
];
const VPN_POLICIES: readonly VpnPolicy[] = [
  'allowed',
  'conditional',
  'discouraged',
  'forbidden',
  'unknown',
];
const TRI_STATES: readonly TriState[] = ['yes', 'no', 'unknown'];

describe('手续费表（commissions.ts）', () => {
  it('数量与来源页一致', () => {
    expect(COMMISSION_PLATFORMS).toHaveLength(EXPECTED.commissionPlatforms);
    expect(COMMISSION_INSTRUMENTS).toHaveLength(EXPECTED.commissionInstruments);
    expect(COMMISSION_FEEDS).toEqual(['cqg', 'rithmic']);
  });

  it('每个数据源要么是 null，要么六个品种齐全（不允许缺格）', () => {
    for (const platform of COMMISSION_PLATFORMS) {
      for (const feed of COMMISSION_FEEDS) {
        const fees = platform[feed];
        if (fees === null) continue;
        expect(
          Object.keys(fees).sort(),
          `${platform.name} 的 ${feed} 品种不齐`,
        ).toEqual([...COMMISSION_INSTRUMENTS].sort());
      }
    }
  });

  it('费率是合法区间：min <= max 且为正数', () => {
    for (const platform of COMMISSION_PLATFORMS) {
      for (const feed of COMMISSION_FEEDS) {
        const fees = platform[feed];
        if (fees === null) continue;
        for (const code of COMMISSION_INSTRUMENTS) {
          const fee = fees[code];
          const where = `${platform.name}/${feed}/${code}`;
          expect(Number.isFinite(fee.min), `${where} min 不是有限数`).toBe(true);
          expect(Number.isFinite(fee.max), `${where} max 不是有限数`).toBe(true);
          expect(fee.min, `${where} min 应 > 0`).toBeGreaterThan(0);
          expect(fee.min, `${where} min 应 <= max`).toBeLessThanOrEqual(fee.max);
        }
      }
    }
  });

  it('「不支持该数据源」用 null 表示，且没有被塌缩成 0', () => {
    let notApplicable = 0;
    for (const platform of COMMISSION_PLATFORMS) {
      for (const feed of COMMISSION_FEEDS) {
        if (platform[feed] === null) notApplicable += 1;
      }
    }
    expect(notApplicable).toBe(EXPECTED.notApplicableFeeds);
  });

  it('浮动区间费率被保留为 min < max（没有被拍平成单值）', () => {
    let floating = 0;
    for (const platform of COMMISSION_PLATFORMS) {
      for (const feed of COMMISSION_FEEDS) {
        const fees = platform[feed];
        if (fees === null) continue;
        for (const code of COMMISSION_INSTRUMENTS) {
          if (fees[code].min < fees[code].max) floating += 1;
        }
      }
    }
    expect(floating).toBe(EXPECTED.floatingFeeCells);
  });

  it('cqg 列的真实通道名被保留（Topstep 是 ProjectX，不是 CQG）', () => {
    const labelled = COMMISSION_PLATFORMS.filter((p) => p.cqgLabel !== null);
    expect(labelled).toHaveLength(1);
    expect(labelled[0]!.name).toBe('Topstep');
    expect(labelled[0]!.cqgLabel).toBe('ProjectX');
  });

  it('短名为空的平台会被如实导出（UI 需回退到 name）', () => {
    const empty = COMMISSION_PLATFORMS.filter((p) => p.short === '');
    // 来源数据里 7 家平台没有短名 —— 这是来源事实，不是导出缺陷
    expect(empty.length).toBeGreaterThan(0);
    for (const platform of empty) {
      expect(platform.name.length, '没有短名就必须有全名').toBeGreaterThan(0);
    }
  });
});

describe('合约规格表（contractSpecs.ts）', () => {
  it('数量与来源页一致，且代码唯一', () => {
    expect(CONTRACT_SPECS).toHaveLength(EXPECTED.contractSpecs);
    const codes = CONTRACT_SPECS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('规格数值合法：点值与最小变动为正，小数位非负整数', () => {
    for (const spec of CONTRACT_SPECS) {
      expect(Number.isFinite(spec.pointValue), `${spec.code} 点值`).toBe(true);
      expect(spec.pointValue, `${spec.code} 点值应 > 0`).toBeGreaterThan(0);
      expect(spec.tickSize, `${spec.code} 最小变动应 > 0`).toBeGreaterThan(0);
      expect(Number.isInteger(spec.decimals), `${spec.code} 小数位应为整数`).toBe(true);
      expect(spec.decimals, `${spec.code} 小数位应 >= 0`).toBeGreaterThanOrEqual(0);
    }
  });

  it('极小最小变动没有退化成 0（日元 6J 是 0.0000005）', () => {
    const yen = CONTRACT_SPECS.find((s) => s.code === '6J');
    expect(yen, '应存在 6J').toBeDefined();
    expect(yen!.tickSize).toBe(0.0000005);
    expect(yen!.tickSize, '不能被浮点误差或格式化拍成 0').toBeGreaterThan(0);
  });
});

describe('机构数据库（firms.ts）', () => {
  it('数量与来源一致，slug 唯一', () => {
    expect(FIRMS).toHaveLength(EXPECTED.firms);
    const slugs = FIRMS.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('只有 1 家没有卡片，且它是被明确标记的（不是静默消失）', () => {
    const noCard = FIRMS.filter((f) => !f.cardAvailable);
    expect(noCard).toHaveLength(EXPECTED.firms - EXPECTED.firmsWithCard);
    expect(noCard.map((f) => f.slug)).toEqual(['p1futures']);
    // 没有卡片的机构，其归一化字段应全部落到 unknown/null，而不是编造一个值
    for (const firm of noCard) {
      expect(firm.profitSplit).toBeNull();
      expect(firm.maxAccounts).toBeNull();
      expect(firm.drawdownType).toBe('unknown');
      expect(firm.vpnPolicy).toBe('unknown');
      expect(firm.cnSupport).toBe('unknown');
    }
  });

  it('枚举值全部落在值域内', () => {
    for (const firm of FIRMS) {
      expect(DRAWDOWN_TYPES, `${firm.slug} 回撤类型`).toContain(firm.drawdownType);
      expect(VPN_POLICIES, `${firm.slug} VPN 政策`).toContain(firm.vpnPolicy);
      expect(TRI_STATES, `${firm.slug} 大陆支持`).toContain(firm.cnSupport);
    }
  });

  it('原始文本 5 个字段齐全，且归一化结果不与之矛盾', () => {
    for (const firm of FIRMS) {
      for (const key of [
        'profitSplit',
        'drawdownType',
        'vpnPolicy',
        'cnSupport',
        'maxAccounts',
      ] as const) {
        expect(firm.raw, `${firm.slug}.raw.${key}`).toHaveProperty(key);
      }
      // 原文为空 -> 归一化必须是 unknown/null，不能凭空造值
      if (!firm.raw.drawdownType) expect(firm.drawdownType).toBe('unknown');
      if (!firm.raw.vpnPolicy) expect(firm.vpnPolicy).toBe('unknown');
      if (!firm.raw.cnSupport) expect(firm.cnSupport).toBe('unknown');
      if (!firm.raw.profitSplit) expect(firm.profitSplit).toBeNull();
    }
  });

  it('「未知」不会被误报成「不支持」——大陆支持情况绝大多数是未知', () => {
    const unsupported = FIRMS.filter((f) => f.cnSupport === 'no');
    expect(unsupported).toHaveLength(EXPECTED.firmsCnUnsupported);
    expect(unsupported.map((f) => f.slug).sort()).toEqual(['apex', 'bulenox']);

    const unknown = FIRMS.filter((f) => f.cnSupport === 'unknown');
    // 关键：如果哪天有人把 unknown 塌缩成 no，这个数会掉到 0，测试立刻失败
    expect(unknown.length, '未知必须是未知，不能被塌缩成否').toBeGreaterThan(10);
    expect(FIRMS.filter((f) => f.cnSupport === 'yes')).toHaveLength(0);
  });

  it('区间分成被解析成 min/max，且与原文一致', () => {
    const tpt = FIRMS.find((f) => f.slug === 'tpt');
    expect(tpt?.raw.profitSplit).toBe('80-90%');
    expect(tpt?.profitSplit).toEqual({ min: 80, max: 90 });

    // 单值应解析成 min === max
    const topstep = FIRMS.find((f) => f.slug === 'topstep');
    expect(topstep?.profitSplit).toEqual({ min: 90, max: 90 });
  });

  it('有歧义的账号上限不硬猜（`5+5` / `根据类型` 一律 null 且保留原文）', () => {
    const ambiguous = FIRMS.filter(
      (f) => f.maxAccounts === null && f.raw.maxAccounts !== null,
    );
    expect(ambiguous.length).toBeGreaterThan(0);
    for (const firm of ambiguous) {
      expect(firm.raw.maxAccounts, `${firm.slug} 原文应保留`).toBeTruthy();
    }
  });

  it('★ 关联的预设 id 必须真实存在于 presets.ts', () => {
    const known = new Set(PRESETS.map((p) => p.id));
    for (const firm of FIRMS) {
      for (const ref of firm.presetRefs) {
        expect(known, `${firm.slug} 引用了不存在的预设 ${ref.id}`).toContain(ref.id);
      }
    }
  });

  it('只有已核对过 ROI 参数的机构才允许挂预设', () => {
    const withPreset = FIRMS.filter((f) => f.presetRefs.length > 0);
    expect(withPreset).toHaveLength(EXPECTED.firmsWithPreset);
    expect(withPreset.map((f) => f.slug).sort()).toEqual([
      'alpha',
      'apex',
      'bulenox',
      'e2t',
      'fundednext',
      'lucid',
      'topstep',
      'tpt',
      'tradeday',
      'tradeify',
    ]);
    // FundedNext 有 3 条产品线预设
    const fn = FIRMS.find((f) => f.slug === 'fundednext');
    expect(fn?.presetRefs).toHaveLength(3);
    // Apex 有 2 条产品线预设 (EOD + Intraday)
    const apex = FIRMS.find((f) => f.slug === 'apex');
    expect(apex?.presetRefs).toHaveLength(2);
  });

  it('产品线不同时不硬关联，而是写明原因', () => {
    const ftmo = FIRMS.find((f) => f.slug === 'ftmofutures');
    expect(ftmo, '应存在 ftmofutures').toBeDefined();
    expect(ftmo!.presetRefs, 'FTMO 期货与 FTMO 外汇预设不是同一产品').toEqual([]);
    expect(ftmo!.presetMappingNote, '必须给出原因，不能只是空白').toBeTruthy();
  });

  it('已知的机构级/产品级分歧被如实保留（Apex 卡片 Intraday vs 预设 EOD）', () => {
    const apex = FIRMS.find((f) => f.slug === 'apex');
    expect(apex?.drawdownType, '卡片是机构级摘要').toBe('intraday');
    const preset = PRESETS.find((p) => p.id === 'apex-50k-eod');
    expect(preset, '已核对预设是 50K EOD 产品').toBeDefined();
  });

  it('来源 URL 可追溯', () => {
    for (const firm of FIRMS) {
      expect(firm.sourceUrl, `${firm.slug} 缺少来源`).toMatch(/^https:\/\//);
      expect(firm.crawledAt, `${firm.slug} 缺少抓取时间`).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });
});
