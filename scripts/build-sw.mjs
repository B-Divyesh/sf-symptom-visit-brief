import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname;

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    // Static Web Apps reads this deployment configuration but deliberately
    // does not publish it. Precaching it makes cache.addAll reject on the
    // public host and aborts service-worker installation.
    else if (entry.name !== 'sw.js' && entry.name !== 'staticwebapp.config.json' && !entry.name.endsWith('.map')) files.push(`/${relative(root, path).replaceAll('\\', '/')}`);
  }
  return files;
};

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const cacheName = `visit-brief-${packageJson.version}`;
const shell = await walk(root);
const serviceWorker = `
const CACHE = ${JSON.stringify(cacheName)};
const SHELL = ${JSON.stringify(shell)};
let IS_UPDATE = false;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await caches.open(CACHE).then((cache) => cache.addAll(SHELL));
    if (self.registration.active) {
      IS_UPDATE = true;
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach((client) => client.postMessage({ type: 'UPDATE_AVAILABLE' }));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
    if (IS_UPDATE) {
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach((client) => client.postMessage({ type: 'UPDATE_READY' }));
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
        return response;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(request)) || (await cache.match('/index.html')) || (await cache.match('/offline.html'));
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
      return response;
    } catch {
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
`;

await writeFile(join(root, 'sw.js'), serviceWorker.trimStart());
console.log(`Generated ${cacheName} service worker with ${shell.length} precached files.`);
