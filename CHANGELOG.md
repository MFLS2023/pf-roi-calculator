# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **P&L colours now follow the international convention** (green up / red down).
  The previous Chinese-market palette (红涨绿跌) and its in-app legend are gone;
  the exported share image was switched over too, so both surfaces agree.
- **The scenario comparison panel moved into the results column**, directly under
  "export share image". The whole tool now fits inside a 900px-tall viewport
  without scrolling on desktop.
- **Status colours are no longer borrowed from the P&L palette.** New `--success`
  / `--danger` tokens drive toasts, invalid fields and the delete button, so
  flipping the P&L convention can never silently recolour a status message.
- **The preset reference note now survives manual edits.** It is driven by a new
  `presetOrigin` field and gains an "inputs modified" badge, instead of vanishing
  on the first keystroke — exactly when the caveats matter most.
- **The footer acknowledgement line was removed** from the app; the credit lives
  in the READMEs only.

### Added

- **GitHub shortcut in the header** — the repository handle and mark, linking to
  `github.com/MFLS2023/pf-roi-calculator`.

### Fixed

- **Extreme inputs no longer render exponential notation.** `toFixed()` switches
  to exponential form at 1e21, which used to leak 21-character strings such as
  `9.999999999999985e+89` into ~90px metric tiles. Large magnitudes now use
  compact suffixes (`12.0M`, `4.90T`) and fall back to a short `1.0e+45`; output
  width is bounded and covered by tests.
- **Out-of-range input is no longer silently ignored.** Typing `-50` into a
  `min="0"` field used to leave the box showing `-50` while every metric was
  computed from `0`. The field is now flagged while typing and snapped to the
  nearest legal value on blur, so the box always shows what is being computed.
- **Choosing "custom" in the preset dropdown no longer desynchronises the UI** —
  it used to leave the dropdown reading "custom" while the note still described
  the previous firm.
- **`AppState.inputs` and `AppState.result.inputs` can no longer disagree** — all
  input paths funnel through a single sanitising `commit()`.
- Removed dead API (`peekName`, `focusName`, `focusFirst`) and a stale comment
  referring to the long-gone `app.ts`.

## [2.0.0] — 2026-10-04

### Added

- **Original "terminal ledger" design language** — dark-first trading-terminal
  theme (deep blue-black surfaces, amber accent, sharp radii, mono numerals,
  subtle grid backdrop) with a warm-paper light mode. P&L colours follow the
  international convention (green up / red down). The exported share image
  adopts the same palette.
- **FundedNext Futures presets** — `Rapid Pro 25K` and `Flex 50K`, verified
  against the official rules pages and real community cash-outs (2026-10).
  These follow the community "averaging convention": because FundedNext's 40%
  consistency rule forces at least 3 days, the profit fields hold the per-day
  share of the target (e.g. 800÷3≈267) with `days = 3`, which reproduces the
  numbers taught in community material (Rapid 25K → ~5.08 accounts, ~+52% ROI).
