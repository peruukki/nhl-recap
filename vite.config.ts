import autoprefixer from 'autoprefixer';
import { defineConfig } from 'vite';

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
    port: 8008,
  },
  publicDir: 'app/assets',
  server: {
    host: '0.0.0.0',
    open: true,
    port: 8008,
  },
  test: {
    coverage: {
      exclude: ['service-worker/'],
    },
    root: 'app/src',
  },
});
