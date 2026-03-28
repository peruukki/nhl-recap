import autoprefixer from 'autoprefixer';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
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
