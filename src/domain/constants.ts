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
 * Canonical public URL of the project.
 *
 * Printed on exported share images and encoded into their QR code. When the app
 * is served over http(s) the *live* URL is preferred, so a self-hosted copy
 * advertises itself; this constant is the fallback used by the desktop build.
 *
 * >>> Change this to your own repository when you fork the project. <<<
 */
export const PROJECT_URL = 'https://github.com/MFLS2023/pf-roi-calculator';

/**
 * Bilibili homepage of the creator whose prop-firm rule walkthroughs inspired
 * this project (see the Acknowledgements section of the README). Linked from
 * the app footer.
 */
export const CREDIT_URL = 'https://space.bilibili.com/101513971';
