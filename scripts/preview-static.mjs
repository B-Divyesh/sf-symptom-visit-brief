import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const argumentsList = process.argv.slice(2);
const option = (name, fallback) => {
  const index = argumentsList.indexOf(name);
  return index >= 0 ? argumentsList[index + 1] : fallback;
};
const host = option('--host', '127.0.0.1');
const port = Number(option('--port', '4173'));
const outputDirectory = resolve(new URL('../dist/', import.meta.url).pathname);
const configuration = JSON.parse(await readFile(join(outputDirectory, 'staticwebapp.config.json'), 'utf8'));

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

const matchesRoute = (route, pathname) => route === pathname ||
  (route.endsWith('/*') && pathname.startsWith(route.slice(0, -1)));

const headersFor = (pathname) => {
  const matchingRoute = configuration.routes?.find((route) => matchesRoute(route.route, pathname));
  return { ...(configuration.globalHeaders || {}), ...(matchingRoute?.headers || {}) };
};

const configuredRewrite = (pathname) => configuration.routes
  ?.find((route) => matchesRoute(route.route, pathname))?.rewrite;

const resolvedFile = async (pathname) => {
  const safePath = normalize(pathname).replace(/^(?:\.\.(?:[/\\]|$))+/, '');
  let candidate = join(outputDirectory, safePath);
  try {
    if ((await stat(candidate)).isDirectory()) candidate = join(candidate, 'index.html');
    return candidate;
  } catch {
    return null;
  }
};

const sendFile = async (response, request, pathname, statusCode = 200) => {
  const file = await resolvedFile(pathname);
  if (!file) return false;
  const headers = {
    ...headersFor(new URL(request.url, `http://${request.headers.host}`).pathname),
    'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream'
  };
  response.writeHead(statusCode, headers);
  if (request.method === 'HEAD') response.end();
  else response.end(await readFile(file));
  return true;
};

const server = createServer(async (request, response) => {
  if (!request.url || !['GET', 'HEAD'].includes(request.method || '')) {
    response.writeHead(405).end();
    return;
  }
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);

  // Azure Static Web Apps consumes deployment configuration instead of
  // exposing it as a public asset. Keeping that behavior in browser tests
  // catches service-worker precache mistakes before deployment.
  if (pathname === '/staticwebapp.config.json') {
    response.writeHead(404, headersFor(pathname)).end();
    return;
  }

  const rewrite = configuredRewrite(pathname);
  if (rewrite && await sendFile(response, request, rewrite)) return;
  if (await sendFile(response, request, pathname)) return;

  const override = configuration.responseOverrides?.['404'];
  if (override?.rewrite && await sendFile(response, request, override.rewrite, override.statusCode || 404)) return;
  response.writeHead(404, headersFor(pathname)).end();
});

server.listen(port, host, () => {
  console.log(`Static host-equivalent preview listening on http://${host}:${port}`);
});
