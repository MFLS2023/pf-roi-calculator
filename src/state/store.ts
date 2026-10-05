import { calculate, sanitizeInputs } from '../domain/calculator';
import { DEFAULT_INPUTS, MAX_SCENARIOS } from '../domain/constants';
import { createScenario, loadScenarios, persistScenarios } from '../domain/scenarios';
import type { CalculatorInputs, CalculatorResult, SavedScenario } from '../domain/types';
import { REFERENCE_PRESET_ID, getPreset } from '../data/presets';

/**
 * Id used when the current inputs no longer match the applied preset.
 * Lives here (not in presets.ts) because "custom" is an application state,
 * not a property of the preset catalogue.
 */
export const CUSTOM_PRESET_ID = 'custom';

/** The single source of application state. Views render from this, actions mutate it. */
export interface AppState {
  /**
   * Always sanitised: finite, non-negative, day counts >= 1. Actions run the
   * input through `sanitizeInputs()` before storing it, so `inputs` and
   * `result.inputs` can never disagree — the previous version stored raw DOM
   * values here, which meant a typed `-50` lived in `inputs` while the maths
   * used `0`.
   */
  inputs: CalculatorInputs;
  result: CalculatorResult;
  scenarios: SavedScenario[];
  /** Active preset id, or {@link CUSTOM_PRESET_ID} once inputs drift. */
  presetId: string;
  /**
   * The last preset the user *explicitly* applied. Unlike `presetId` this never
   * becomes {@link CUSTOM_PRESET_ID}, so the reference note (official rules,
   * source URL, caveats) survives manual edits instead of vanishing the moment
   * the user touches a field.
   */
  presetOrigin: string;
}

export type Listener = (state: AppState) => void;

/**
 * Observable application store — the "model" half of the app.
 *
 * Data flows in one direction: DOM events call actions, actions produce a new
 * state, and every listener re-renders from that state. Views never mutate
 * state directly and actions never touch the DOM, which keeps the wiring
 * testable and the re-rendering predictable.
 */
export interface AppStore {
  /** Snapshot of the current state. Treat as read-only. */
  get(): AppState;
  /** Register a listener; invoked immediately with the current state. Returns an unsubscribe fn. */
  subscribe(fn: Listener): () => void;
  /** Live recalculation while the user types. Detaches the preset if inputs drift. */
  setInputs(inputs: CalculatorInputs): void;
  /** Replace inputs programmatically (preset applied / scenario loaded). */
  applyInputs(inputs: CalculatorInputs, presetId: string): void;
  /** Apply a preset by id. Returns `false` when the id is unknown. */
  applyPreset(presetId: string): boolean;
  /** Persist the current inputs as a scenario. Returns `null` when the list is full. */
  saveScenario(name: string): SavedScenario | null;
  deleteScenario(id: string): void;
  clearScenarios(): void;
  resetToDefaults(): void;
}

export function createAppStore(): AppStore {
  let state: AppState = {
    inputs: { ...DEFAULT_INPUTS },
    result: calculate({ ...DEFAULT_INPUTS }),
    scenarios: loadScenarios(),
    presetId: REFERENCE_PRESET_ID,
    presetOrigin: REFERENCE_PRESET_ID,
  };

  const listeners = new Set<Listener>();
  const emit = (): void => {
    for (const fn of listeners) fn(state);
  };
  const set = (patch: Partial<AppState>): void => {
    state = { ...state, ...patch };
    emit();
  };

  /**
   * Single funnel for every input change: sanitise once, derive the result from
   * those exact values, and emit exactly once.
   */
  const commit = (raw: CalculatorInputs, patch: Partial<AppState>): void => {
    const inputs = sanitizeInputs(raw);
    set({ ...patch, inputs, result: calculate(inputs) });
  };

  return {
    get: () => state,

    subscribe(fn: Listener): () => void {
      listeners.add(fn);
      fn(state);
      return () => {
        listeners.delete(fn);
      };
    },

    setInputs(inputs: CalculatorInputs): void {
      // Editing by hand detaches the preset unless every value still matches it.
      const preset = getPreset(state.presetId);
      const stillMatches =
        preset !== undefined &&
        (Object.keys(preset.inputs) as Array<keyof CalculatorInputs>).every(
          (key) => preset.inputs[key] === inputs[key],
        );
      commit(inputs, { presetId: stillMatches ? state.presetId : CUSTOM_PRESET_ID });
    },

    applyInputs(inputs: CalculatorInputs, presetId: string): void {
      // Only a *real* preset becomes the origin, so "custom" and scenario loads
      // keep the previously applied preset's reference note alive.
      commit(inputs, {
        presetId,
        presetOrigin: getPreset(presetId) ? presetId : state.presetOrigin,
      });
    },

    applyPreset(presetId: string): boolean {
      const preset = getPreset(presetId);
      if (!preset) return false;
      commit({ ...preset.inputs }, { presetId, presetOrigin: presetId });
      return true;
    },

    saveScenario(name: string): SavedScenario | null {
      if (state.scenarios.length >= MAX_SCENARIOS) return null;
      const scenario = createScenario(name, state.inputs);
      const scenarios = [...state.scenarios, scenario];
      persistScenarios(scenarios);
      set({ scenarios });
      return scenario;
    },

    deleteScenario(id: string): void {
      const scenarios = state.scenarios.filter((item) => item.id !== id);
      persistScenarios(scenarios);
      set({ scenarios });
    },

    clearScenarios(): void {
      persistScenarios([]);
      set({ scenarios: [] });
    },

    resetToDefaults(): void {
      commit({ ...DEFAULT_INPUTS }, {
        presetId: REFERENCE_PRESET_ID,
        presetOrigin: REFERENCE_PRESET_ID,
      });
    },
  };
}
