import {
  COMMISSION_PLATFORMS,
  COMMISSION_INSTRUMENTS,
  type CommissionFee,
  type CommissionPlatform,
  type CommissionInstrument,
} from '../data/commissions';
import { CONTRACT_SPECS, type ContractSpec } from '../data/contractSpecs';
import { h } from './dom';

export interface LookupModalInstance {
  open: (initialTab?: 'commissions' | 'specs') => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

function formatFeeCell(cell: CommissionFee | null | undefined): string {
  if (!cell) return '—';
  if (cell.min === cell.max) return `$${cell.min.toFixed(2)}`;
  return `$${cell.min.toFixed(2)}~$${cell.max.toFixed(2)}`;
}

export function createLookupModal(): LookupModalInstance {
  let activeTab: 'commissions' | 'specs' = 'commissions';
  let opened = false;
  let filterText = '';

  const overlay = h('div', { class: 'modal-overlay is-hidden', 'aria-hidden': 'true' });
  const modal = h('div', { class: 'modal modal--lookup', role: 'dialog', 'aria-label': '费率与合约规格速查' });

  // 头部
  const header = h('div', { class: 'modal__header' }, [
    h('div', { class: 'modal__title-wrap' }, [
      h('h2', { class: 'modal__title', text: '手续费与期货合约规格速查' }),
      h('p', { class: 'modal__subtitle', text: '内置 propfirmvip 真实数据，小白无需跳出网站逐页查询' }),
    ]),
    h('button', {
      class: 'btn btn--chip btn--close',
      type: 'button',
      'aria-label': '关闭',
      html: '✕ 关闭',
    }),
  ]);

  header.querySelector('.btn--close')?.addEventListener('click', () => closeModal());

  // 选项卡栏
  const tabBar = h('div', { class: 'modal__tabs' }, [
    h('button', {
      class: 'tab-btn is-active',
      type: 'button',
      'data-tab': 'commissions',
      text: '平台手续费对比 (17家平台)',
    }),
    h('button', {
      class: 'tab-btn',
      type: 'button',
      'data-tab': 'specs',
      text: '期货合约点值规则 (13个品种)',
    }),
  ]);

  tabBar.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab as 'commissions' | 'specs';
      if (tab === activeTab) return;
      activeTab = tab;
      tabBar.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderContent();
    });
  });

  const contentArea = h('div', { class: 'modal__content' });

  // 渲染手续费 Tab
  function renderCommissionsTab(): HTMLElement {
    const wrap = h('div', { class: 'lookup-section' });

    const searchInput = h('input', {
      class: 'input input--search',
      type: 'text',
      placeholder: '搜索平台名称（如 Apex, Topstep, Lucid...）',
      value: filterText,
    });

    searchInput.addEventListener('input', (e) => {
      filterText = (e.target as HTMLInputElement).value.trim().toLowerCase();
      renderTableBody();
    });

    const searchWrap = h('div', { class: 'lookup-search-bar' }, [
      searchInput,
      h('span', { class: 'lookup-search-bar__hint', text: '单位：美元 / 每轮（开仓 + 平仓）' }),
    ]);

    const tableWrap = h('div', { class: 'lookup-table-scroll' });
    const table = h('table', { class: 'lookup-table' });

    // 表头
    const thead = h('thead', {}, [
      h('tr', { class: 'lookup-table__group-row' }, [
        h('th', { rowspan: 2, class: 'th--platform', text: '平台名称' }),
        h('th', { colspan: COMMISSION_INSTRUMENTS.length, class: 'th--group th--cqg', text: 'CQG 数据源 (或对应主通道)' }),
        h('th', { colspan: COMMISSION_INSTRUMENTS.length, class: 'th--group th--rithmic', text: 'Rithmic 数据源' }),
      ]),
      h('tr', { class: 'lookup-table__inst-row' }, [
        ...COMMISSION_INSTRUMENTS.map((inst: CommissionInstrument) => h('th', { text: inst })),
        ...COMMISSION_INSTRUMENTS.map((inst: CommissionInstrument) => h('th', { text: inst })),
      ]),
    ]);

    const tbody = h('tbody');

    function renderTableBody(): void {
      const filtered: CommissionPlatform[] = COMMISSION_PLATFORMS.filter((p: CommissionPlatform) => {
        if (!filterText) return true;
        return (
          p.name.toLowerCase().includes(filterText) ||
          (p.short && p.short.toLowerCase().includes(filterText))
        );
      });

      if (filtered.length === 0) {
        tbody.replaceChildren(
          h('tr', {}, [
            h('td', { colspan: 13, class: 'td--empty', text: '未找到匹配的平台' }),
          ]),
        );
        return;
      }

      const rows: HTMLElement[] = [];
      for (const p of filtered) {
        const nameText = p.short && p.short !== p.name ? `${p.name} (${p.short})` : p.name;
        const cqgLabelNote = p.cqgLabel ? ` [${p.cqgLabel}]` : '';

        const row = h('tr', {}, [
          h('td', { class: 'td--name' }, [
            h('span', { text: nameText + cqgLabelNote }),
          ]),
          // CQG 列
          ...COMMISSION_INSTRUMENTS.map((inst: CommissionInstrument) =>
            h('td', {
              class: p.cqg ? 'td--rate' : 'td--null',
              text: p.cqg ? formatFeeCell(p.cqg[inst]) : '—',
            }),
          ),
          // Rithmic 列
          ...COMMISSION_INSTRUMENTS.map((inst: CommissionInstrument) =>
            h('td', {
              class: p.rithmic ? 'td--rate' : 'td--null',
              text: p.rithmic ? formatFeeCell(p.rithmic[inst]) : '—',
            }),
          ),
        ]);
        rows.push(row);
      }
      tbody.replaceChildren(...rows);
    }

    renderTableBody();
    table.append(thead, tbody);
    tableWrap.append(table);

    const notes = h('div', { class: 'lookup-notes' }, [
      h('p', { text: '💡 重点避坑提示：' }),
      h('ul', {}, [
        h('li', { text: '注 1：Topstep 的数据源实际为 ProjectX（该平台仅支持单一数据源）。' }),
        h('li', { text: '注 2：9 家平台不提供 Rithmic 数据源，单元格以「—」表示（代表该平台不支持此数据源，不是数据缺失）。' }),
        h('li', { text: '注 3：浮动费率（如 TradersLaunch）按区间显示，实际费用以所选行情插件为准。' }),
      ]),
    ]);

    wrap.append(searchWrap, tableWrap, notes);
    return wrap;
  }

  // 渲染合约规格 Tab
  function renderSpecsTab(): HTMLElement {
    const wrap = h('div', { class: 'lookup-section' });

    const intro = h('div', { class: 'lookup-intro' }, [
      h('p', {
        text: '期货点值（Point Value）决定了价格波动 1.0 个大点时的盈亏金额；最小跳动（Tick）为盘口报价的最小单位。',
      }),
    ]);

    const tableWrap = h('div', { class: 'lookup-table-scroll' });
    const table = h('table', { class: 'lookup-table lookup-table--specs' });

    const thead = h('thead', {}, [
      h('tr', {}, [
        h('th', { text: '合约代码' }),
        h('th', { text: '合约全称' }),
        h('th', { text: '点值 (USD/点)' }),
        h('th', { text: '最小跳动 (Tick)' }),
        h('th', { text: '单跳盈亏 (USD/Tick)' }),
        h('th', { text: '小数位' }),
      ]),
    ]);

    const tbody = h('tbody');
    const rows = CONTRACT_SPECS.map((spec: ContractSpec) => {
      const tickValue = (spec.pointValue * spec.tickSize).toFixed(2);
      return h('tr', {}, [
        h('td', { class: 'td--code', text: spec.code }),
        h('td', { class: 'td--name', text: spec.name }),
        h('td', { class: 'td--num', text: `$${spec.pointValue.toLocaleString()}` }),
        h('td', { class: 'td--num', text: String(spec.tickSize) }),
        h('td', { class: 'td--num td--highlight', text: `$${tickValue}` }),
        h('td', { class: 'td--num', text: String(spec.decimals) }),
      ]);
    });

    tbody.append(...rows);
    table.append(thead, tbody);
    tableWrap.append(table);

    const tips = h('div', { class: 'lookup-notes' }, [
      h('p', { text: '💡 新手速查指引：' }),
      h('ul', {}, [
        h('li', { text: '纳指 NQ 1 个大点 = $20（波动 0.25 跳动一次为 $5）；微型纳指 MNQ 为其 1/10，1 个大点 = $2（跳动一次 $0.5）。' }),
        h('li', { text: '标普 ES 1 个大点 = $50（单跳 $12.5）；微型标普 MES 1 个大点 = $5（单跳 $1.25）。' }),
        h('li', { text: '新手考试强烈建议首选 MNQ / MES 等微型合约，仓位弹性高，不易因单笔行情瞬间击穿最大回撤。' }),
      ]),
    ]);

    wrap.append(intro, tableWrap, tips);
    return wrap;
  }

  function renderContent(): void {
    if (activeTab === 'commissions') {
      contentArea.replaceChildren(renderCommissionsTab());
    } else {
      contentArea.replaceChildren(renderSpecsTab());
    }
  }

  const body = h('div', { class: 'modal__body' }, [tabBar, contentArea]);
  modal.append(header, body);
  overlay.append(modal);
  document.body.append(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && opened) closeModal();
  });

  function openModal(initialTab?: 'commissions' | 'specs'): void {
    if (initialTab) {
      activeTab = initialTab;
      tabBar.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.tab === activeTab);
      });
    }
    opened = true;
    overlay.classList.remove('is-hidden');
    document.body.style.overflow = 'hidden';
    renderContent();
  }

  function closeModal(): void {
    opened = false;
    overlay.classList.add('is-hidden');
    document.body.style.overflow = '';
  }

  return {
    open: openModal,
    close: closeModal,
    toggle: () => (opened ? closeModal() : openModal()),
    isOpen: () => opened,
  };
}
