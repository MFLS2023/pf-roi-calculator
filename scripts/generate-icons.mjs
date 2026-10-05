#!/usr/bin/env node
/**
 * Generates every app icon from a single vector description.
 *
 * Why hand-rolled instead of `sharp` / `canvas`?
 *   • zero dependencies — `npm ci` on a fresh clone stays fast and never needs a
 *     native toolchain, which matters a lot for a project people fork casually;
 *   • fully deterministic — the same commit always yields byte-identical PNGs;
 *   • it is ~150 lines of arithmetic, and the artwork is three rectangles.
 *
 * Usage:  npm run icons
 *
 * Outputs (all committed, so CI does not need to run this):
 *   public/favicon.svg
 *   public/icons/icon.svg
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/icons/icon-maskable-512.png
 *   public/apple-touch-icon.png
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(HERE, '..', 'public');
const ICON_DIR = resolve(PUBLIC_DIR, 'icons');
const TAURI_ICON_DIR = resolve(HERE, '..', 'src-tauri', 'icons');

/* ------------------------------------------------------------ brand palette */

const GRADIENT_FROM = [0x4f, 0x46, 0xe5]; // #4f46e5
const GRADIENT_TO = [0x7c, 0x3a, 0xed]; // #7c3aed
const BAR_OPACITY = [1, 0.85, 0.7];

/* ------------------------------------------------------------------ PNG I/O */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

/** Encode raw RGBA bytes as a PNG buffer. */
function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type 0 (None)
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------------- maths */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (v) => clamp(v + 0.5, 0, 1);

/** Signed distance to a rounded rectangle (negative = inside). */
function sdRoundRect(px, py, cx, cy, halfW, halfH, radius) {
  const qx = Math.abs(px - cx) - (halfW - radius);
  const qy = Math.abs(py - cy) - (halfH - radius);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - radius;
}

/** The three ascending bars of the logo, in 512×512 design space. */
const BARS = [
  { x: 130, y: 252, w: 56, h: 120 },
  { x: 228, y: 192, w: 56, h: 180 },
  { x: 326, y: 132, w: 56, h: 240 },
];
const BAR_RADIUS = 14;

/**
 * Rasterise one icon.
 *
 * @param {number} size            output edge length in pixels
 * @param {object} options
 * @param {boolean} options.rounded  round the outer corners (app icon vs. maskable)
 * @param {number}  options.artScale scale of the glyph inside the canvas
 * @param {boolean} options.transparent  allow transparent corners
 */
function renderIcon(size, { rounded = true, artScale = 1, transparent = true } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const scale = size / 512;
  const radius = 512 * 0.22 * scale;

  // Glyph is scaled about the canvas centre so `artScale` shrinks it in place.
  const cx0 = 256 * scale;
  const cy0 = 256 * scale;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;

      /* --- background: rounded square, diagonally interpolated gradient --- */
      let alpha = 1;
      if (rounded) {
        const d = sdRoundRect(px, py, size / 2, size / 2, size / 2, size / 2, radius);
        alpha = smooth(-d);
      }

      const t = clamp((px + py) / (2 * size), 0, 1);
      let r = GRADIENT_FROM[0] + (GRADIENT_TO[0] - GRADIENT_FROM[0]) * t;
      let g = GRADIENT_FROM[1] + (GRADIENT_TO[1] - GRADIENT_FROM[1]) * t;
      let b = GRADIENT_FROM[2] + (GRADIENT_TO[2] - GRADIENT_FROM[2]) * t;

      /* --- glyph: three white bars --- */
      for (let i = 0; i < BARS.length; i += 1) {
        const bar = BARS[i];
        const bx = cx0 + (bar.x + bar.w / 2 - 256) * scale * artScale;
        const by = cy0 + (bar.y + bar.h / 2 - 256) * scale * artScale;
        const halfW = (bar.w / 2) * scale * artScale;
        const halfH = (bar.h / 2) * scale * artScale;
        const br = BAR_RADIUS * scale * artScale;

        const d = sdRoundRect(px, py, bx, by, halfW, halfH, br);
        const coverage = smooth(-d) * BAR_OPACITY[i] * alpha;
        if (coverage <= 0) continue;
        r = r * (1 - coverage) + 255 * coverage;
        g = g * (1 - coverage) + 255 * coverage;
        b = b * (1 - coverage) + 255 * coverage;
      }

      const offset = (y * size + x) * 4;
      rgba[offset] = Math.round(clamp(r, 0, 255));
      rgba[offset + 1] = Math.round(clamp(g, 0, 255));
      rgba[offset + 2] = Math.round(clamp(b, 0, 255));
      rgba[offset + 3] = Math.round((transparent ? alpha : 1) * 255);
    }
  }

  return encodePng(size, size, rgba);
}

/* ---------------------------------------------------------------------- SVG */

