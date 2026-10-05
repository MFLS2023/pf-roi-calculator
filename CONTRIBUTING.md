# Contributing

Thanks for taking the time to contribute. This project is deliberately small and
dependency-light — please keep it that way.

> 中文贡献指南见本文末尾 [中文](#中文贡献指南)。

---

## Quick start

```bash
git clone https://github.com/MFLS2023/pf-roi-calculator.git
cd pf-roi-calculator
npm install
npm run dev          # http://127.0.0.1:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the built `dist/` on port 4173 |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run icons` | Regenerate every app icon (committed output) |
| `npm run desktop:dev` | Tauri desktop window against the dev server (needs Rust) |
| `npm run desktop:build` | Native installers for the current OS (needs Rust) |

## Project layout

```
src/
  core/       pure, DOM-free logic — calculator, formatter, storage, scenarios
  data/       declarative data — firm presets, form schema
  i18n/       dictionaries + locale store
  ui/         DOM-facing modules — form, metrics, comparison, export, toast, icons
  styles/     tokens.css → base.css → components.css
tests/        Vitest specs for core/ and data/
scripts/      build-time tooling (never imported by the app)
standalone/   the original single-file HTML build, kept for offline sharing
src-tauri/    Rust desktop shell
```

**Rules of the house**

- `src/core/**` must stay free of DOM and `window` references. That is what makes
  it testable; a pull request that adds `document` to the calculator will be asked
  to move it.
- All user-visible strings go through `src/i18n`. Never hard-code copy in a
  component.
- Design tokens live only in `src/styles/tokens.css`. Do not write raw hex values
  in component CSS.
- `scripts/` is build tooling. It must never be imported by `src/`.

## Adding or fixing a firm preset

Presets are community-maintained and are the contribution we need most.

1. Open `src/data/presets.ts`.
2. Add or edit one object in `PRESETS`.
3. Fill `source` with the URL you verified against and `verifiedAt` with `YYYY-MM`.
4. Be honest in `confidence`, and explain every derived number in `note`
   (both `zh-CN` and `en`).
5. Run `npm test` — `tests/presets.test.ts` checks structure, ranges and that the
   preset yields a finite, viable result.

**Do not invent numbers.** A preset marked `low` confidence with an explicit
caveat is far more useful than a confident-looking wrong one. If a firm runs a
2-step evaluation, or its "minimum trading days" is a gate rather than a repeated
trial, say so in `note` — see the comments at the top of `presets.ts`.

## Changing the mathematical model

This is the highest-scrutiny area of the codebase.

- Reference numbers in `tests/calculator.test.ts` are copied from the original
  design spec. If your change moves them, say so explicitly in the PR and justify
  why the new value is more correct.
- Any new edge case (division by zero, negative input, absurd day counts) must be
  covered by a test that asserts we never emit `NaN` or `Infinity`.
- Update the formula documentation in both `README.md` and `README.zh-CN.md`.

## Translations

`src/i18n/zh-CN.ts` is the canonical dictionary; `Dict` is derived from it, so a
missing key in another locale is a **compile error**. To add a language:

1. Copy `src/i18n/en.ts` to `src/i18n/<locale>.ts` and translate the values.
2. Add it to `DICTS` and `LOCALES` / `LOCALE_LABELS`.
3. Add the locale to `tests/` if you add locale-sensitive formatting.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/) are appreciated but
not enforced:

```
feat(compare): allow renaming a saved scenario
fix(calc): clamp negative day counts before exponentiating
docs(readme): document the model's limitations
data(presets): refresh Apex 50K pricing for 2026-10
```

## Pull requests

- Keep them focused. One logical change per PR.
- Fill in the PR template, especially the model-change section when relevant.
- Visual changes need before/after screenshots at a desktop width **and** a
  narrow mobile width (~390px).
- CI must be green: lint, typecheck, tests, build, and the icon-drift check.

## Good first issues

- Add a firm preset (see above).
- Add a language.
- Improve `prefers-reduced-motion` handling.
- Accessibility: the metrics board announces changes but could use better
  labelling for screen readers.

---

## 中文贡献指南

感谢你愿意贡献。这个项目刻意保持**小而轻依赖**，请一起维护这一点。

**快速开始**

```bash
git clone https://github.com/MFLS2023/pf-roi-calculator.git
cd pf-roi-calculator
npm install
npm run dev          # http://127.0.0.1:5173
```

**几条硬规矩**

- `src/core/**` 里**不允许**出现 DOM / `window`。这是它可被测试的前提。
- 所有面向用户的文案都要走 `src/i18n`，组件里不许硬编码字符串。
- 颜色、圆角、阴影等设计变量只写在 `src/styles/tokens.css`，组件 CSS 里不写裸色值。
- `scripts/` 是构建工具，绝不能被 `src/` 引用。

**贡献机构预设（最需要的一类贡献）**

改 `src/data/presets.ts` 里的一个对象即可，然后跑 `npm test` 验证。
必须填 `source`（核实来源 URL）和 `verifiedAt`（`YYYY-MM`），
并在 `note` 里用中英双语写清哪些数字是假设值。

**不要凭空编数字。** 标注 `low` 置信度 + 明确说明假设的预设，远比一个看起来很确定但错误的数字有价值。
如果某家机构是两阶段考核，或者它的「最少交易天数」只是门槛而非「每天都要重新达成目标」，请在 `note` 里说明。

**改数学模型** 是本项目最敏感的部分：必须同步更新 `tests/calculator.test.ts` 里的参考值并在 PR 中说明理由，
同时更新中英两个 README 里的公式说明。
