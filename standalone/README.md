# Standalone single-file build

`PF-ROI-Calculator.standalone.html` is the **original, zero-build version** of the
calculator: one HTML file containing all markup, styles and script, with every
icon inlined as SVG.

## Why keep it

- **Email / chat / USB stick friendly.** One file, no server, no install.
- **Immutable.** It will keep working exactly as it does today, forever — no
  build tooling to rot, no dependency to go missing.
- **A useful escape hatch** when a corporate network blocks hosting, or when the
  main app cannot be deployed.

## How to use it

Double-click it. That's the whole instruction. It works offline, from a `file://`
URL, in any modern browser.

## What it does *not* have

It is frozen at the v1 feature set. Compared with the main app it lacks:

- firm presets
- the scenario comparison table
- share-image export
- language switching (it is Chinese-only)
- installable PWA support
- the responsive two-column desktop layout

## Should I edit it?

No. It is a snapshot kept for convenience. All development happens in `src/`; see
[../CONTRIBUTING.md](../CONTRIBUTING.md).
