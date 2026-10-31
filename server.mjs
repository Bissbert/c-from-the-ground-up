#!/usr/bin/env node
// Dependency-free static server for the course.
//   /                → app/
//   /vendor/clang/   → node_modules/@yowasp/clang/gen/      (Clang + LLD compiled to WebAssembly)
//   /vendor/wasi/    → node_modules/@bjorn3/browser_wasi_shim/dist/

import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || '127.0.0.1';

const mounts = [
  ['/vendor/clang/', path.join(root, 'node_modules/@yowasp/clang/gen')],
  ['/vendor/wasi/', path.join(root, 'node_modules/@bjorn3/browser_wasi_shim/dist')],
  ['/', path.join(root, 'app')],
];

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.wasm': 'application/wasm',
  '.tar': 'application/x-tar',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function resolve(urlPath) {
  for (const [prefix, dir] of mounts) {
    if (urlPath.startsWith(prefix)) {
      const rel = decodeURIComponent(urlPath.slice(prefix.length));
      const file = path.join(dir, rel);
      if (!file.startsWith(dir)) return null; // path traversal
      return file;
    }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = resolve(url.pathname);
  try {
    if (!file) throw new Error('bad path');
    let info = await stat(file);
    if (info.isDirectory()) {
      file = path.join(file, 'index.html');
      info = await stat(file);
    }
    const ext = path.extname(file);
    const big = ext === '.wasm' || ext === '.tar';
    res.writeHead(200, {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Content-Length': info.size,
      // The compiler is ~105 MB: let the browser keep it. Course files always revalidate.
      'Cache-Control': big || url.pathname.startsWith('/vendor/') ? 'public, max-age=604800, immutable' : 'no-cache',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  C, from the ground up  →  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}\n`);
});
