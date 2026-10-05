import { describe, expect, it } from 'vitest';

import { calculate, sanitizeInputs } from '../src/core/calculator';
import { DEFAULT_INPUTS, MIN_DAYS } from '../src/core/constants';
import { PRESETS, REFERENCE_PRESET_ID, getPreset } from '../src/data/presets';
import { LOCALES } from '../src/i18n/types';

/**
 * Preset data is community-maintained and edited by drive-by PRs, so it gets the
 * same treatment as untrusted input: structure, ranges and derived values are all
 * asserted here.
 */

describe('preset catalogue', () => {
  it('has a unique id per preset', () => {
    const ids = PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('starts with the reference example', () => {
    expect(PRESETS[0]?.id).toBe(REFERENCE_PRESET_ID);
  });

  it('resolves presets by id', () => {
    expect(getPreset(REFERENCE_PRESET_ID)?.id).toBe(REFERENCE_PRESET_ID);
    expect(getPreset('does-not-exist')).toBeUndefined();
  });

  it('keeps the reference preset in lockstep with DEFAULT_INPUTS', () => {
    expect(getPreset(REFERENCE_PRESET_ID)?.inputs).toEqual({ ...DEFAULT_INPUTS });
  });

  it.each(PRESETS.map((preset) => [preset.id, preset] as const))(
    '%s carries complete metadata',
    (_id, preset) => {
      expect(preset.firm.length).toBeGreaterThan(0);
      expect(preset.verifiedAt).toMatch(/^\d{4}-\d{2}$/);
      expect(['high', 'medium', 'low']).toContain(preset.confidence);
      for (const locale of LOCALES) {
        expect(preset.variant[locale].length).toBeGreaterThan(0);
        expect(preset.note[locale].length).toBeGreaterThan(10);
      }
    },
  );

  it.each(PRESETS.map((preset) => [preset.id, preset] as const))(
    '%s has finite, in-range inputs',
    (_id, preset) => {
      for (const value of Object.values(preset.inputs)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
      expect(preset.inputs.examDays).toBeGreaterThanOrEqual(MIN_DAYS);
      expect(preset.inputs.payoutDays).toBeGreaterThanOrEqual(MIN_DAYS);
    },
  );

  it.each(PRESETS.map((preset) => [preset.id, preset] as const))(
    '%s survives sanitisation unchanged',
    (_id, preset) => {
      expect(sanitizeInputs(preset.inputs)).toEqual(preset.inputs);
    },
  );

  it.each(PRESETS.map((preset) => [preset.id, preset] as const))(
    '%s produces a viable, finite result',
    (_id, preset) => {
      const result = calculate(preset.inputs);
      expect(result.isViable).toBe(true);
      expect(Number.isFinite(result.roi)).toBe(true);
      expect(Number.isFinite(result.accountsToBuy)).toBe(true);
      expect(result.totalPassRate).toBeGreaterThan(0);
      expect(result.totalPassRate).toBeLessThanOrEqual(1);
    },
  );

  it('documents a source URL for every non-reference preset', () => {
    for (const preset of PRESETS) {
      if (preset.id === REFERENCE_PRESET_ID) continue;
      // `low` confidence presets are allowed to omit the source, but the field
      // must at least be consciously absent rather than forgotten.
      if (preset.source === undefined) {
        expect(preset.confidence).toBe('low');
      } else {
        expect(preset.source).toMatch(/^https?:\/\//);
      }
    }
  });
});
