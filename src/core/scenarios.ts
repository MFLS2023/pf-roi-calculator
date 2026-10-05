import { MAX_SCENARIOS, STORAGE_KEY_SCENARIOS } from './constants';
import { calculate, sanitizeInputs } from './calculator';
import { readJSON, writeJSON } from './storage';
import type { CalculatorInputs, SavedScenario } from './types';

/**
 * Persistence for the scenario comparison table.
 *
 * Anything read back from `localStorage` is treated as untrusted: the shape is
 * validated field by field and the numbers are re-derived from the inputs rather
 * than trusted, so a hand-edited or stale entry can never produce a bogus row.
 */

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Rebuild a scenario from a stored result and the live inputs. */
export function createScenario(name: string, inputs: CalculatorInputs): SavedScenario {
  const result = calculate(inputs);
  return {
    id: newId(),
    name: name.trim().slice(0, 40) || 'Scenario',
    createdAt: Date.now(),
    inputs: result.inputs,
    roi: result.roi,
    totalCost: result.totalCost,
    totalPassRate: result.totalPassRate,
  };
}

/** Validate + normalise a raw array read from storage. */
export function normalizeScenarios(raw: unknown): SavedScenario[] {
  if (!Array.isArray(raw)) return [];
  // The list is stored oldest-first; if it somehow exceeds the cap (a manual
  // edit or an older version), keep the NEWEST entries — the same side of the
  // list `persistScenarios` would have kept.
  const start = Math.max(0, raw.length - MAX_SCENARIOS);
  const out: SavedScenario[] = [];
  for (let i = start; i < raw.length; i += 1) {
    const entry = raw[i];
    if (!isRecord(entry) || !isRecord(entry.inputs)) continue;
    const inputs = sanitizeInputs(entry.inputs as Partial<Record<string, unknown>>);
    const result = calculate(inputs);
    out.push({
      id: typeof entry.id === 'string' && entry.id ? entry.id : newId(),
      name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : 'Scenario',
      createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now(),
      inputs,
      roi: result.roi,
      totalCost: result.totalCost,
      totalPassRate: result.totalPassRate,
    });
  }
  return out;
}

/** Read the saved scenarios (newest last). Never throws. */
export function loadScenarios(): SavedScenario[] {
  return normalizeScenarios(readJSON<unknown>(STORAGE_KEY_SCENARIOS, []));
}

/** Persist the list, capped at {@link MAX_SCENARIOS}. */
export function persistScenarios(list: readonly SavedScenario[]): boolean {
  return writeJSON(STORAGE_KEY_SCENARIOS, list.slice(-MAX_SCENARIOS));
}
