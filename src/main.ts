import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { CREDIT_URL, PROJECT_URL } from './domain/constants';
import { formatMoney, formatSignedPercent, toneOf } from './domain/formatter';
import type { CalculatorResult, SavedScenario } from './domain/types';
import { PRESETS, getPreset, presetAccountSizeLabel } from './data/presets';
import { applyDocumentLocale, getLocale, onLocaleChange, setLocale, t } from './i18n';
import { LOCALES, LOCALE_LABELS, pick, type Locale } from './i18n/types';
import { CUSTOM_PRESET_ID, createAppStore } from './state/store';
import { createCompare } from './ui/compare';
import { h, must, setText } from './ui/dom';
import { downloadShareImage } from './ui/export-image';
import { createForm } from './ui/form';
import { icon, LOGO_SVG } from './ui/icons';
import { createMetrics } from './ui/metrics';
import { announce, toast } from './ui/toast';

/**
 * View wiring.
 *
 * All mutable state lives in the store (`src/state/store.ts`); this module only
 * builds the views, turns DOM events into store actions, and re-renders on
 * store changes. No business logic lives here.
 */

const store = createAppStore();

/* --------------------------------------------------------------- controllers */

const form = createForm({
  onChange: () => store.setInputs(form.read()),
  onSubmit: () => {
    store.setInputs(form.read());
    announce(`${t().roiTitle} ${formatSignedPercent(store.get().result.roi, 2)}`);
  },
});
const metrics = createMetrics();

function saveFromInput(rawName: string): void {
  const fallback = autoScenarioName(getPreset(store.get().presetId));
  const scenario = store.saveScenario(rawName.trim() || fallback);
  if (scenario === null) {
    toast(t().compareLimitReached, 'error');
    return;
  }
  compare.consumeName();
  toast(`${t().compareSave}: ${scenario.name}`, 'success');
}

function autoScenarioName(preset: ReturnType<typeof getPreset>): string {
  if (preset && preset.id !== CUSTOM_PRESET_ID) {
    const size = presetAccountSizeLabel(preset);
    return [preset.firm, size].filter(Boolean).join(' ');
  }
  return `${t().compareTh} ${store.get().scenarios.length + 1}`;
}

const compare = createCompare({
  onSave: (name) => saveFromInput(name),
  onDelete: (id) => store.deleteScenario(id),
  onLoad: (scenario) => loadScenario(scenario),
  onClearAll: () => {
    if (store.get().scenarios.length === 0) return;
    if (!window.confirm(t().compareConfirmClear)) return;
    store.clearScenarios();
  },
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
  presetSelect.value = store.get().presetId;
}

presetWrap.replaceChildren(
  h('span', { class: 'select-wrap__icon', html: icon('grid', { size: 13, strokeWidth: 2 }) }),
  presetSelect,
  h('span', { class: 'select-wrap__caret', html: icon('chevronDown', { size: 13, strokeWidth: 2.4 }) }),
);

presetSelect.addEventListener('change', () => {
  const id = presetSelect.value;
  if (id === CUSTOM_PRESET_ID) return;
  if (!store.applyPreset(id)) return;
  form.write(store.get().inputs);
  const preset = getPreset(id);
  if (preset) announce(`${preset.firm} ${pick(preset.variant, getLocale())}`);
});

function renderPresetNote(presetId: string): void {
  const preset = getPreset(presetId);
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
  const credit = must<HTMLAnchorElement>('#footer-credit');
  credit.textContent = dict.footerCredit;
  credit.href = CREDIT_URL;

  // Dynamic pieces that are not plain `data-i18n` swaps.
  buildPresetSelect();
  buildLangSelect();
  form.refreshLabels();
  metrics.refreshLabels();
  compare.refreshLabels();
  renderPresetNote(store.get().presetId);
  renderResult(store.get().result);
  renderScenarios(store.get().scenarios);

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

function renderScenarios(scenarios: readonly SavedScenario[]): void {
  compare.render(scenarios);
}

/** Keep the preset dropdown in sync with the store without rebuilding options. */
function syncPresetSelect(presetId: string): void {
  if (presetSelect.value !== presetId) presetSelect.value = presetId;
}

/* ------------------------------------------------- store → view subscription */

store.subscribe((state) => {
  renderResult(state.result);
  renderScenarios(state.scenarios);
  syncPresetSelect(state.presetId);
  renderPresetNote(state.presetId);
});

/* ------------------------------------------------------------------ handlers */

function loadScenario(scenario: SavedScenario): void {
  form.write(scenario.inputs);
  store.applyInputs(scenario.inputs, CUSTOM_PRESET_ID);
  toast(`${t().compareLoad}: ${scenario.name}`, 'success');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

must<HTMLButtonElement>('#reset-btn').addEventListener('click', () => {
  store.resetToDefaults();
  form.write({ ...store.get().inputs });
  renderPresetNote(store.get().presetId);
  toast(t().reset, 'success');
});

must<HTMLButtonElement>('#export-btn').addEventListener('click', async () => {
  const button = must<HTMLButtonElement>('#export-btn');
  const dict = t();
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="btn__spinner"></span><span>${dict.exporting}</span>`;

  const { result, presetId } = store.get();
  const preset = getPreset(presetId);
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
  saveFromInput(compare.peekName());
});

/** Prefer the live URL (self-hosted copies advertise themselves), else the repo. */
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
  if (requested && store.applyPreset(requested)) {
    form.write(store.get().inputs);
  }
} catch {
  /* ignore */
}
