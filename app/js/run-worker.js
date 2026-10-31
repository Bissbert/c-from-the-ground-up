// Module worker: runs one compiled program. The page terminates this worker if the program runs too long.
import * as shim from '../vendor/wasi/index.js';
import { runWasm } from './wasi-run.js';

self.onmessage = async (event) => {
  const { id, wasm, stdin } = event.data;
  try {
    const result = await runWasm(shim, wasm, stdin || '', (fd, text) => self.postMessage({ id, type: 'chunk', fd, text }));
    self.postMessage({ id, type: 'done', ...result });
  } catch (e) {
    self.postMessage({ id, type: 'done', stdout: '', stderr: '', exitCode: -1, trap: String((e && e.message) || e) });
  }
};
