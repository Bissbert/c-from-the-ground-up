// Compiles one C source file with Clang-in-WebAssembly (@yowasp/clang).
// `runClang` is passed in so this works in the browser worker and in Node.

export const CLANG_ARGS = ['clang', '-std=c17', '-Wall', '-Wextra', '-O0', '-g0', 'main.c', '-o', 'main.wasm', '-lm'];

export async function compileC(runClang, source, extraOptions = {}) {
  let diagnostics = '';
  const dec = new TextDecoder();
  const collect = (bytes) => {
    if (bytes) diagnostics += dec.decode(bytes, { stream: true });
  };
  try {
    const files = await runClang(CLANG_ARGS, { 'main.c': source }, { stdout: collect, stderr: collect, decodeASCII: false, ...extraOptions });
    return { ok: true, wasm: files['main.wasm'], diagnostics: cleanDiagnostics(diagnostics) };
  } catch (e) {
    if (e && typeof e.code === 'number') return { ok: false, wasm: null, diagnostics: cleanDiagnostics(diagnostics) };
    throw e;
  }
}

function cleanDiagnostics(text) {
  // Linker noise for a missing main() is long; keep the part that matters.
  return text.replace(/\u001b\[[0-9;]*m/g, '').replace(/^clang: error: linker command failed.*$/m, '').trim();
}
