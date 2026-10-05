import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { calculate } from './core/calculator';
import { DEFAULT_INPUTS, MAX_SCENARIOS, PROJECT_URL } from './core/constants';
import { formatMoney, formatSignedPercent, toneOf } from './core/formatter';
import { createScenario, loadScenarios, persistScenarios } from './core/scenarios';
import type { CalculatorInputs, CalculatorResult, SavedScenario } from './core/types';
import { PRESETS, REFERENCE_PRESET_ID, getPreset, presetAccountSizeLabel } from './data/presets';
import { applyDocumentLocale, getLocale, onLocaleChange, setLocale, t } from './i18n';
import { LOCALES, LOCALE_LABELS, pick, type Locale } from './i18n/types';
import { createCompare } from './ui/compare';
import { h, must, setText } from './ui/dom';
import { downloadShareImage } from './ui/export-image';
import { createForm } from './ui/form';
import { icon, LOGO_SVG } from './ui/icons';
import { createMetrics } from './ui/metrics';
import { announce, toast } from './ui/toast';

/**
 * Application orchestrator.
 *
 * Owns all mutable state (`result`, `scenarios`, `activePresetId`) and wires the
 * presentational modules together. The UI modules never talk to each other —
 * everything funnels through here, which keeps re-rendering predictable.
 */

const CUSTOM_PRESET_ID = 'custom';

let result: CalculatorResult = calculate({ ...DEFAULT_INPUTS });
let scenarios: SavedScenario[] = loadScenarios();
let activePresetId: string = REFERENCE_PRESET_ID;
/** Set while a preset is being applied so the "custom" detector does not fire. */
let applyingPreset = false;

/* --------------------------------------------------------------- controllers */

const form = createForm({ onChange: onInputChange, onSubmit: onCalculate });
const metrics = createMetrics();

const compare = createCompare({
  onSave: (name) => saveScenario(name),
  onDelete: (id) => deleteScenario(id),
  onLoad: (scenario) => loadScenario(scenario),
  onClearAll: () => clearScenarios(),
});

/* ------------------------------------------------------------------- presets */

const presetWrap = must<HTMLElement>('#preset-wrap');
const presetSelect = h('select', {
  class: 'select',
  id: 'preset-select',
  'aria-label': t().presetLabel,
});
const presetNote = must<HTMLElement>('#preset-note');

function buildPresetSelect(): void {
  const dict = t();
  const options: HTMLOptionElement[] = [
    h('option', { value: CUSTOM_PRESET_ID, text: dict.presetCustom }),
  ];
  for (const preset of PRESETS) {
    const size = presetAccountSizeLabel(preset);
    const label = [preset.firm, size, pick(preset.variant, getLocale())]
      .filter(Boolean)
      .join(' · ');
    options.push(h('option', { value: preset.id, text: label }));
  }
  presetSelect.replaceChildren(...options);
  presetSelect.value = activePresetId;
}

presetWrap.replaceChildren(
  h('span', { class: 'select-wrap__icon', html: icon('grid', { size: 13, strokeWidth: 2 }) }),
  presetSelect,
  h('span', { class: 'select-wrap__caret', html: icon('chevronDown', { size: 13, strokeWidth: 2.4 }) }),
);

presetSelect.addEventListener('change', () => {
  const id = presetSelect.value;
  if (id === CUSTOM_PRESET_ID) return;
  const preset = getPreset(id);
  if (!preset) return;
  activePresetId = id;
  applyingPreset = true;
  form.write(preset.inputs);
  recalculate();
  applyingPreset = false;
  renderPresetNote();
  announce(`${preset.firm} ${pick(preset.variant, getLocale())}`);
});

