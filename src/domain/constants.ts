import type { CalculatorInputs } from './types';

/**
 * THE single source of truth for the default scenario.
 *
 * Every other module (presets, reset button, tests, docs) must import from here
 * instead of re-declaring the numbers. Changing a default is a one-line change.
 */
export const DEFAULT_INPUTS: Readonly<CalculatorInputs> = Object.freeze({
  costPerAccount: 49,
  activationFee: 149,
  examDrawdown: 1000,
  examTarget: 1500,
  examDays: 2,
  payoutDrawdown: 1000,
  payoutTarget: 4000,
  payoutDays: 1,
  actualPayout: 1800,
});

/** Minimum number of trading days the model accepts. */
export const MIN_DAYS = 1;

/** localStorage key for saved scenarios. Namespaced to avoid collisions. */
export const STORAGE_KEY_SCENARIOS = 'pf-roi-calculator:scenarios:v1';

/** localStorage key for the UI language preference. */
export const STORAGE_KEY_LANG = 'pf-roi-calculator:lang:v1';

/** Maximum number of scenarios a user may keep. */
export const MAX_SCENARIOS = 20;

/**
 * GitHub account that owns the project. Single source of truth: the repo URL is
 * derived from it, and it is what the header shortcut displays.
 *
 * >>> Change this to your own handle when you fork the project. <<<
 */
export const GITHUB_HANDLE = 'MFLS2023';

/** Repository name, kept separate so the two can be changed independently. */
export const REPO_NAME = 'pf-roi-calculator';

/**
 * Canonical public URL of the project.
 *
 * Used for the header repo shortcut, printed on exported share images and
 * encoded into their QR code. When the app is served over http(s) the *live*
 * URL is preferred for the QR, so a self-hosted copy advertises itself; this
 * constant is the fallback used by the desktop build.
 */
export const PROJECT_URL = `https://github.com/${GITHUB_HANDLE}/${REPO_NAME}`;
