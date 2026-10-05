import { STORAGE_KEY_LANG } from '../domain/constants';
import { readString, writeString } from '../platform/storage';
import { en } from './en';
import { zhCN, type Dict } from './zh-CN';
import { LOCALES, type Locale } from './types';

const DICTS: Readonly<Record<Locale, Dict>> = Object.freeze({ 'zh-CN': zhCN, en });

type Listener = (locale: Locale, dict: Dict) => void;
const listeners = new Set<Listener>();

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Resolution order:
 *   1. explicit user choice (persisted)
 *   2. browser language (`zh*` → zh-CN, everything else → en)
 *   3. zh-CN
 */
function detectLocale(): Locale {
  const stored = readString(STORAGE_KEY_LANG);
  if (isLocale(stored)) return stored;

  try {
    const nav = typeof navigator !== 'undefined' ? navigator.language : '';
    if (nav && nav.toLowerCase().startsWith('zh')) return 'zh-CN';
    if (nav) return 'en';
  } catch {
    /* ignore */
  }
  return 'zh-CN';
}

let current: Locale = detectLocale();

/** The active locale. */
export function getLocale(): Locale {
  return current;
}

/** The dictionary for the active locale. */
export function t(): Dict {
  return DICTS[current];
}

/** Switch locale, persist the choice and notify subscribers. */
export function setLocale(locale: Locale): void {
  if (!isLocale(locale) || locale === current) return;
  current = locale;
  writeString(STORAGE_KEY_LANG, locale);
  for (const fn of listeners) fn(current, DICTS[current]);
}

/** Subscribe to locale changes. Returns an unsubscribe function. */
export function onLocaleChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Apply `<html lang>` and `<title>` for the active locale. */
export function applyDocumentLocale(): void {
  const dict = t();
  try {
    document.documentElement.lang = dict.htmlLang;
    document.title = dict.docTitle;
  } catch {
    /* ignore */
  }
}

export type { Dict, Locale };
