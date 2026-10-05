import {
  PLACEHOLDER,
  formatCount,
  formatMoney,
  formatPercent,
  formatSignedPercent,
  toneOf,
} from '../domain/formatter';
import type { SavedScenario } from '../domain/types';
import { t } from '../i18n';
import { h } from './dom';
import { icon } from './icons';

/**
 * The "compare scenarios" panel.
 *
 * Deliberately dumb: it renders whatever list it is handed and emits intent via
 * callbacks. All state lives in the store (`src/state/store.ts`), which makes the
 * panel trivially re-renderable after any locale or data change.
 */

export interface CompareCallbacks {
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onLoad: (scenario: SavedScenario) => void;
  onClearAll: () => void;
}

export interface CompareController {
  root: HTMLElement;
  render(scenarios: readonly SavedScenario[]): void;
  refreshLabels(): void;
  /** Read + clear the name input (used right after a save). */
  consumeName(): string;
}

function toneClass(roi: number): string {
  const tone = toneOf(roi);
  return tone === 'positive' ? 'value--positive' : tone === 'negative' ? 'value--negative' : 'value--neutral';
}

export function createCompare(callbacks: CompareCallbacks): CompareController {
  const dict = t();

  const title = h('h2', { class: 'compare__title', text: dict.compareTitle });
  const clearAll = h('button', {
    class: 'btn btn--chip',
    type: 'button',
    text: dict.compareClearAll,
  });
  clearAll.addEventListener('click', callbacks.onClearAll);

  const hint = h('p', { class: 'compare__hint', text: dict.compareHint });

  const nameInput = h('input', {
    class: 'compare__name',
    type: 'text',
    maxLength: 40,
    placeholder: dict.compareNamePlaceholder,
    'aria-label': dict.compareNamePlaceholder,
  });
  const saveButton = h('button', {
    class: 'btn btn--secondary',
    type: 'button',
    html: `${icon('plus', { size: 14, strokeWidth: 2.6 })}<span>${dict.compareSave}</span>`,
  });

  const doSave = (): void => callbacks.onSave(nameInput.value);
  saveButton.addEventListener('click', doSave);
  nameInput.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key === 'Enter') {
      event.preventDefault();
      doSave();
    }
  });

  const body = h('div', { class: 'compare__body' });

  const root = h('section', { class: 'compare', id: 'compare' }, [
    h('div', { class: 'compare__head' }, [title, clearAll]),
    hint,
    h('div', { class: 'compare__save-row' }, [nameInput, saveButton]),
    body,
  ]);

  function renderEmpty(): void {
    body.replaceChildren(h('p', { class: 'compare__empty', text: t().compareEmpty }));
  }

  function renderTable(scenarios: readonly SavedScenario[]): void {
    const d = t();
    const bestId =
      scenarios.length >= 2
        ? scenarios.reduce((best, s) => (s.roi > best.roi ? s : best), scenarios[0]!).id
        : null;

    const head = h('tr', {}, [
      h('th', { text: d.compareTh }),
      h('th', { text: d.compareThRoi }),
      h('th', { text: d.compareThPassRate }),
      h('th', { text: d.compareThAccounts }),
      h('th', { text: d.compareThTotalCost }),
      h('th', { text: d.compareThActions }),
    ]);

    const rows = scenarios.map((scenario) => {
      const nameCell = h('div', { class: 'compare__name-cell' }, [
        h('span', { class: 'compare__name-text', text: scenario.name, title: scenario.name }),
      ]);
      if (scenario.id === bestId) {
        nameCell.append(h('span', { class: 'badge', text: d.compareBest }));
      }

      const loadButton = h('button', {
        class: 'btn btn--chip',
        type: 'button',
        text: d.compareLoad,
        title: d.compareLoad,
      });
      loadButton.addEventListener('click', () => callbacks.onLoad(scenario));

      const deleteButton = h('button', {
        class: 'btn btn--icon',
        type: 'button',
        title: d.compareDelete,
        'aria-label': `${d.compareDelete}: ${scenario.name}`,
        html: icon('trash', { size: 13, strokeWidth: 2 }),
      });
      deleteButton.addEventListener('click', () => callbacks.onDelete(scenario.id));

      const accounts = scenario.totalPassRate > 0 ? 1 / scenario.totalPassRate : 0;

      return h(
        'tr',
        { class: scenario.id === bestId ? 'compare__row--best' : '' },
        [
          h('td', {}, [nameCell]),
          h('td', { class: toneClass(scenario.roi), text: formatSignedPercent(scenario.roi, 2) }),
          h('td', { text: formatPercent(scenario.totalPassRate, 4) }),
          h('td', { text: accounts > 0 ? formatCount(accounts, 2) : PLACEHOLDER }),
          h('td', { text: formatMoney(scenario.totalCost) }),
          h('td', {}, [h('div', { class: 'compare__row-actions' }, [loadButton, deleteButton])]),
        ],
      );
    });

    const table = h('table', { class: 'compare__table' }, [
      h('thead', {}, [head]),
      h('tbody', {}, rows),
    ]);

    body.replaceChildren(h('div', { class: 'compare__scroll' }, [table]));
  }

  renderEmpty();

  return {
    root,

    render(scenarios: readonly SavedScenario[]): void {
      if (scenarios.length === 0) {
        renderEmpty();
        return;
      }
      renderTable(scenarios);
    },

    refreshLabels(): void {
      const d = t();
      title.textContent = d.compareTitle;
      hint.textContent = d.compareHint;
      clearAll.textContent = d.compareClearAll;
      nameInput.placeholder = d.compareNamePlaceholder;
      nameInput.setAttribute('aria-label', d.compareNamePlaceholder);
      const label = saveButton.querySelector('span');
      if (label) label.textContent = d.compareSave;
    },

    consumeName(): string {
      const value = nameInput.value;
      nameInput.value = '';
      return value;
    },
  };
}