- **Attribution** — an Acknowledgements section in both READMEs crediting
  [Z-shen (Bilibili)](https://space.bilibili.com/101513971) for the inspiration
  and the prop-firm rule walkthroughs behind the presets.

### Changed

- **Architecture: unidirectional data flow** — a new observable store
  (`src/state/store.ts`) owns all mutable state (inputs, result, scenarios,
  preset id); `main.ts` is now a pure view-wiring layer that turns DOM events
  into store actions and re-renders from state. Layers renamed for clarity:
  `src/core/` → `src/domain/`, storage moved to `src/platform/`. The module
  layout is now domain / data / state / i18n / ui / platform.
- **Toolchain security refresh** — Vite 6 → 8, vite-plugin-pwa 0.21 → 2,
  Vitest 2 → 5. Clears all five `npm audit` advisories (one critical, one high,
  three moderate; all dev-server-side, none affected the shipped bundle).
  `engines.node` floor raised to `>=20.19` accordingly.
- **Accessibility** — the UI now honours `prefers-reduced-motion`: value flashes,
  toasts and the loader stop animating, and programmatic scrolling no longer
  uses smooth behaviour.
- **Docs** — corrected the gzipped bundle size (~24 kB → ~26 kB, JS + CSS).

### Fixed

- **Firm presets corrected against official rules (2026-10)** — the payout phase
  had been modelled as "N repeated full-target clears" (`payoutDays = 5`), which
  no firm actually requires. Official pages show payout gates are instead
  "N non-consecutive winning days with a small daily profit floor" (Apex 50K EOD:
  5 × $250+; Topstep: 5 × $200+), minimum-balance gates (Apex Safety Net =
  drawdown + $100), or calendar cycles (FundedNext 21-day option). Presets now
  model the payout phase as a single attempt (`days = 1`) with verified targets
  and first-payout caps, carry official source URLs (Apex & FundedNext help
  centres), and FundedNext's outdated "5 Benchmark Days" description was
  replaced with the three official payout options. The old mapping overstated
  the cost dramatically (e.g. Apex showed ~160 accounts / −94% ROI where the
  official rules imply roughly break-even).
- **Document unmodelled consistency rules** — added limitation #7: firms cap the
  best single day as a share of total profit (Apex 50%, FundedNext On-Demand
  40%, some modes 30–40%), and the model treats its output as unconstrained
  expectancy. Spotted while cross-checking against community teaching material.
- **Desktop release workflow** — install the `aarch64-apple-darwin` and
  `x86_64-apple-darwin` Rust targets so the macOS universal build can actually
  compile; move the Linux leg to `ubuntu-24.04` (22.04 entered deprecation in
  September 2026) and align its packages with the Tauri v2 prerequisites
  (`libxdo-dev`, `libssl-dev`, `libayatana-appindicator3-dev`).
- **Share-image QR code inside the Tauri shell** — the Windows webview origin
  (`http://tauri.localhost`) satisfied the live-URL check, so exported share
  images carried a QR code pointing at a non-existent address. The desktop shell
  now always falls back to the canonical project URL.
- **Scenario storage cap** — when a stored list exceeded the 20-scenario cap
  (manual edit or an older version), normalisation kept the *oldest* entries;
  it now keeps the newest, matching what persistence would have written.
- **Test runner in restricted environments** — run test files sequentially so
  sandboxes that deny worker temp-file access still execute the full suite.

## [2.0.0] — 2026-10-04

The first open-source release. Rebuilt from a single-file HTML prototype into a
maintainable project, and extended with everything a fork needs.

### Added

- **Responsive layout** — a single column on phones, a two-column workbench on
  desktop (≥1024px), with touch-sized controls on coarse pointers.
- **PWA support** — web app manifest, service worker precaching, and installable
  on Android, iOS and desktop Chrome/Edge. Works fully offline.
- **Desktop app** — Tauri v2 shell producing Windows, macOS and Linux installers,
  built entirely in CI so no local Rust toolchain is required.
- **Firm presets** — Apex Trader Funding 50K, Topstep 50K, FTMO 100K 1-Step and
  FundedNext Stellar 100K, each carrying a source URL, a verified month and a
  confidence rating.
- **Bilingual UI** — Simplified Chinese and English, with the canonical dictionary
  type-checked so a missing translation is a compile error.
- **Scenario comparison** — save up to 20 parameter sets, compare ROI side by side,
  best row highlighted, persisted to `localStorage`.
- **Share image export** — renders the result to a 1080×1350 PNG with a QR code,
  drawn entirely with the Canvas 2D API.
- **Dark mode** — automatic via `prefers-color-scheme`.
- **Unit tests** — 52 Vitest cases covering the model, formatters, sanitiser and
  preset data.
- **CI/CD** — lint, typecheck, test and build on every push; GitHub Pages deploy;
  multi-platform desktop release workflow; icon-drift check.
- **Community files** — README (EN + 中文), CONTRIBUTING, CODE_OF_CONDUCT,
  SECURITY, issue templates (including a dedicated preset-update template) and a
  PR template.

### Changed

- Money values no longer use thousands separators, matching the reference design
  exactly (`$1531`, not `$1,531`).
- Inputs are sanitised through a single `sanitizeInputs()` path instead of ad-hoc
  `parseFloat(...) || 0` calls scattered through the renderer.

### Preserved

- `standalone/PF-ROI-Calculator.standalone.html` — the original zero-build,
  single-file build, kept for sharing over chat or running from a USB stick.

[Unreleased]: https://github.com/MFLS2023/pf-roi-calculator/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/MFLS2023/pf-roi-calculator/releases/tag/v2.0.0
