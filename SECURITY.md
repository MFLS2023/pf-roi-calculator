# Security policy

## What this project is

A **100% client-side, offline calculator**. It has no backend, no accounts, no
telemetry, no analytics, and it makes no network requests at runtime. The desktop
build runs in a Tauri webview with a strict Content-Security-Policy and no native
permissions beyond `core:default`.

The practical attack surface is therefore very small — but not zero.

## Supported versions

Only the latest released version is supported with security fixes.

| Version | Supported |
| --- | --- |
| 2.x | ✅ |
| < 2.0 | ❌ |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private reporting flow:
**[Report a vulnerability](https://github.com/MFLS2023/pf-roi-calculator/security/advisories/new)**

Include, as far as you can:

- what the issue is and where it lives (file, function, or build step);
- how to reproduce it;
- the impact you believe it has;
- any suggested fix.

You can expect an initial response within about a week. This is a volunteer
project, so please be patient.

## Areas worth probing

If you are looking for something to test, these are the realistic risk areas:

- **`scripts/generate-icons.mjs`** — hand-written PNG/ICO/ICNS encoders. Malformed
  output or an integer overflow in the binary writers would be interesting.
- **`localStorage` handling** (`src/core/storage.ts`, `src/core/scenarios.ts`) —
  a crafted `pf-roi-calculator:scenarios:v1` value must never produce `NaN`,
  execute code, or break rendering. It is treated as untrusted input; if you find
  a way past that, we want to know.
- **The share-image export** (`src/ui/export-image.ts`) — Canvas rendering of
  user-controlled strings.
- **Supply chain** — we keep exactly one runtime dependency
  (`qrcode-generator`). A pull request adding a dependency will be scrutinised
  heavily for this reason.

## Out of scope

- Incorrect numbers in a firm preset. Those are **data** issues, not security
  issues — please use the "Update or add a firm preset" issue template.
- The mathematical model being a simplification of real prop-firm rules. That is
  documented behaviour; see the README's limitations section.
