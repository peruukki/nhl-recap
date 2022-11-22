import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Adapted from https://developers.google.com/web/tools/workbox/guides/get-started#routing_and_caching_strategies

// @ts-ignore
// eslint-disable-next-line no-underscore-dangle
precacheAndRoute(self.__WB_MANIFEST);

// Network First strategy: page navigations (HTML)
registerRoute(
  ({ request: { mode } }) => mode === 'navigate',
  new NetworkFirst({ cacheName: 'pages' }),
);

// Network First strategy: API requests
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api' }),
);

// Stale While Revalidate strategy: CSS, JS and Web Worker assets
registerRoute(
  ({ request: { destination } }) =>
    destination === 'script' || destination === 'style' || destination === 'worker',
  new StaleWhileRevalidate({ cacheName: 'assets' }),
);

// Cache First strategy: fonts
registerRoute(
  ({ request: { destination } }) => destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 /* 30 days */ }),
    ],
  }),
);

// Cache First strategy: images
registerRoute(
  ({ request: { destination }, url }) => destination === 'image' || url.pathname.endsWith('.svg'),
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 /* 7 days */ }),
    ],
  }),
);
