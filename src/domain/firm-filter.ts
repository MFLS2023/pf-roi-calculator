import {
  FIRMS,
  type DrawdownType,
  type Firm,
  type TriState,
  type VpnPolicy,
} from '../data/firms';

/**
 * 机构看板的筛选逻辑。
 *
 * 刻意放在 `domain/` 而不是生成的数据文件里：`src/data/firms.ts` 是
 * `propfirmvip-crawler/export_web.py` 的产物，重新导出会整体覆盖 ——
 * 任何写在里面的逻辑都会被冲掉。这里只依赖数据，不依赖 DOM，所以能单测。
 */

/** 每个维度的可选值，顺序即 UI 展示顺序。 */
export const DRAWDOWN_VALUES: readonly DrawdownType[] = [
  'eod',
  'intraday',
  'tdd',
  'static',
  'unknown',
] as const;

export const VPN_VALUES: readonly VpnPolicy[] = [
  'allowed',
  'conditional',
  'discouraged',
  'forbidden',
  'unknown',
] as const;

export const CN_VALUES: readonly TriState[] = ['yes', 'no', 'unknown'] as const;

export type FilterDimension = 'drawdown' | 'vpn' | 'cn';

/**
 * 三个筛选维度。每个维度都是「已选中的值集合」——
 * 全选 = 该维度不过滤。用集合而不是单选，是因为「未标注」本身
 * 就是一个用户可能想单独看的值（例如只看来源没标大陆支持的机构）。
 */
export interface FirmFilters {
  readonly drawdown: ReadonlySet<DrawdownType>;
  readonly vpn: ReadonlySet<VpnPolicy>;
  readonly cn: ReadonlySet<TriState>;
}

/** 每个维度的值域，供 UI 生成筛选控件。 */
export const FILTER_VALUES: Readonly<Record<FilterDimension, readonly string[]>> = {
  drawdown: DRAWDOWN_VALUES,
  vpn: VPN_VALUES,
  cn: CN_VALUES,
} as const;

/** 全选状态（= 不做任何过滤）。 */
export function allFilters(): FirmFilters {
  return {
    drawdown: new Set(DRAWDOWN_VALUES),
    vpn: new Set(VPN_VALUES),
    cn: new Set(CN_VALUES),
  };
}

/**
 * 看板上应当出现的机构。
 *
 * 排除 `cardAvailable === false` 的机构：来源页面当时没有键值卡片
 * （页面改版 / 快照早于更新），显示一张空卡只会让人以为页面坏了。
 * 这不是「静默丢弃」—— 数据里仍保留该机构，等下次增量抓取补上卡片后
 * 会自动出现在看板上。
 */
export function visibleFirms(): readonly Firm[] {
  return FIRMS.filter((firm) => firm.cardAvailable);
}

/**
 * 一家机构实际覆盖的回撤类型 = 机构卡片值 ∪ 各条已核对产品线的回撤类型。
 *
 * 为什么是并集：卡片是**机构级摘要**、预设是**产品级**，两者可能不一致。
 * 已知实例：Apex 卡片写 Intraday，但它已核对的产品线是 50K EOD 账户。
 * 如果只看卡片，筛「EOD」会把 Apex 漏掉 —— 而它其实有 EOD 产品。
 */
export function effectiveDrawdownTypes(firm: Firm): ReadonlySet<DrawdownType> {
  const types = new Set<DrawdownType>([firm.drawdownType]);
  for (const ref of firm.presetRefs) {
    if (ref.drawdownType) types.add(ref.drawdownType);
  }
  return types;
}

/** 单家机构是否通过当前筛选。 */
export function firmMatches(firm: Firm, filters: FirmFilters): boolean {
  if (!filters.cn.has(firm.cnSupport)) return false;
  if (!filters.vpn.has(firm.vpnPolicy)) return false;

  // 回撤类型看「机构卡片 ∪ 已核对产品线」
  for (const type of effectiveDrawdownTypes(firm)) {
    if (filters.drawdown.has(type)) return true;
  }
  return false;
}

/** 按当前筛选过滤后的机构列表（顺序保持数据源顺序）。 */
export function filterFirms(
  filters: FirmFilters,
  firms: readonly Firm[] = visibleFirms(),
): readonly Firm[] {
  return firms.filter((firm) => firmMatches(firm, filters));
}

/**
 * 统计某个维度上每个取值有多少家机构（**基于未筛选的全量**）。
 *
 * 用全量而不是当前结果：筛选控件上显示的数字应当是稳定的总体分布，
 * 否则用户一点筛选，所有数字都在跳，反而看不清「本来有多少家」。
 */
export function countByDimension(
  dimension: FilterDimension,
  firms: readonly Firm[] = visibleFirms(),
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const value of FILTER_VALUES[dimension]) counts.set(value, 0);
  for (const firm of firms) {
    if (dimension === 'drawdown') {
      // 回撤维度按并集统计，与筛选口径一致，避免「显示 17 家但筛出 18 家」
      for (const type of effectiveDrawdownTypes(firm)) {
        counts.set(type, (counts.get(type) ?? 0) + 1);
      }
      continue;
    }
    const value = dimension === 'vpn' ? firm.vpnPolicy : firm.cnSupport;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/** 切换某维度上的一个取值；全选与全不选都会导致「无结果」，由 UI 提示。 */
export function toggleFilterValue(
  filters: FirmFilters,
  dimension: FilterDimension,
  value: string,
): FirmFilters {
  const current = new Set(filters[dimension] as Set<string>);
  if (current.has(value)) current.delete(value);
  else current.add(value);
  return { ...filters, [dimension]: current } as FirmFilters;
}

/** 某维度是否处于「全选」（= 该维度未生效）。 */
export function isDimensionUnfiltered(
  filters: FirmFilters,
  dimension: FilterDimension,
): boolean {
  return filters[dimension].size === FILTER_VALUES[dimension].length;
}

/** 是否有任何一个维度被改动过。 */
export function isAnyFilterActive(filters: FirmFilters): boolean {
  return (['drawdown', 'vpn', 'cn'] as const).some(
    (dimension) => !isDimensionUnfiltered(filters, dimension),
  );
}
