import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import autoprefixer from 'autoprefixer';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: '/nhl-recap/',
  build: {
    assetsDir: '',
    emptyOutDir: true,
    outDir: 'public',
  },
  css: {
    postcss: {
      plugins: [autoprefixer],
    },
  },
  preview: {
    host: '0.0.0.0',
    open: true,
    port: 8009,
  },
  // xstream sets `__esModule: true` in its CJS output, which Vite 8 (Rolldown) ignores,
  // causing `import xs from 'xstream'` to return the full module object instead of `xs`.
  legacy: {
    inconsistentCjsInterop: true,
  },
  publicDir: 'app/assets',
  resolve: {
    alias: {
      '@app': resolve(__dirname, './app'),
    },
  },
  server: {
    host: '0.0.0.0',
    open: true,
    port: 8009,
  },
  test: {
    coverage: {
      exclude: ['service-worker/'],
    },
    root: 'app/src',
  },
});
