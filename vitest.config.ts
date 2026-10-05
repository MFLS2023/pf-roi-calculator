import { defineConfig } from 'vitest/config';

/**
 * Test runner config, deliberately separate from `vite.config.ts`.
 *
 * Vitest bundles its own Vite copy; keeping the PWA plugin out of this file
 * avoids a duplicate-Vite type clash and keeps unit tests fast, since they never
 * need to build the service worker.
 */
export default defineConfig({
  // Keep every cache inside the project so tests also run in locked-down
  // environments (CI sandboxes, restricted corporate machines) where writing to
  // the system temp directory is denied.
  cacheDir: './node_modules/.vite/vitest',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: ['default'],
    // Run test files sequentially. Parallel workers spawn temp files outside the
    // project, which fails in locked-down sandboxes; for two small files the
    // serial cost is negligible and the run becomes deterministic everywhere.
    fileParallelism: false,
  },
});
