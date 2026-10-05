# PF ROI Calculator · Prop Firm ROI Calculator

**English** · [简体中文](./README.zh-CN.md)

> Before you buy another evaluation account: how many do you actually need, what
> will they cost, and is your expected return positive?

<!-- Badges -->
![CI](https://github.com/MFLS2023/pf-roi-calculator/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Dependencies](https://img.shields.io/badge/runtime%20deps-1-brightgreen.svg)
![Offline](https://img.shields.io/badge/works-offline-success.svg)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8.svg)
![Desktop](https://img.shields.io/badge/desktop-Windows%20%7C%20macOS%20%7C%20Linux-4f46e5.svg)

---

## What this is

Prop trading firms (Apex, Topstep, FTMO, FundedNext, …) sell you an *evaluation*
account. You pay, you try to hit a profit target without breaching a drawdown
limit, and if you pass you get a funded account — then you have to clear another
hurdle before you can withdraw.

Every one of those steps has a failure probability. So the real question is not
"can I pass?" but:

- How many evaluation accounts must I buy, on average, for **one** successful payout?
- What is my total spend, including activation fees?
- Given the cash I actually receive, is my **ROI positive or negative**?

This tool answers those three questions, offline, in one screen.

It is a **pure front-end static app**: no backend, no account, no telemetry, no
network access at runtime. One runtime dependency, total.

## Screenshots

| Desktop (light) | Desktop (dark) | Mobile |
| --- | --- | --- |
| ![Desktop](./docs/screenshot-desktop.png) | ![Dark](./docs/screenshot-dark.png) | ![Mobile](./docs/screenshot-mobile.png) |

---

## Quick start

### 1. Use it in a browser (nothing to install)

Open the hosted build, or just open `standalone/PF-ROI-Calculator.standalone.html`
in any browser — it is a single file with zero dependencies and works from a USB
stick, offline, forever.

### 2. Install it as an app (recommended)

Open the web build and install it:

- **Android / Chrome / Edge** — an "Install" button appears in the app header, or
  use the browser's *Install app* menu item.
- **iOS Safari** — tap **Share → Add to Home Screen**.
- **Desktop Chrome / Edge** — the install icon in the address bar.

Once installed it launches in its own window and works with no network at all.

### 3. Desktop app

Grab an installer from the
[Releases page](https://github.com/MFLS2023/pf-roi-calculator/releases):
`.msi`/`.exe` for Windows, `.dmg` for macOS, `.deb`/`.rpm`/`.AppImage` for Linux.
These are built in CI; you do not need Node or Rust to use them.

### 4. Run from source

Requires **Node.js ≥ 20.19** (see `engines` in `package.json` and `.nvmrc`).
No Rust toolchain is needed unless you want to build the desktop shell.

```bash
git clone https://github.com/MFLS2023/pf-roi-calculator.git
cd pf-roi-calculator
npm install
npm run dev        # http://127.0.0.1:5173
```

> On a slow link to the npm registry, add
> `--registry=https://registry.npmmirror.com` to `npm install`. If you do, restore
> the canonical URLs in the lockfile before committing:
> `sed -i 's|registry.npmmirror.com|registry.npmjs.org|g' package-lock.json`.

---

## The model

### Stage pass probability

From a starting equity, a **zero-drift random walk** (the classic gambler's ruin
result) says the probability of reaching a profit target `T` before a drawdown
limit `D` is:

```
P_single = D / (D + T)
```

Compounded over `N` trading days:

```
P = (D / (D + T)) ^ N
```

- **Evaluation pass rate** — `P_exam = (examDrawdown / (examDrawdown + examTarget)) ^ examDays`
- **Payout pass rate** — `P_payout = (payoutDrawdown / (payoutDrawdown + payoutTarget)) ^ payoutDays`
- **Combined** — `P_total = P_exam × P_payout`

### Accounts and cost

To obtain one success you must, on average, attempt `1 / P` times (the expectation
of a geometric distribution):

```
N_buy     = 1 / P_total
N_funded  = N_buy × P_exam  =  1 / P_payout

accountCost    = N_buy    × costPerAccount
activationCost = N_funded × activationFee
totalCost      = accountCost + activationCost
```

### Return

```
ROI = (actualPayout − totalCost) / totalCost × 100%
```

### Worked example (the default scenario)

| Input | Value |
| --- | --- |
| Cost per account | $49 |
| Activation fee | $149 |
| Evaluation drawdown / target / days | $1,000 / $1,500 / 2 |
| Payout drawdown / target / days | $1,000 / $4,000 / 1 |
| Actual payout received | $1,800 |

| Result | Value |
| --- | --- |
| Evaluation pass rate | `(1000/2500)² = 16.00%` |
| Payout pass rate | `(1000/5000)¹ = 20.00%` |
| Combined pass rate | `3.2000%` |
| Accounts to buy | `1 / 0.032 = 31.25` |
| Funded accounts | `1 / 0.20 = 5.00` |
| Account cost | `31.25 × $49 = $1531` |
| Activation cost | `5.00 × $149 = $745` |
| Total cost | `$2276` |
| **ROI** | **`-20.92%`** |

Negative expectancy is a *loss* — the UI colours follow the international
convention: **gains are green, losses are red**.

---

## Limitations — read this before trusting a number

This is a **mathematical expectancy estimate**, not a simulation and not advice.
It is deliberately simple, and the simplifications matter:

1. **Zero drift, constant risk.** The model assumes your per-day outcome is a fair
   coin with no edge. If you have a genuine statistical edge, the true pass rate is
   higher than this model says — and if you are losing on average, it is lower.
2. **`days` is a repeated trial — real payout gates are not.** `P = (D/(D+T))^N`
   assumes you must independently clear the *full* target `N` times in a row.
   Verified against official rule pages (2026-10), real payout gates are three
   other shapes: **calendar cycles** (FundedNext 21-day option: no target, no
   minimum days), **N non-consecutive winning days** with a small daily profit
   floor (Apex 50K EOD: 5 days ≥ $250 each; Topstep: 5 days ≥ $200 each), and
   **minimum-balance gates** (Apex Safety Net = drawdown + $100). No firm asks
   for "N full-target clears", and all of these are strictly easier. Presets
   therefore model the payout phase as a **single attempt** (`days = 1`) aimed
   at the realistic minimum-balance target; each preset's note spells out the
   official rule it abstracts. `days > 1` only remains to approximate
   multi-phase *evaluations* (e.g. FundedNext Stellar's two sequential targets).
   This is the single biggest lever on the result — moving payout days from 5
   to 1 can change the answer by an order of magnitude.
3. **Two-step evaluations are approximated.** FTMO 2-Step, FundedNext Stellar and
   similar run two phases, while this model has one evaluation phase. Presets keep
   the tighter phase's drawdown and set `days = 2` to compound twice — an
   approximation, stated in each preset's note.
4. **One payout, not a career.** The result is the expectancy of a *single*
   successful payout cycle, not lifetime P&L across multiple withdrawals.
5. **Independence is assumed.** Real attempts are correlated: the same trader,
   the same market regime, the same bad habits.
6. **Drawdown types are flattened.** Trailing vs. static, intraday vs. end-of-day,
   and daily loss limits are all collapsed into a single `D`. Modes with a daily
   loss limit are worse still: the effective risk is the daily loss, not the
   total drawdown — community consensus is to skip such modes entirely.
7. **Consistency rules are ignored.** Many firms cap the best single day as a
   percentage of total profit (Apex: 50%; FundedNext On-Demand: 40%; some payout
   modes run 30–40%). The model does not simulate daily paths, so it cannot
   enforce these caps — treat its output as the *unconstrained* expectancy.

Every preset carries a confidence rating and a note explaining what was assumed.
**Always verify current rules and pricing with the firm.**

---

## Firm presets

Presets are **community-maintained reference values**, not authoritative pricing.
Each one records the URL it was verified against and the month it was checked.

| Preset | Market | Cost | Eval D/T/days | Payout D/T/days | Verified | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Reference example | — | $49 | 1000 / 1500 / 2 | 1000 / 4000 / 1 | 2026-10 | high |
| Apex Trader Funding 50K (EOD) | futures | $249 | 2000 / 3000 / 1 | 2500 / 2600 / 1 | 2026-10 | medium |
| Topstep 50K Combine | futures | $49/mo | 2000 / 3000 / 1 | 2000 / 2000 / 1 | 2026-10 | low |
| FTMO 100K 1-Step | forex | $540 | 10000 / 10000 / 1 | 10000 / 10000 / 1 | 2026-10 | medium |
| FundedNext Stellar 100K | forex | $550 | 10000 / 8000 / 2 | 10000 / 2000 / 1 | 2026-10 | medium |
| FundedNext Rapid Pro 25K | futures | $90 | 1000 / 1500 / 1 | 1000 / 267 / 3 | 2026-10 | medium |
| FundedNext Flex 50K | futures | $69.99 | 1500 / 834 / 3 | 1500 / 3000 / 1 | 2026-10 | medium |

> \* In the two FundedNext futures presets the profit column holds the **per-day
> share** of the target (their consistency rules force at least 3 days), not the
> full target — see the notes inside `src/data/presets.ts`.

Adding a firm is a one-object change in `src/data/presets.ts` — see
[CONTRIBUTING.md](./CONTRIBUTING.md). There is a dedicated issue template for it.

---

## Features

- **Responsive** — one column on phones, a two-column workbench on desktop,
  touch-sized inputs on coarse pointers, safe-area aware when installed.
- **Offline-first PWA** — installable, precached by a service worker, no network
  needed after first load.
- **Native desktop builds** — Tauri v2; ~10 MB installers, no bundled Chromium.
- **Bilingual** — 简体中文 / English, switchable in-app. Missing translations fail
  the build.
- **Scenario comparison** — save up to 20 parameter sets, compare ROI side by
  side, best row highlighted, persisted locally.
- **Share image export** — 1080×1350 PNG with a QR code, drawn on-device with
  Canvas. No `html2canvas`, no server.
- **Dark mode** — dark-first "terminal ledger" theme with a warm-paper light mode.
- **Conventional P&L colours** — gains are green, losses are red, matching every
  other trading tool.
- **Reduced motion** — honours the OS `prefers-reduced-motion` setting.
- **Deep links** — `?preset=ftmo-100k-1step` loads a preset directly.
- **Zero-configurable-failure** — every input path is sanitised; no combination of
  inputs produces `NaN` or `Infinity` in the UI.

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build | Vite 8 | Fast, zero-config, tiny output |
| Language | TypeScript 5 (strict) | The model is the product; types protect it |
| UI | Vanilla DOM + CSS custom properties | No framework overhead for a one-screen app |
| Tests | Vitest | Shares the Vite pipeline |
| PWA | vite-plugin-pwa (Workbox) | Correct precache manifest generation |
| Desktop | Tauri v2 | ~10 MB binaries vs. ~100 MB for Electron |
| Runtime deps | **1** (`qrcode-generator`) | Keeps forks cheap and audits trivial |

Output: **~30 kB gzipped** of JavaScript and CSS.

---

## Project structure

```
src/
  domain/       pure logic — calculator, formatter, scenarios, constants, types
  platform/     browser plumbing — safe localStorage wrapper
  state/        observable app store (unidirectional data flow)
  data/         declarative data — firm presets, form schema
  i18n/         dictionaries + locale store
  ui/           DOM modules — form, metrics, compare, export, toast, icons, dom
  styles/       tokens.css → base.css → components.css
tests/          Vitest specs
scripts/        build tooling (icon generator) — never imported by the app
standalone/     original single-file HTML build
src-tauri/      Rust desktop shell
```

Design tokens live in exactly one place (`src/styles/tokens.css`); every default
input lives in exactly one place (`src/domain/constants.ts`); every
user-visible string lives in exactly one place (`src/i18n/`); all mutable state
flows through the observable store (`src/state/store.ts`).

---

## Development

```bash
npm run dev            # dev server with HMR
npm run build          # typecheck + production build → dist/
npm run preview        # serve dist/ on :4173
npm test               # unit tests
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run icons          # regenerate all app icons (committed output)
npm run desktop:dev    # Tauri dev window (requires Rust)
npm run desktop:build  # native installers for the current OS (requires Rust)
```

CI runs lint → typecheck → test → build, plus a check that the committed icons
match what `scripts/generate-icons.mjs` produces.

---

## Deployment

### GitHub Pages

Push to `main` and `.github/workflows/deploy-pages.yml` publishes `dist/`.

> ⚠️ **Mainland China:** `*.github.io` is **not** reliably reachable from mainland
> China — expect DNS poisoning and SNI-based resets, varying by ISP and province.
> Since the app is a static bundle, host it anywhere:
>
> - **Tencent Cloud EdgeOne Pages** — fast inside China, free tier
> - **Cloudflare Pages** — better, but still not guaranteed
> - **Alibaba Cloud OSS + CDN**
> - **Gitee Pages**, or your own nginx / object storage
>
> The desktop build sidesteps this entirely by working offline.

### Any static host

```bash
npm run build     # then upload dist/
```

All asset paths are relative (`base: './'`), so it works from a sub-path, a CDN
root, or `file://`.

### Desktop releases

Tag a commit and the multi-platform workflow builds and attaches installers to a
draft release:

```bash
git tag v2.0.1
git push origin v2.0.1
```

---

## Good first issues

- **Add a firm preset** — the most useful contribution. One object in
  `src/data/presets.ts`.
- **Add a language** — copy `src/i18n/en.ts`, translate, register it.
- **Improve screen-reader labelling** on the metrics board.
- **Add a break-even calculator** — "what payout do I need for ROI = 0?"

---

## Acknowledgements

- **[Z-shen (z说交易)](https://space.bilibili.com/101513971)** — a futures
  prop-trading educator on Bilibili. His walkthroughs of prop-firm rule mechanics
  (drawdown types, consistency rules, winning days, buffers) and his
  expectancy-first way of evaluating account prices directly inspired this
  project, and the FundedNext Futures presets were sanity-checked against real
  cash-outs he documented. 谢谢 Z神提供的灵感与讲解 — this tool exists because of
  that material. Go follow the channel.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md). This project follows the
[Contributor Covenant](./CODE_OF_CONDUCT.md). Security issues: see
[SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © PF ROI Calculator contributors

## Disclaimer

This tool performs a mathematical expectancy estimate. It is **not investment
advice** and it is not affiliated with, endorsed by, or connected to any prop
trading firm. Trading carries risk; past probabilities do not predict future
results. Verify every rule and price with the firm before you spend money.
