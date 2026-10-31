// Module worker: owns the Clang-in-WebAssembly instance (loaded once, ~105 MB from localhost).
import { runClang } from '../vendor/clang/bundle.js';
import { compileC } from './compile-core.js';

let loaded = false;
let lastPct = -1;
const fetchProgress = ({ totalLength, doneLength }) => {
  if (loaded || !totalLength) return;
  const pct = Math.floor((doneLength / totalLength) * 100);
  if (pct !== lastPct) {
    lastPct = pct;
    self.postMessage({ type: 'progress', pct, done: doneLength, total: totalLength });
  }
};

// runClang() drops fetchProgress on its internal `-###` pass, so fetch the resources
// through a --version call (which forwards options) before the first real compile.
let preload = null;
const ensureLoaded = () =>
  (preload ||= runClang(['--version'], {}, { fetchProgress, stdout: () => {}, stderr: () => {} }).catch(() => {}));

let queue = Promise.resolve();

self.onmessage = (event) => {
  const { id, type, source } = event.data;
  queue = queue.then(async () => {
    try {
      await ensureLoaded();
      if (type === 'warmup') {
        await compileC(runClang, 'int main(void){return 0;}');
        loaded = true;
        self.postMessage({ id, type: 'ready' });
        return;
      }
      const started = performance.now();
      const result = await compileC(runClang, source);
      loaded = true;
      const ms = Math.round(performance.now() - started);
      self.postMessage({ id, type: 'compiled', ...result, ms }, result.wasm ? [result.wasm.buffer] : []);
    } catch (e) {
      self.postMessage({ id, type: 'failed', message: String((e && e.message) || e) });
    }
  });
};