function renderPresetNote(): void {
  const preset = getPreset(activePresetId);
  if (!preset || preset.id === CUSTOM_PRESET_ID) {
    presetNote.hidden = true;
    presetNote.replaceChildren();
    return;
  }
  const dict = t();
  const locale = getLocale();
  const head = [preset.firm, presetAccountSizeLabel(preset), pick(preset.variant, locale)]
    .filter(Boolean)
    .join(' · ');

  const badge = h('span', {
    class: `badge badge--confidence badge--${preset.confidence}`,
    text: `verified ${preset.verifiedAt}`,
  });

  presetNote.hidden = false;
  presetNote.replaceChildren(
    h('strong', { text: head }),
    document.createTextNode(' '),
    badge,
    document.createTextNode(` ${pick(preset.note, locale)} `),
    h('em', { text: dict.presetDisclaimer }),
  );
}

/* ------------------------------------------------------------------ language */

const langWrap = must<HTMLElement>('#lang-wrap');
const langSelect = h('select', {
  class: 'select select--lang',
  id: 'lang-select',
  'aria-label': t().languageLabel,
});

function buildLangSelect(): void {
  langSelect.replaceChildren(
    ...LOCALES.map((locale) =>
      h('option', { value: locale, text: LOCALE_LABELS[locale] }),
    ),
  );
  langSelect.value = getLocale();
}

langWrap.replaceChildren(
  h('span', { class: 'select-wrap__icon', html: icon('globe', { size: 13, strokeWidth: 2 }) }),
  langSelect,
  h('span', { class: 'select-wrap__caret', html: icon('chevronDown', { size: 13, strokeWidth: 2.4 }) }),
);

langSelect.addEventListener('change', () => {
  setLocale(langSelect.value as Locale);
});

/* -------------------------------------------------------------- i18n binding */

/** Apply every `data-i18n` string plus the module-level labels. */
function applyTranslations(): void {
  const dict = t();
  applyDocumentLocale();

  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = node.dataset.i18n as keyof typeof dict | undefined;
    if (key && typeof dict[key] === 'string') node.textContent = dict[key];
  }

  must<HTMLElement>('#footer-disclaimer').textContent = dict.footerDisclaimer;
  must<HTMLElement>('#footer-model').textContent = 'P = (D / (D + T))^N';

  // Dynamic pieces that are not plain `data-i18n` swaps.
  buildPresetSelect();
  buildLangSelect();
  form.refreshLabels();
  metrics.refreshLabels();
  compare.refreshLabels();
  renderPresetNote();
  renderResult(result);
  renderScenarios();

  const exportBtn = must<HTMLButtonElement>('#export-btn');
  exportBtn.innerHTML = `${icon('download', { size: 14, strokeWidth: 2.2 })}<span>${dict.exportImage}</span>`;
  const saveBtn = must<HTMLButtonElement>('#save-btn');
  saveBtn.innerHTML = `${icon('plus', { size: 14, strokeWidth: 2.6 })}<span>${dict.compareSave}</span>`;
  const installBtn = must<HTMLButtonElement>('#install-btn');
  installBtn.textContent = dict.installApp;
}

onLocaleChange(() => {
  applyTranslations();
});

/* ---------------------------------------------------------------- calculation */

function onInputChange(): void {
  recalculate();
  if (!applyingPreset) syncPresetSelection();
}

function onCalculate(): void {
  recalculate();
  announce(`${t().roiTitle} ${formatSignedPercent(result.roi, 2)}`);
}

function recalculate(): void {
  result = calculate(form.read());
  renderResult(result);
}

/** Flip the select to "custom" as soon as the inputs drift from the preset. */
function syncPresetSelection(): void {
  const preset = getPreset(activePresetId);
  const current = form.read();
  if (!preset || preset.id === CUSTOM_PRESET_ID) return;

  const matches = (Object.keys(preset.inputs) as Array<keyof CalculatorInputs>).every(
    (key) => preset.inputs[key] === current[key],
  );
  if (!matches) {
    activePresetId = CUSTOM_PRESET_ID;
    presetSelect.value = CUSTOM_PRESET_ID;
    presetNote.hidden = true;
  }
}

