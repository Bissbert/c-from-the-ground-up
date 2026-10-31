// Runs a compiled wasm32-wasi program with an in-memory stdin and captured stdout/stderr.
// `shim` is the @bjorn3/browser_wasi_shim module (passed in so this file works in browser and Node).

export const MAX_OUTPUT = 64 * 1024;

export async function runWasm(shim, wasmBytes, stdin = '', onChunk = null) {
  const { WASI, File, OpenFile, ConsoleStdout, PreopenDirectory } = shim;
  const enc = new TextEncoder();
  const dec = new TextDecoder('utf-8', { fatal: false });
  let stdout = '';
  let stderr = '';
  let truncated = false;
  const sink = (which) => (bytes) => {
    const text = dec.decode(bytes, { stream: true });
    if (stdout.length + stderr.length > MAX_OUTPUT) {
      truncated = true;
      throw new Error('output-limit');
    }
    if (which === 1) stdout += text;
    else stderr += text;
    if (onChunk) onChunk(which, text);
  };
  const fds = [
    new OpenFile(new File(enc.encode(stdin))),
    new ConsoleStdout(sink(1)),
    new ConsoleStdout(sink(2)),
    new PreopenDirectory('.', []),
  ];
  const wasi = new WASI(['main'], [], fds);
  const module = await WebAssembly.compile(wasmBytes);
  const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
  let exitCode = 0;
  let trap = null;
  try {
    exitCode = wasi.start(instance);
  } catch (e) {
    if (truncated || (e && e.message === 'output-limit')) {
      truncated = true;
      exitCode = -1;
    } else {
      trap = describeTrap(e);
      exitCode = -1;
    }
  }
  return { stdout, stderr, exitCode, trap, truncated };
}

function describeTrap(e) {
  const msg = String((e && e.message) || e);
  if (/unreachable/.test(msg)) return 'the program hit a fatal error (for example abort(), or a failed assert).';
  if (/out of bounds/.test(msg)) return 'memory access out of bounds — the program read or wrote memory it does not own.';
  if (/divide by zero|integer divide/.test(msg)) return 'integer division by zero.';
  if (/call stack|recursion/i.test(msg)) return 'stack overflow — probably recursion that never stops.';
  if (/overflow/.test(msg)) return 'integer overflow in a division.';
  return msg;
}
