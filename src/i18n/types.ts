/** Supported UI locales. */
export type Locale = 'zh-CN' | 'en';

/** A string that has a translation for every locale. */
export interface LocalizedText {
  'zh-CN': string;
  en: string;
}

/** Locales in display order. */
export const LOCALES: readonly Locale[] = ['zh-CN', 'en'] as const;

/** Human-readable locale names, deliberately *not* translated. */
export const LOCALE_LABELS: Readonly<Record<Locale, string>> = Object.freeze({
  'zh-CN': '中文',
  en: 'English',
});

/** Resolve a {@link LocalizedText} for the active locale. */
export function pick(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}
