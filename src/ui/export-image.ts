import qrcode from 'qrcode-generator';
import { formatCount, formatMoney, formatPercent, formatSignedPercent, toneOf } from '../domain/formatter';
import type { CalculatorResult } from '../domain/types';
import type { Dict } from '../i18n/zh-CN';

/**
 * Renders the result as a shareable PNG, drawn entirely with the Canvas 2D API.
 *
 * No `html2canvas`, no server, no external font: the image is deterministic and
 * works offline in the PWA and in the Tauri webview alike.
 */

const W = 1080;
const H = 1350;
const CARD = { x: 48, y: 48, w: W - 96, h: H - 96, r: 48 };
const PAD = 56;
const CONTENT_X = CARD.x + PAD;
const CONTENT_W = CARD.w - PAD * 2;

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif';

/**
 * Terminal-ledger palette for the exported card (dark, like the app's default
 * theme). P&L colours follow the international convention: gains are green,
 * losses are red — kept in lockstep with `--positive` / `--negative` in
 * `src/styles/tokens.css`.
 */
const INK = {
  strong: '#eceff4',
  title: '#dfe4ec',
  muted: '#99a3b0',
  faint: '#6b7684',
  line: '#26303e',
  positive: '#3ddc97',
  negative: '#ff6b6b',
  card: '#151a22',
  sunken: '#1a212c',
  borderSoft: '#212a36',
};

const PAGE_BG = { from: '#0c0f14', to: '#151b26' } as const;
const ACCENT = { from: '#f5b04e', to: '#d97706' } as const;
const ACCENT_INK = '#1a1206';

export interface ShareImageInput {
  result: CalculatorResult;
  dict: Dict;
  /** e.g. "Apex Trader Funding · 50K · EOD drawdown", shown under the title. */
  context?: string;
  projectUrl: string;
}

/* ------------------------------------------------------------------ helpers */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function font(weight: number, size: number): string {
  return `${weight} ${size}px ${FONT_STACK}`;
}

/** Draw text clipped to `maxWidth`, appending an ellipsis when it does not fit. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  align: CanvasTextAlign = 'left',
): void {
  let value = text;
  if (ctx.measureText(value).width > maxWidth) {
    while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) {
      value = value.slice(0, -1);
    }
    value = `${value}…`;
  }
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function drawQr(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const cell = size / count;
    ctx.fillStyle = color;
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (!qr.isDark(row, col)) continue;
        ctx.fillRect(x + col * cell, y + row * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
  } catch {
    /* A QR failure must never break the export — the URL text still shows. */
  }
}

/* -------------------------------------------------------------------- render */

