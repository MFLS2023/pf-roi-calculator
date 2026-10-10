import { type Firm, type TriState, type VpnPolicy, type DrawdownType } from '../data/firms';
import { getPreset, type Confidence } from '../data/presets';
import {
  allFilters,
  filterFirms,
  countByDimension,
  toggleFilterValue,
  type FirmFilters,
  type FilterDimension,
} from '../domain/firm-filter';
import { h, qs } from './dom';
import { toast } from './toast';

/** verifiedAt is YYYY-MM; treat older than ~90 days as possibly stale. */
function isVerifiedStale(verifiedAt: string): boolean {
  const m = /^(\d{4})-(\d{2})$/.exec(verifiedAt);
  if (!m) return true;
  const verified = Date.UTC(Number(m[1]), Number(m[2]) - 1, 1);
  const now = Date.now();
  return now - verified > 90 * 24 * 60 * 60 * 1000;
}

function confidenceBadgeText(confidence: Confidence, verifiedAt: string): string {
  const stale = isVerifiedStale(verifiedAt);
  const base = `核实 ${verifiedAt} · ${confidence}`;
  return stale ? `${base} · 可能过期` : base;
}

export interface FirmsBoardOptions {
  onApplyPreset: (presetId: string) => void;
}

export interface FirmsBoardInstance {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

function getPresetButtonLabel(firmSlug: string, presetId: string): string {
  switch (presetId) {
    case 'apex-50k-eod':
      return '50K EOD 日终';
    case 'apex-50k-intraday':
      return '50K 盘中追踪';
    case 'fundednext-stellar-100k':
      return 'Stellar 100K';
    case 'fundednext-rapid-25k':
      return 'Rapid 25K';
    case 'fundednext-flex-50k':
      return 'Flex 50K';
    default:
      return presetId.replace(`${firmSlug}-`, '').toUpperCase();
  }
}

function openPendingFirmModal(firm: Firm, options: FirmsBoardOptions): void {
  const overlay = h('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  const closeBtn = h('button', {
    class: 'btn btn--chip btn--close',
    type: 'button',
    text: '✕',
  });
  closeBtn.addEventListener('click', () => overlay.remove());

  const ackBtn = h('button', {
    class: 'btn btn--chip btn--sm',
    type: 'button',
    text: '关闭',
  });
  ackBtn.addEventListener('click', () => overlay.remove());

