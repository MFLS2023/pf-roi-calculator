import type { InputKey } from '../domain/types';
import type { Dict } from '../i18n/zh-CN';

/**
 * Declarative description of the input form.
 *
 * The DOM is generated from this schema, so adding a field is a one-line change
 * here plus a dictionary entry — no HTML/JS wiring to keep in sync.
 */

export type GroupId = 'basics' | 'exam' | 'payout';

/** Colour tone used by the group's status dot. */
export type GroupTone = 'blue' | 'orange' | 'green';

export interface FieldSpec {
  key: InputKey;
  labelKey: keyof Dict;
  hintKey: keyof Dict;
  /** Rendered as a suffix inside the label, e.g. `(USD)` / `(天)`. */
  unit: 'usd' | 'days' | 'none';
  step: number;
  min: number;
  inputMode: 'decimal' | 'numeric';
}

export interface GroupSpec {
  id: GroupId;
  titleKey: keyof Dict;
  tagKey: keyof Dict;
  tone: GroupTone;
  fields: FieldSpec[];
}

export const FORM_GROUPS: readonly GroupSpec[] = [
  {
    id: 'basics',
    titleKey: 'groupBasics',
    tagKey: 'tagOnce',
    tone: 'blue',
    fields: [
      {
        key: 'costPerAccount',
        labelKey: 'fieldCostPerAccount',
        hintKey: 'fieldHintCostPerAccount',
        unit: 'usd',
        step: 1,
        min: 0,
        inputMode: 'decimal',
      },
      {
        key: 'activationFee',
        labelKey: 'fieldActivationFee',
        hintKey: 'fieldHintActivationFee',
        unit: 'usd',
        step: 1,
        min: 0,
        inputMode: 'decimal',
      },
    ],
  },
  {
    id: 'exam',
    titleKey: 'groupExam',
    tagKey: 'tagProbability',
    tone: 'orange',
    fields: [
      {
        key: 'examDrawdown',
        labelKey: 'fieldExamDrawdown',
        hintKey: 'fieldHintExamDrawdown',
        unit: 'usd',
        step: 1,
        min: 0,
        inputMode: 'decimal',
      },
      {
        key: 'examTarget',
        labelKey: 'fieldExamTarget',
        hintKey: 'fieldHintExamTarget',
        unit: 'usd',
        step: 1,
        min: 0,
        inputMode: 'decimal',
      },
      {
        key: 'examDays',
        labelKey: 'fieldExamDays',
        hintKey: 'fieldHintExamDays',
        unit: 'days',
        step: 1,
        min: 1,
        inputMode: 'numeric',
      },
    ],
  },
  {
    id: 'payout',
    titleKey: 'groupPayout',
    tagKey: 'tagSettlement',
    tone: 'green',
    fields: [
      {
        key: 'payoutDrawdown',
        labelKey: 'fieldPayoutDrawdown',
        hintKey: 'fieldHintPayoutDrawdown',
        unit: 'usd',
        step: 1,
        min: 0,
        inputMode: 'decimal',
      },
      {
        key: 'payoutTarget',
        labelKey: 'fieldPayoutTarget',
        hintKey: 'fieldHintPayoutTarget',
        unit: 'usd',
        step: 1,
        min: 0,
        inputMode: 'decimal',
      },
      {
        key: 'payoutDays',
        labelKey: 'fieldPayoutDays',
        hintKey: 'fieldHintPayoutDays',
        unit: 'days',
        step: 1,
        min: 1,
        inputMode: 'numeric',
      },
      {
        key: 'actualPayout',
        labelKey: 'fieldActualPayout',
        hintKey: 'fieldHintActualPayout',
        unit: 'usd',
        step: 1,
        min: 0,
        inputMode: 'decimal',
      },
    ],
  },
] as const;