const svgIcon = (size, { rounded = true, artScale = 1 } = {}) => {
  const r = 512 * 0.22;
  const bg = rounded
    ? `<rect width="512" height="512" rx="${r}" fill="url(#g)"/>`
    : `<rect width="512" height="512" fill="url(#g)"/>`;
  const bars = BARS.map(
    (bar, i) =>
      `<rect x="${bar.x}" y="${bar.y}" width="${bar.w}" height="${bar.h}" rx="${BAR_RADIUS}" fill="#fff" opacity="${BAR_OPACITY[i]}"/>`,
  ).join('');

  const inner = artScale === 1 ? bars : `<g transform="translate(256 256) scale(${artScale}) translate(-256 -256)">${bars}</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}" role="img" aria-label="PF ROI Calculator">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  ${bg}
  ${inner}
</svg>
`;
};

/* ---------------------------------------------------------------- ICO / ICNS */

/** Windows `.ico` container. Vista+ accepts PNG-compressed entries directly. */
function encodeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(16 * entries.length);
  let offset = header.length + directory.length;

  entries.forEach((entry, index) => {
    const base = index * 16;
    // 256 is encoded as 0 in the single-byte width/height fields.
    directory[base] = entry.size >= 256 ? 0 : entry.size;
    directory[base + 1] = entry.size >= 256 ? 0 : entry.size;
    directory[base + 2] = 0; // palette size
    directory[base + 3] = 0; // reserved
    directory.writeUInt16LE(1, base + 4); // colour planes
    directory.writeUInt16LE(32, base + 6); // bits per pixel
    directory.writeUInt32LE(entry.data.length, base + 8);
    directory.writeUInt32LE(offset, base + 12);
    offset += entry.data.length;
  });

  return Buffer.concat([header, directory, ...entries.map((entry) => entry.data)]);
}

/**
 * macOS `.icns` container.
 * Types used: ic07=128, ic08=256, ic09=512, ic10=1024, ic11=32, ic12=64.
 */
function encodeIcns(chunks) {
  const body = chunks.map(({ type, data }) => {
    const chunkHeader = Buffer.alloc(8);
    chunkHeader.write(type, 0, 4, 'ascii');
    chunkHeader.writeUInt32BE(data.length + 8, 4);
    return Buffer.concat([chunkHeader, data]);
  });

  const total = 8 + body.reduce((sum, buffer) => sum + buffer.length, 0);
  const header = Buffer.alloc(8);
  header.write('icns', 0, 4, 'ascii');
  header.writeUInt32BE(total, 4);
  return Buffer.concat([header, ...body]);
}

/* --------------------------------------------------------------------- main */

mkdirSync(ICON_DIR, { recursive: true });

const targets = [
  ['icons/icon-192.png', () => renderIcon(192)],
  ['icons/icon-512.png', () => renderIcon(512)],
  // Maskable: full bleed, glyph shrunk into the 80% safe zone.
  ['icons/icon-maskable-512.png', () => renderIcon(512, { rounded: false, artScale: 0.72, transparent: false })],
  // iOS applies its own mask, so ship an opaque full-bleed square.
  ['apple-touch-icon.png', () => renderIcon(180, { rounded: false, artScale: 0.86, transparent: false })],
];

for (const [relative, render] of targets) {
  const absolute = resolve(PUBLIC_DIR, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  const buffer = render();
  writeFileSync(absolute, buffer);
  process.stdout.write(`  ✓ ${relative}  (${(buffer.length / 1024).toFixed(1)} KB)\n`);
}

writeFileSync(resolve(ICON_DIR, 'icon.svg'), svgIcon(512), 'utf8');
writeFileSync(resolve(PUBLIC_DIR, 'favicon.svg'), svgIcon(32), 'utf8');
process.stdout.write('  ✓ icons/icon.svg\n  ✓ favicon.svg\n');

/* ---- desktop shell icons (consumed by Tauri) ---- */

mkdirSync(TAURI_ICON_DIR, { recursive: true });

const desktopPngs = [
  ['32x32.png', 32],
  ['128x128.png', 128],
  ['128x128@2x.png', 256],
  ['icon.png', 512],
];

for (const [name, size] of desktopPngs) {
  const buffer = renderIcon(size);
  writeFileSync(resolve(TAURI_ICON_DIR, name), buffer);
  process.stdout.write(`  ✓ src-tauri/icons/${name}\n`);
}

const icoBuffer = encodeIco(
  [16, 32, 48, 64, 128, 256].map((size) => ({ size, data: renderIcon(size) })),
);
writeFileSync(resolve(TAURI_ICON_DIR, 'icon.ico'), icoBuffer);
process.stdout.write(`  ✓ src-tauri/icons/icon.ico  (${(icoBuffer.length / 1024).toFixed(1)} KB)\n`);

const icnsBuffer = encodeIcns([
  { type: 'ic11', data: renderIcon(32) },
  { type: 'ic12', data: renderIcon(64) },
  { type: 'ic07', data: renderIcon(128) },
  { type: 'ic08', data: renderIcon(256) },
  { type: 'ic09', data: renderIcon(512) },
  { type: 'ic10', data: renderIcon(1024) },
]);
writeFileSync(resolve(TAURI_ICON_DIR, 'icon.icns'), icnsBuffer);
process.stdout.write(`  ✓ src-tauri/icons/icon.icns  (${(icnsBuffer.length / 1024).toFixed(1)} KB)\n`);

process.stdout.write('\nIcons generated into public/ and src-tauri/icons/.\n');
