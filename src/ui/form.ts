import { FORM_GROUPS, type FieldSpec, type GroupSpec } from '../data/form-schema';
import { DEFAULT_INPUTS } from '../domain/constants';
import type { CalculatorInputs } from '../domain/types';
import { t } from '../i18n';
import { h, must } from './dom';
import { icon } from './icons';

/**
 * The input form, generated from {@link FORM_GROUPS}.
 *
 * Nothing here knows about the maths: it only reads raw strings out of the DOM
 * and hands them to the sanitiser, and writes values back in.
 */

export interface FormController {
  root: HTMLElement;
  /** Raw (un-sanitised) values, ready for `calculate()`. */
  read(): CalculatorInputs;
  /** Push values into the inputs (used by presets / reset / scenario load). */
  write(inputs: CalculatorInputs): void;
  /** Re-render labels, units and placeholders for the active locale. */
  refreshLabels(): void;
  /** Focus the first field — used after a preset switch on desktop. */
  focusFirst(): void;
}

interface FieldRefs {
  spec: FieldSpec;
  wrapper: HTMLElement;
  label: HTMLLabelElement;
  unit: HTMLSpanElement;
  input: HTMLInputElement;
}

function unitSuffix(spec: FieldSpec): string {
  const dict = t();
  if (spec.unit === 'usd') return `(${dict.unitUsd})`;
  if (spec.unit === 'days') return `(${dict.unitDays})`;
  return '';
}

export function createForm(options: {
  onChange: () => void;
  onSubmit: () => void;
}): FormController {
  const dict = t();
  const refs: FieldRefs[] = [];
  const root = h('div', { class: 'form' });

  const buildGroup = (group: GroupSpec, index: number): HTMLElement => {
    const grid = h('div', { class: 'grid-2' });

    for (const spec of group.fields) {
      const inputId = `f-${spec.key}`;
      const unit = h('span', { class: 'field__unit', text: unitSuffix(spec) });
      const label = h(
        'label',
        { class: 'field__label', for: inputId, title: dict[spec.hintKey] },
        [document.createTextNode(`${dict[spec.labelKey]} `), unit],
      );

      const input = h('input', {
        class: 'field__input',
        id: inputId,
        type: 'number',
        inputMode: spec.inputMode,
        min: spec.min,
        step: spec.step,
        value: DEFAULT_INPUTS[spec.key],
        autocomplete: 'off',
        'aria-label': dict[spec.labelKey],
      });

      // Live recalculation on every keystroke — the "silky" feel from the spec.
      input.addEventListener('input', options.onChange);
      input.addEventListener('change', options.onChange);
      // Enter recalculates and blurs, which dismisses the mobile keypad.
      input.addEventListener('keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
          event.preventDefault();
          options.onSubmit();
          input.blur();
        }
      });

      const wrapper = h('div', { class: 'field' }, [label, input]);
      grid.append(wrapper);
      refs.push({ spec, wrapper, label, unit, input });
    }

    const head = h('div', { class: 'group__head' }, [
      h('div', { class: 'group__head-left' }, [
        h('span', { class: 'group__step', text: String(index + 1).padStart(2, '0') }),
        h('span', { class: 'group__title', text: dict[group.titleKey] }),
      ]),
      h('span', { class: 'group__tag', text: dict[group.tagKey] }),
    ]);

    return h('section', { class: 'group', 'data-group': group.id }, [head, grid]);
  };

  FORM_GROUPS.forEach((group, index) => root.append(buildGroup(group, index)));

  // The primary action lives inside the form pane, directly under the fields.
  const calcButton = h('button', {
    class: 'btn btn--primary',
    type: 'button',
    id: 'calc-btn',
    html: `${icon('bolt', { size: 16, strokeWidth: 2.4 })}<span>${dict.calculate}</span>`,
  });
  calcButton.addEventListener('click', options.onSubmit);
  root.append(calcButton);

  return {
    root,

    read(): CalculatorInputs {
      const out = {} as CalculatorInputs;
      for (const ref of refs) {
        const raw = Number.parseFloat(ref.input.value);
        out[ref.spec.key] = Number.isFinite(raw) ? raw : 0;
      }
      return out;
    },

    write(inputs: CalculatorInputs): void {
      for (const ref of refs) {
        const next = inputs[ref.spec.key];
        ref.input.value = Number.isFinite(next) ? String(next) : '';
      }
    },

    refreshLabels(): void {
      const next = t();
      for (const ref of refs) {
        ref.label.title = next[ref.spec.hintKey];
        ref.label.setAttribute('aria-label', next[ref.spec.labelKey]);
        ref.input.setAttribute('aria-label', next[ref.spec.labelKey]);
        ref.unit.textContent = unitSuffix(ref.spec);
        // Rebuild the label text while keeping the unit span in place.
        ref.label.firstChild?.replaceWith(document.createTextNode(`${next[ref.spec.labelKey]} `));
      }
      const button = must<HTMLButtonElement>('#calc-btn', root);
      const span = button.querySelector('span');
      if (span) span.textContent = next.calculate;
    },

    focusFirst(): void {
      const first = refs[0];
      first?.input.focus();
      first?.input.select();
    },
  };
}
