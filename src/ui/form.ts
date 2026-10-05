import { FORM_GROUPS, type FieldSpec, type GroupSpec } from '../data/form-schema';
import { DEFAULT_INPUTS } from '../domain/constants';
import type { CalculatorInputs } from '../domain/types';
import { t } from '../i18n';
import { h } from './dom';

/**
 * The input form, generated from {@link FORM_GROUPS}.
 *
 * Nothing here knows about the maths: it reads values out of the DOM, clamps
 * them to the field's declared range, and writes values back in.
 *
 * ## Single source of truth
 * `read()` is the only way the rest of the app learns what the user typed, and it
 * always returns in-range values. That matters because the previous version let
 * the DOM and the model disagree: typing `-50` into a `min="0"` field left the
 * box showing `-50` while every metric was computed from `0`, with no feedback.
 * Now an out-of-range value is flagged while it is being typed (red border) and
 * snapped to the nearest legal value on blur, so the box can never lie.
 */

export interface FormController {
  root: HTMLElement;
  /** In-range values, ready for `calculate()`. */
  read(): CalculatorInputs;
  /** Push values into the inputs (used by presets / reset / scenario load). */
  write(inputs: CalculatorInputs): void;
  /** Re-render labels and units for the active locale. */
  refreshLabels(): void;
}

interface FieldRefs {
  spec: FieldSpec;
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

/** Coerce a raw field value into the field's legal range. */
function clampToSpec(spec: FieldSpec, raw: number): number {
  return Number.isFinite(raw) ? Math.max(spec.min, raw) : spec.min;
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

      const ref: FieldRefs = { spec, label, unit, input };

      // Live recalculation on every keystroke — the "silky" feel from the spec.
      input.addEventListener('input', () => {
        flagOutOfRange(ref);
        options.onChange();
      });

      // On blur, snap an illegal (or empty) value to the nearest legal one so the
      // box always shows what is actually being computed with.
      input.addEventListener('change', () => {
        snapToRange(ref);
        options.onChange();
      });

      // Enter recalculates and blurs, which dismisses the mobile keypad.
      input.addEventListener('keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
          event.preventDefault();
          options.onSubmit();
          input.blur();
        }
      });

      grid.append(h('div', { class: 'field' }, [label, input]));
      refs.push(ref);
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

  /** Mark a field the user is currently typing out of range. */
  function flagOutOfRange(ref: FieldRefs): void {
    const raw = Number.parseFloat(ref.input.value);
    if (Number.isFinite(raw) && raw < ref.spec.min) {
      ref.input.setAttribute('data-invalid', 'true');
    } else {
      ref.input.removeAttribute('data-invalid');
    }
  }

  /** Snap an out-of-range or empty field to the nearest legal value. */
  function snapToRange(ref: FieldRefs): void {
    const raw = Number.parseFloat(ref.input.value);
    const clamped = clampToSpec(ref.spec, raw);
    if (ref.input.value !== String(clamped)) {
      ref.input.value = String(clamped);
    }
    ref.input.removeAttribute('data-invalid');
  }

  return {
    root,

    read(): CalculatorInputs {
      const out = {} as CalculatorInputs;
      for (const ref of refs) {
        out[ref.spec.key] = clampToSpec(ref.spec, Number.parseFloat(ref.input.value));
      }
      return out;
    },

    write(inputs: CalculatorInputs): void {
      for (const ref of refs) {
        const next = inputs[ref.spec.key];
        const clamped = clampToSpec(ref.spec, next);
        ref.input.value = Number.isFinite(clamped) ? String(clamped) : '';
        ref.input.removeAttribute('data-invalid');
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
    },
  };
}