/* -------------------------------------------------------------------- render */

const roiValue = must<HTMLElement>('#roi-value');
const roiFoot = must<HTMLElement>('#roi-foot');
const roiNote = must<HTMLElement>('#roi-note');
const roiVerdict = must<HTMLElement>('#roi-verdict');

function renderResult(next: CalculatorResult): void {
  const dict = t();
  metrics.update(next);

  roiValue.classList.remove('is-positive', 'is-negative', 'is-neutral');
  roiVerdict.classList.remove('is-positive', 'is-negative', 'is-neutral');

  if (!next.isViable) {
    setText(roiValue, dict.placeholder);
    roiValue.classList.add('is-neutral');
    roiNote.textContent = dict.roiInvalid;
    roiVerdict.classList.add('is-hidden');
  } else {
    const tone = toneOf(next.roi);
    setText(roiValue, formatSignedPercent(next.roi, 2));
    roiValue.classList.add(
      tone === 'positive' ? 'is-positive' : tone === 'negative' ? 'is-negative' : 'is-neutral',
    );

    const abs = formatMoney(Math.abs(next.netProfit));
    roiNote.textContent = `${next.netProfit >= 0 ? dict.roiNetProfit : dict.roiNetLoss} ${abs}`;

    roiVerdict.classList.remove('is-hidden');
    roiVerdict.classList.add(tone === 'negative' ? 'is-negative' : 'is-positive');
    roiVerdict.textContent =
      tone === 'negative' ? dict.roiVerdictNegative : dict.roiVerdictPositive;
  }

  roiFoot.textContent = `${dict.roiActualPayout} ${formatMoney(next.inputs.actualPayout)}`;
}

function renderScenarios(): void {
  compare.render(scenarios);
}

/* ----------------------------------------------------------------- scenarios */

function autoScenarioName(): string {
  const preset = getPreset(activePresetId);
  if (preset && preset.id !== CUSTOM_PRESET_ID) {
    const size = presetAccountSizeLabel(preset);
    return [preset.firm, size].filter(Boolean).join(' ');
  }
  return `${t().compareTh} ${scenarios.length + 1}`;
}

function saveScenario(rawName: string): boolean {
  if (scenarios.length >= MAX_SCENARIOS) {
    toast(t().compareLimitReached, 'error');
    return false;
  }
  const name = rawName.trim() || autoScenarioName();
  const scenario = createScenario(name, form.read());
  scenarios = [...scenarios, scenario];
  persistScenarios(scenarios);
  renderScenarios();
  compare.consumeName();
  toast(`${t().compareSave}: ${scenario.name}`, 'success');
  return true;
}

function deleteScenario(id: string): void {
  scenarios = scenarios.filter((item) => item.id !== id);
  persistScenarios(scenarios);
  renderScenarios();
}

function clearScenarios(): void {
  if (scenarios.length === 0) return;
  if (!window.confirm(t().compareConfirmClear)) return;
  scenarios = [];
  persistScenarios(scenarios);
  renderScenarios();
}

