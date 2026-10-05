/**
 * Inline SVG icon set.
 *
 * Everything ships as markup strings — no icon font, no CDN, no sprite request.
 * Icons inherit `currentColor` unless an explicit colour is passed, which is how
 * the metric tiles get their per-tile accent.
 */

const PATHS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  target:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.4"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22"/>',
  briefcase:
    '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/>',
  dollar:
    '<path d="M12 3v18"/><path d="M17 7.5C17 5.6 14.8 4.5 12 4.5S7 5.6 7 7.5s2.2 2.6 5 3 5 1.1 5 3-2.2 3-5 3-5-1.1-5-3"/>',
  coins:
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M14.6 9.4c-.5-.9-1.5-1.4-2.6-1.4-1.4 0-2.5.8-2.5 1.9 0 2.6 5.6 1.2 5.6 3.8 0 1.1-1.1 1.9-2.6 1.9-1.2 0-2.2-.5-2.7-1.4"/>',
  bars: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  chart: '<path d="M3 17l5-5 4 3 8-8"/><path d="M15 7h5v5"/>',
  reset:
    '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
  download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash:
    '<path d="M4 7h16"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/>',
  share:
    '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="m8.3 10.8 7.4-3.6M8.3 13.2l7.4 3.6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
} as const;

export type IconName = keyof typeof PATHS;

export interface IconOptions {
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Extra classes applied to the `<svg>`. */
  className?: string;
}

/** Render an icon to an SVG markup string. */
export function icon(name: IconName, options: IconOptions = {}): string {
  const { size = 14, color = 'currentColor', strokeWidth = 2.2, className = '' } = options;
  const cls = className ? ` class="${className}"` : '';
  return (
    `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" ` +
    `stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`
  );
}

/** The filled bar-chart glyph used in the app logo. */
export const LOGO_SVG =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
  '<rect x="5" y="12" width="3.2" height="6" rx="1" fill="#ffffff"/>' +
  '<rect x="10.4" y="8" width="3.2" height="10" rx="1" fill="#ffffff" opacity="0.85"/>' +
  '<rect x="15.8" y="4" width="3.2" height="14" rx="1" fill="#ffffff" opacity="0.7"/>' +
  '</svg>';