/** Draw the whole share card. Returns the canvas so callers can pick a sink. */
export function drawShareCard(input: ShareImageInput): HTMLCanvasElement {
  const { result, dict, context, projectUrl } = input;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  /* ---- page background ---- */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, PAGE_BG.from);
  bg.addColorStop(1, PAGE_BG.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* ---- card ---- */
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  roundRect(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
  ctx.fillStyle = INK.card;
  ctx.fill();
  ctx.restore();

  /* ---- header ---- */
  const logoGradient = ctx.createLinearGradient(CONTENT_X, 96, CONTENT_X + 72, 168);
  logoGradient.addColorStop(0, ACCENT.from);
  logoGradient.addColorStop(1, ACCENT.to);
  roundRect(ctx, CONTENT_X, 96, 72, 72, 16);
  ctx.fillStyle = logoGradient;
  ctx.fill();

  // Mini bar chart glyph inside the logo (ink bars on amber).
  ctx.fillStyle = ACCENT_INK;
  const barBase = 150;
  [0.55, 0.8, 1].forEach((scale, index) => {
    const barH = 34 * scale;
    ctx.globalAlpha = 1 - index * 0.22;
    ctx.fillRect(CONTENT_X + 18 + index * 14, barBase - barH, 9, barH);
  });
  ctx.globalAlpha = 1;

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK.title;
  ctx.font = font(700, 40);
  ctx.textAlign = 'left';
  ctx.fillText(dict.appSubtitle, CONTENT_X + 92, 138);

  ctx.fillStyle = INK.faint;
  ctx.font = font(500, 24);
  fitText(ctx, context || dict.appTitle, CONTENT_X + 92, 172, CONTENT_W - 92);

  /* ---- ROI hero ---- */
  ctx.fillStyle = INK.muted;
  ctx.font = font(500, 26);
  ctx.textAlign = 'center';
  ctx.fillText(dict.roiTitle, W / 2, 300);

  const tone = toneOf(result.roi);
  const roiColor =
    tone === 'positive' ? INK.positive : tone === 'negative' ? INK.negative : INK.title;

  ctx.fillStyle = roiColor;
  ctx.font = font(800, 132);
  ctx.textAlign = 'center';
  ctx.fillText(
    result.isViable ? formatSignedPercent(result.roi, 2) : dict.placeholder,
    W / 2,
    424,
  );

  ctx.fillStyle = INK.muted;
  ctx.font = font(500, 26);
  ctx.fillText(
    `${dict.roiActualPayout} ${formatMoney(result.inputs.actualPayout)}`,
    W / 2,
    476,
  );

  const net = result.netProfit;
  ctx.fillStyle = net >= 0 ? INK.positive : INK.negative;
  ctx.font = font(600, 24);
  ctx.fillText(
    `${net >= 0 ? dict.roiNetProfit : dict.roiNetLoss} ${formatMoney(Math.abs(net))}`,
    W / 2,
    516,
  );

  /* ---- divider ---- */
  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CONTENT_X, 566);
  ctx.lineTo(CONTENT_X + CONTENT_W, 566);
  ctx.stroke();

  /* ---- metrics: 3 columns × 3 rows ---- */
  const tiles: Array<{ label: string; value: string }> = [
    { label: dict.metricExamRate, value: formatPercent(result.examPassRate, 2) },
    { label: dict.metricPayoutRate, value: formatPercent(result.payoutPassRate, 2) },
    { label: dict.metricTotalRate, value: formatPercent(result.totalPassRate, 4) },
    { label: dict.metricAccountsToBuy, value: formatCount(result.accountsToBuy, 2) },
    { label: dict.metricFundedAccounts, value: formatCount(result.fundedAccounts, 2) },
    { label: dict.metricAccountCost, value: formatMoney(result.accountCost) },
    { label: dict.metricActivationCost, value: formatMoney(result.activationCost) },
    { label: dict.metricTotalCost, value: formatMoney(result.totalCost) },
  ];

  const cols = 3;
  const gap = 14;
  const tileW = (CONTENT_W - gap * (cols - 1)) / cols;
  const tileH = 140;
  const gridTop = 610;

  tiles.forEach((tile, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = CONTENT_X + col * (tileW + gap);
    const y = gridTop + row * (tileH + gap);

    roundRect(ctx, x, y, tileW, tileH, 14);
    ctx.fillStyle = INK.sunken;
    ctx.fill();
    ctx.strokeStyle = INK.borderSoft;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = INK.muted;
    ctx.font = font(500, 22);
    fitText(ctx, tile.label, x + 22, y + 46, tileW - 44);

    ctx.fillStyle = INK.strong;
    ctx.font = font(700, 40);
    fitText(ctx, tile.value, x + 22, y + 100, tileW - 44);
  });

  /* ---- footer: url + QR ---- */
  const footerY = 1218;
  const qrSize = 132;

  roundRect(ctx, CONTENT_X + CONTENT_W - qrSize, footerY - 16, qrSize, qrSize, 10);
  ctx.fillStyle = INK.sunken;
  ctx.fill();
  ctx.strokeStyle = INK.borderSoft;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawQr(ctx, projectUrl, CONTENT_X + CONTENT_W - qrSize + 6, footerY - 10, qrSize - 12, INK.strong);

  ctx.textAlign = 'left';
  ctx.fillStyle = INK.title;
  ctx.font = font(700, 30);
  fitText(ctx, dict.appSubtitle, CONTENT_X, footerY + 42, CONTENT_W - qrSize - 40);

  ctx.fillStyle = INK.faint;
  ctx.font = font(400, 22);
  fitText(ctx, dict.footerModel, CONTENT_X, footerY + 82, CONTENT_W - qrSize - 40);
  fitText(ctx, projectUrl, CONTENT_X, footerY + 114, CONTENT_W - qrSize - 40);

  return canvas;
}

/* ------------------------------------------------------------------- output */

function safeFilename(result: CalculatorResult): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const roi = result.isViable ? result.roi.toFixed(2).replace('-', 'neg') : 'na';
  return `pf-roi-${roi}pct-${stamp}.png`;
}

/** Render + trigger a download. Returns `false` when rendering was impossible. */
export async function downloadShareImage(input: ShareImageInput): Promise<boolean> {
  const canvas = drawShareCard(input);
  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((value) => resolve(value), 'image/png');
    } catch {
      resolve(null);
    }
  });
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename(input.result);
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
