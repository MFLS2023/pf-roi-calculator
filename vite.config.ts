// Build/dev config only. Test config lives in `vitest.config.ts` so that the
// test runner never has to type-check the PWA plugin's Vite version.
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * `base: './'` keeps every emitted URL relative, which is required for:
 *   1. Tauri  — the front-end is loaded through a custom protocol, not a web server.
 *   2. GitHub Pages *project* sites — served from /<repo>/ instead of the domain root.
 *   3. `file://` double-click usage of a built `dist/`.
 */
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsInlineLimit: 4096,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: false,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        id: 'pf-roi-calculator',
        name: 'PF ROI Calculator · Prop Firm 投产比计算器',
        short_name: 'PF ROI',
        description:
          'Estimate prop-firm exam & payout pass rates, accounts needed and ROI with the gambler\u2019s ruin model. Works fully offline.',
        lang: 'zh-CN',
        dir: 'ltr',
        theme_color: '#6366f1',
        background_color: '#eef2f6',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        orientation: 'any',
        start_url: './',
        scope: './',
        categories: ['finance', 'utilities', 'productivity'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
});
