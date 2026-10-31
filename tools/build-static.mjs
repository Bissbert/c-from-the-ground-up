#!/usr/bin/env node
// Builds a fully static copy of the course in dist/ (for GitHub Pages or any static host):
//   app/                                  → dist/
//   node_modules/@yowasp/clang/gen/       → dist/vendor/clang/
//   node_modules/@bjorn3/browser_wasi_shim/dist/ → dist/vendor/wasi/
// This mirrors the mounts in server.mjs.

import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');

await rm(out, { recursive: true, force: true });
await cp(path.join(root, 'app'), out, { recursive: true });
await mkdir(path.join(out, 'vendor'), { recursive: true });
await cp(path.join(root, 'node_modules/@yowasp/clang/gen'), path.join(out, 'vendor/clang'), { recursive: true });
await cp(path.join(root, 'node_modules/@bjorn3/browser_wasi_shim/dist'), path.join(out, 'vendor/wasi'), { recursive: true });
// Serve files as-is; no Jekyll processing.
await writeFile(path.join(out, '.nojekyll'), '');

console.log(`Static site written to ${path.relative(root, out)}/`);