function loadScenario(scenario: SavedScenario): void {
  activePresetId = CUSTOM_PRESET_ID;
  applyingPreset = true;
  form.write(scenario.inputs);
  recalculate();
  applyingPreset = false;
  presetSelect.value = CUSTOM_PRESET_ID;
  presetNote.hidden = true;
  toast(`${t().compareLoad}: ${scenario.name}`, 'success');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

/* ------------------------------------------------------------------- actions */

must<HTMLButtonElement>('#reset-btn').addEventListener('click', () => {
  activePresetId = REFERENCE_PRESET_ID;
  applyingPreset = true;
  form.write({ ...DEFAULT_INPUTS });
  recalculate();
  applyingPreset = false;
  presetSelect.value = REFERENCE_PRESET_ID;
  renderPresetNote();
  toast(t().reset, 'success');
});

must<HTMLButtonElement>('#export-btn').addEventListener('click', async () => {
  const button = must<HTMLButtonElement>('#export-btn');
  const dict = t();
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="btn__spinner"></span><span>${dict.exporting}</span>`;

  const preset = getPreset(activePresetId);
  const context =
    preset && preset.id !== CUSTOM_PRESET_ID
      ? [preset.firm, presetAccountSizeLabel(preset), pick(preset.variant, getLocale())]
          .filter(Boolean)
          .join(' · ')
      : dict.appSubtitle;

  try {
    const ok = await downloadShareImage({
      result,
      dict,
      context,
      projectUrl: shareUrl(),
    });
    toast(ok ? dict.exportDone : dict.exportFailed, ok ? 'success' : 'error');
  } catch {
    toast(dict.exportFailed, 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
});

// Honours a name typed into the comparison panel; falls back to an auto name.
must<HTMLButtonElement>('#save-btn').addEventListener('click', () => {
  saveScenario(compare.peekName());
});

/**
 * Prefer the live URL (self-hosted copies advertise themselves), else the repo.
 *
 * The Tauri shell is excluded explicitly: its Windows webview origin is
 * `http://tauri.localhost`, which satisfies the `http:` check but is meaningless
 * to a QR-code scanner. macOS/Linux use a custom `tauri:` scheme and already
 * fail the protocol check naturally.
 */
function shareUrl(): string {
  try {
    const { protocol, origin, pathname, hostname } = window.location;
    const isTauri =
      hostname === 'tauri.localhost' || hostname.endsWith('.tauri.localhost');
    if ((protocol === 'http:' || protocol === 'https:') && !isTauri) {
      return `${origin}${pathname}`.replace(/index\.html$/, '');
    }
  } catch {
    /* ignore */
  }
  return PROJECT_URL;
}

/* ----------------------------------------------------------------------- PWA */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installBtn = must<HTMLButtonElement>('#install-btn');

/**
 * iOS Safari never fires `beforeinstallprompt`, so the install entry point would
 * otherwise be invisible on the platform where it is needed most. Detect it and
 * surface the button so the manual "Share → Add to Home Screen" route is taught.
 */
function needsManualInstallHint(): boolean {
  try {
    const nav = navigator as Navigator & { standalone?: boolean };
    const isIos =
      /iPad|iPhone|iPod/.test(nav.userAgent) ||
      // iPadOS 13+ reports itself as a Mac, distinguished by touch support.
      (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
    return isIos && !isStandalone;
  } catch {
    return false;
  }
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  installBtn.classList.remove('is-hidden');
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') installBtn.classList.add('is-hidden');
    deferredPrompt = null;
    return;
  }
  // No native prompt available — explain the manual route (iOS, Firefox, …).
  toast(t().installIosHint, 'info', 5200);
});

window.addEventListener('appinstalled', () => {
  installBtn.classList.add('is-hidden');
  toast(t().offlineReady, 'success');
});

/* ------------------------------------------------------------------ bootstrap */

must<HTMLElement>('#brand-logo').innerHTML = LOGO_SVG;
must<HTMLElement>('#roi-icon').innerHTML = icon('chart', { size: 13, strokeWidth: 2.2 });
must<HTMLElement>('#form-pane').append(form.root);
must<HTMLElement>('#metrics-host').append(metrics.root);
must<HTMLElement>('#compare-host').append(compare.root);

applyTranslations();

// iOS users get no native prompt, so show the button that explains the manual route.
if (needsManualInstallHint()) installBtn.classList.remove('is-hidden');

// Honour a `?preset=` deep link, e.g. `?preset=ftmo-100k-1step`.
try {
  const requested = new URLSearchParams(window.location.search).get('preset');
  if (requested && getPreset(requested)) {
    presetSelect.value = requested;
    presetSelect.dispatchEvent(new Event('change'));
  }
} catch {
  /* ignore */
}
