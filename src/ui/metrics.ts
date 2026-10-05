import { formatCount, formatMoney, formatPercent, PLACEHOLDER } from '../core/formatter';
import type { CalculatorResult } from '../core/types';
import { t } from '../i18n';
import type { Dict } from '../i18n/zh-CN';
import { h, setText } from './dom';
import { icon, type IconName } from './icons';

/** One tile of the 3-column metrics board. */
interface MetricSpec {
  id: string;
  titleKey: keyof Dict;
  iconName: IconName;
  /** Accent colour of the tile's icon. */
  color: string;
  /** Slightly smaller type for longer values such as `$1531`. */
  small?: boolean;
  /** Pure function turning a result into the displayed string. */
  format: (result: CalculatorResult) => string;
}

const SPECS: readonly MetricSpec[] = [
  {
    id: 'exam-rate',
    titleKey: 'metricExamRate',
    iconName: 'check',
    color: '#3b82f6',
    format: (r) => (r.isViable ? formatPercent(r.examPassRate, 2) : PLACEHOLDER),
  },
  {
    id: 'payout-rate',
    titleKey: 'metricPayoutRate',
    iconName: 'check',
    color: '#10b981',
    format: (r) => (r.isViable ? formatPercent(r.payoutPassRate, 2) : PLACEHOLDER),
  },
  {
    id: 'total-rate',
    titleKey: 'metricTotalRate',
    iconName: 'target',
    color: '#60a5fa',
    small: true,
    format: (r) => (r.isViable ? formatPercent(r.totalPassRate, 4) : PLACEHOLDER),
  },
  {
    id: 'accounts-to-buy',
    titleKey: 'metricAccountsToBuy',
    iconName: 'briefcase',
    color: '#7c3aed',
    small: true,
    format: (r) => (r.isViable ? formatCount(r.accountsToBuy, 2) : PLACEHOLDER),
  },
  {
    id: 'funded-accounts',
    titleKey: 'metricFundedAccounts',
    iconName: 'dollar',
    color: '#f97316',
    small: true,
    format: (r) => (r.isViable ? formatCount(r.fundedAccounts, 2) : PLACEHOLDER),
  },
  {
    id: 'account-cost',
    titleKey: 'metricAccountCost',
    iconName: 'coins',
    color: '#eab308',
    small: true,
    format: (r) => (r.isViable ? formatMoney(r.accountCost) : PLACEHOLDER),
  },
  {
    id: 'activation-cost',
    titleKey: 'metricActivationCost',
    iconName: 'dollar',
    color: '#a16207',
    small: true,
    format: (r) => (r.isViable ? formatMoney(r.activationCost) : PLACEHOLDER),
  },
  {
    id: 'total-cost',
    titleKey: 'metricTotalCost',
    iconName: 'bars',
    color: '#ea580c',
    small: true,
    format: (r) => (r.isViable ? formatMoney(r.totalCost) : PLACEHOLDER),
  },
];

export interface MetricsController {
  root: HTMLElement;
  update(result: CalculatorResult): void;
  refreshLabels(): void;
}

export function createMetrics(): MetricsController {
  const dict = t();
  const root = h('div', { class: 'metrics' });
  const valueNodes = new Map<string, HTMLElement>();
  const titleNodes = new Map<string, HTMLElement>();

  for (const spec of SPECS) {
    const title = h('span', { class: 'metric__title', text: dict[spec.titleKey] });
    const value = h('div', {
      class: spec.small ? 'metric__value metric__value--sm' : 'metric__value',
      text: PLACEHOLDER,
    });

    const head = h('div', {
      class: 'metric__head',
      html: `${icon(spec.iconName, { size: 12, color: spec.color, strokeWidth: 2.4 })}`,
    });
    head.append(title);

    root.append(h('div', { class: 'metric', 'data-metric': spec.id }, [head, value]));
    valueNodes.set(spec.id, value);
    titleNodes.set(spec.id, title);
  }

  // Ninth cell keeps the 3-column grid visually balanced.
  root.append(h('div', { class: 'metric metric--placeholder', 'aria-hidden': 'true' }));

  return {
    root,

    update(result: CalculatorResult): void {
      for (const spec of SPECS) {
        setText(valueNodes.get(spec.id) ?? null, spec.format(result));
      }
    },

    refreshLabels(): void {
      const next = t();
      for (const spec of SPECS) {
        const node = titleNodes.get(spec.id);
        if (node) {
          node.textContent = next[spec.titleKey];
          node.title = next[spec.titleKey];
        }
      }
    },
  };
}