  const templateBtn = h('button', {
    class: 'btn btn--primary btn--sm',
    type: 'button',
    text: '💡 载入标准 50K 模板快速估算',
  });
  templateBtn.addEventListener('click', () => {
    overlay.remove();
    options.onApplyPreset('standard-50k-template');
    toast(
      `已载入【通用】标准 50K 模板（非 ${firm.name} 官方参数），请按官网实付改价`,
      'success',
      5000,
    );
    const form = qs('#form-pane');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const dialog = h('div', { class: 'firm-detail-dialog' }, [
    h('div', { class: 'firm-detail-dialog__header' }, [
      h('h3', { class: 'firm-detail-dialog__title', text: `${firm.name} · ROI 参数核对说明` }),
      closeBtn,
    ]),
    h('ul', { class: 'firm-detail-dialog__meta-list' }, [
      h('li', {}, [h('strong', { text: '分成比例：' }), h('span', { text: firm.raw.profitSplit || '未标注' })]),
      h('li', {}, [h('strong', { text: '回撤类型：' }), h('span', { text: firm.raw.drawdownType || '未标注' })]),
      h('li', {}, [h('strong', { text: '梯子政策：' }), h('span', { text: firm.raw.vpnPolicy || '未标注' })]),
      h('li', {}, [h('strong', { text: '账号上限：' }), h('span', { text: firm.raw.maxAccounts || '未标注' })]),
      h('li', {}, [
        h('strong', { text: '大陆支持：' }),
        h('span', { text: firm.raw.cnSupport || '未标注（不是「不支持」）' }),
      ]),
    ]),
    h('p', {
      class: 'firm-detail-dialog__hint',
      text:
        firm.presetMappingNote ||
        '该机构的基础规则已归集，但具体产品报名费因常年大额促销（往往有 50%~90% 折扣）波动较大。',
    }),
    h('p', {
      class: 'firm-detail-dialog__hint firm-detail-dialog__hint--warn',
      style: 'margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: color-mix(in srgb, var(--accent) 12%, transparent); font-size: 13px; line-height: 1.45;',
      text: '⚠️「标准 50K 模板」是行业通用估算模型，不是该机构的官方报价。载入后请务必按官网实付价格与出金规则修改左侧参数。',
    }),
    h('div', { class: 'modal__actions', style: 'display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;' }, [
      templateBtn,
      firm.officialUrl
        ? h('a', {
            class: 'btn btn--outline btn--sm',
            href: firm.officialUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            text: '打开官网查看最新报价 ↗',
          })
        : null,
      h('a', {
        class: 'btn btn--outline btn--sm',
        href: firm.sourceUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        text: '规则页 ↗',
      }),
      ackBtn,
    ].filter(Boolean) as HTMLElement[]),
  ]);

  overlay.append(dialog);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.append(overlay);
}

/** 辅助格式化标签文本与颜色 */
function formatDrawdownLabel(type: DrawdownType): { label: string; cls: string } {
  switch (type) {
    case 'eod':
      return { label: 'EOD 日终回撤', cls: 'badge--positive' };
    case 'intraday':
      return { label: '日内尾随回撤', cls: 'badge--warning' };
    case 'tdd':
      return { label: 'TDD 追踪回撤', cls: 'badge--warning' };
    case 'static':
      return { label: '静态回撤', cls: 'badge--info' };
    default:
      return { label: '回撤未标注', cls: 'badge--neutral' };
  }
}

function formatVpnLabel(policy: VpnPolicy, rawText: string | null): { label: string; cls: string } {
  switch (policy) {
    case 'allowed':
      return { label: rawText ? `梯子: ${rawText}` : '允许使用梯子', cls: 'badge--positive' };
    case 'conditional':
      return { label: rawText ? `梯子: ${rawText}` : '梯子有条件限制', cls: 'badge--warning' };
    case 'discouraged':
      return { label: rawText ? `梯子: ${rawText}` : '建议不使用梯子', cls: 'badge--warning' };
    case 'forbidden':
      return { label: rawText ? `梯子: ${rawText}` : '严禁使用梯子', cls: 'badge--negative' };
    default:
      return { label: '梯子政策未标注', cls: 'badge--neutral' };
  }
}

function formatCnLabel(support: TriState, rawText: string | null): { label: string; cls: string } {
  switch (support) {
    case 'yes':
      return { label: rawText ? `大陆: ${rawText}` : '支持大陆直连', cls: 'badge--positive' };
    case 'no':
      return { label: rawText ? `大陆: ${rawText}` : '不支持中国大陆', cls: 'badge--negative' };
    default:
      return { label: '大陆支持未标注', cls: 'badge--neutral' };
  }
}

export function createFirmsBoard(options: FirmsBoardOptions): FirmsBoardInstance {
  let filters: FirmFilters = allFilters();
  let opened = false;

  const overlay = h('div', { class: 'drawer-overlay is-hidden', 'aria-hidden': 'true' });
  const drawer = h('div', { class: 'drawer drawer--firms', role: 'dialog', 'aria-label': '机构选型看板' });

  // 头部
  const header = h('div', { class: 'drawer__header' }, [
    h('div', { class: 'drawer__title-wrap' }, [
      h('h2', { class: 'drawer__title', text: '自营交易机构选型看板' }),
      h('p', { class: 'drawer__subtitle', text: '对比 22 家机构分成、回撤、VPN 与大陆政策，避坑防封' }),
    ]),
    h('button', {
      class: 'btn btn--chip btn--close',
      type: 'button',
      'aria-label': '关闭',
      html: '✕ 关闭',
    }),
  ]);

  header.querySelector('.btn--close')?.addEventListener('click', () => closeDrawer());

  // 筛选区
  const filterSection = h('div', { class: 'drawer__filters' });

  function renderFilterGroup(
    dimension: FilterDimension,
    title: string,
    values: readonly string[],
    labels: Record<string, string>,
  ): HTMLElement {
    const counts = countByDimension(dimension);
    const wrap = h('div', { class: 'filter-group' }, [
      h('span', { class: 'filter-group__label', text: title }),
    ]);

    const chipsWrap = h('div', { class: 'filter-group__chips' });
    for (const val of values) {
      const isSelected = (filters[dimension] as Set<string>).has(val);
      const count = counts.get(val) ?? 0;
      const chip = h(
        'button',
        {
          class: `filter-chip ${isSelected ? 'is-active' : ''}`,
          type: 'button',
        },
        [
          h('span', { class: 'filter-chip__text', text: labels[val] || val }),
          h('span', { class: 'filter-chip__count', text: String(count) }),
        ],
      );

      chip.addEventListener('click', () => {
        filters = toggleFilterValue(filters, dimension, val);
        renderFilters();
        renderCards();
      });

      chipsWrap.append(chip);
    }

    wrap.append(chipsWrap);
    return wrap;
  }

  function renderFilters(): void {
    const cnUnknown = countByDimension('cn').get('unknown') ?? 0;
    const vpnUnknown = countByDimension('vpn').get('unknown') ?? 0;
    const ddUnknown = countByDimension('drawdown').get('unknown') ?? 0;
    filterSection.replaceChildren(
      renderFilterGroup('drawdown', '回撤类型', ['eod', 'intraday', 'tdd', 'static', 'unknown'], {
        eod: 'EOD 日终',
        intraday: '日内尾随',
        tdd: 'TDD 追踪',
        static: '静态回撤',
        unknown: ddUnknown > 0 ? `未标注 (${ddUnknown})` : '未标注',
      }),
      renderFilterGroup('vpn', '梯子/VPN', ['allowed', 'conditional', 'discouraged', 'forbidden', 'unknown'], {
        allowed: '允许',
        conditional: '有条件',
        discouraged: '不建议',
        forbidden: '严禁',
        unknown: vpnUnknown > 0 ? `未标注 (${vpnUnknown})` : '未标注',
      }),
      renderFilterGroup('cn', '大陆用户', ['yes', 'no', 'unknown'], {
        yes: '明确支持',
        no: '明确不支持',
        unknown: cnUnknown > 0 ? `未标注 (${cnUnknown}家)` : '未标注',
      }),
    );
  }

  // 卡片容器
  const statusMeta = h('div', { class: 'drawer__status-meta' });
  const cardsGrid = h('div', { class: 'firms-grid' });

  function renderCards(): void {
    const list = filterFirms(filters);
    statusMeta.replaceChildren(
      h('span', {
        class: 'drawer__count-info',
        text: `显示 ${list.length} / 21 家机构（空卡 p1futures 已自动折叠）`,
      }),
      h('button', {
        class: 'btn btn--text',
        type: 'button',
        text: '重置所有筛选',
      }),
    );

    statusMeta.querySelector('.btn--text')?.addEventListener('click', () => {
      filters = allFilters();
      renderFilters();
      renderCards();
    });

    if (list.length === 0) {
      cardsGrid.replaceChildren(
        h('div', { class: 'empty-state' }, [
          h('p', { class: 'empty-state__title', text: '未找到符合条件的机构' }),
          h('p', { class: 'empty-state__hint', text: '请尝试放宽筛选条件（例如取消勾选或点击“重置所有筛选”）' }),
        ]),
      );
      return;
    }

    const cards: HTMLElement[] = [];
    for (const firm of list) {
      const dd = formatDrawdownLabel(firm.drawdownType);
      const vpn = formatVpnLabel(firm.vpnPolicy, firm.raw.vpnPolicy);
      const cn = formatCnLabel(firm.cnSupport, firm.raw.cnSupport);

      // 分成显示
      let splitText = '分成未标注';
      if (firm.profitSplit) {
        splitText =
          firm.profitSplit.min === firm.profitSplit.max
            ? `${firm.profitSplit.min}% 分成`
            : `${firm.profitSplit.min}%~${firm.profitSplit.max}% 分成`;
      } else if (firm.raw.profitSplit) {
        splitText = firm.raw.profitSplit;
      }

      // 账号上限
      const maxText = firm.maxAccounts
        ? `上限: ${firm.maxAccounts} 个号`
        : firm.raw.maxAccounts
          ? `上限: ${firm.raw.maxAccounts}`
          : '上限未标注';

      const card = h('div', { class: 'firm-card' }, [
        h('div', { class: 'firm-card__header' }, [
          h('div', { class: 'firm-card__name-wrap' }, [
            h('h3', { class: 'firm-card__name', text: firm.name }),
            h('div', { class: 'firm-card__links' }, [
              firm.officialUrl
                ? h('a', {
                    class: 'firm-card__link firm-card__link--official',
                    href: firm.officialUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    text: '官网 ↗',
                  })
                : null,
              h('a', {
                class: 'firm-card__link',
                href: firm.sourceUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
                text: '规则页 ↗',
              }),
            ].filter(Boolean) as HTMLElement[]),
          ]),
          h('span', { class: 'firm-card__split', text: splitText }),
        ]),
        h('div', { class: 'firm-card__badges' }, [
          (() => {
            if (firm.presetRefs.length === 0) return null;
            const first = getPreset(firm.presetRefs[0].id);
            if (!first) {
              return h('span', {
                class: 'badge badge--confidence badge--medium',
                text: '核实 2026-10 · medium',
              });
            }
            const stale = isVerifiedStale(first.verifiedAt);
            return h('span', {
              class: `badge badge--confidence badge--${first.confidence}${stale ? ' badge--stale' : ''}`,
              text: confidenceBadgeText(first.confidence, first.verifiedAt),
              title: stale
                ? '核实日期距今超过约 90 天，规则可能已变更，请以官网为准'
                : undefined,
            });
          })(),
          h('span', { class: `badge ${dd.cls}`, text: dd.label }),
          h('span', { class: `badge ${vpn.cls}`, text: vpn.label }),
          h('span', { class: `badge ${cn.cls}`, text: cn.label }),
          h('span', { class: 'badge badge--neutral', text: maxText }),
        ].filter(Boolean) as HTMLElement[]),
      ]);

      // 操作与预设联动
      const actionArea = h('div', { class: 'firm-card__actions' });
      if (firm.presetRefs.length > 0) {
        if (firm.presetRefs.length === 1) {
          const btn = h('button', {
            class: 'btn btn--primary btn--sm',
            type: 'button',
            text: '⚡ 一键填入计算器',
          });
          btn.addEventListener('click', () => {
            options.onApplyPreset(firm.presetRefs[0].id);
            toast(`已载入 ${firm.name} 预设参数并重新测算`, 'success');
            closeDrawer();
            scrollFormIntoView();
          });
          actionArea.append(btn);
        } else {
          // 多条产品线
          const multiWrap = h('div', { class: 'firm-card__presets-multi' }, [
            h('span', { class: 'firm-card__presets-title', text: '可选产品预设：' }),
          ]);
          for (const ref of firm.presetRefs) {
            const btn = h('button', {
              class: 'btn btn--chip btn--sm',
              type: 'button',
              text: getPresetButtonLabel(firm.slug, ref.id),
            });
            btn.addEventListener('click', () => {
              options.onApplyPreset(ref.id);
              toast(`已载入 ${firm.name} (${ref.id}) 参数`, 'success');
              closeDrawer();
              scrollFormIntoView();
            });
            multiWrap.append(btn);
          }
          actionArea.append(multiWrap);
        }
      } else {
        const hintBtn = h('button', {
          class: 'btn btn--outline btn--sm',
          type: 'button',
          text: '📝 ROI参数待核对（点击查看）',
        });
        hintBtn.addEventListener('click', () => {
          openPendingFirmModal(firm, options);
        });
        actionArea.append(hintBtn);
      }

      card.append(actionArea);
      cards.push(card);
    }

    cardsGrid.replaceChildren(...cards);
  }

  function scrollFormIntoView(): void {
    const form = qs('#form-pane');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const body = h('div', { class: 'drawer__body' }, [filterSection, statusMeta, cardsGrid]);
  drawer.append(header, body);
  overlay.append(drawer);
  document.body.append(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDrawer();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && opened) closeDrawer();
  });

  function openDrawer(): void {
    opened = true;
    overlay.classList.remove('is-hidden');
    document.body.style.overflow = 'hidden';
    renderFilters();
    renderCards();
  }

  function closeDrawer(): void {
    opened = false;
    overlay.classList.add('is-hidden');
    document.body.style.overflow = '';
  }

  return {
    open: openDrawer,
    close: closeDrawer,
    toggle: () => (opened ? closeDrawer() : openDrawer()),
    isOpen: () => opened,
  };
}
