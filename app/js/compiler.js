// Main-thread API around the compile worker and the (disposable) run worker.

const RUN_TIMEOUT_MS = 4000;

let compileWorker = null;
let nextId = 1;
const pending = new Map();
const listeners = new Set();

export const status = { state: 'idle', pct: 0, total: 0 }; // idle | loading | ready | error

function setStatus(patch) {
  Object.assign(status, patch);
  for (const fn of listeners) fn(status);
}

export function onStatus(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

function ensureWorker() {
  if (compileWorker) return compileWorker;
  compileWorker = new Worker(new URL('./compile-worker.js', import.meta.url), { type: 'module' });
  compileWorker.onmessage = (event) => {
    const msg = event.data;
    if (msg.type === 'progress') {
      setStatus({ state: 'loading', pct: msg.pct, total: msg.total });
      return;
    }
    if (msg.type === 'ready' || msg.type === 'compiled') setStatus({ state: 'ready', pct: 100 });
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.type === 'failed') {
      setStatus({ state: 'error', message: msg.message });
      p.reject(new Error(msg.message));
    } else p.resolve(msg);
  };
  compileWorker.onerror = (e) => {
    setStatus({ state: 'error', message: e.message || 'The compiler could not be started.' });
    for (const p of pending.values()) p.reject(new Error('compiler worker failed'));
    pending.clear();
  };
  return compileWorker;
}

function request(type, payload = {}) {
  const worker = ensureWorker();
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, type, ...payload });
  });
}

export function warmup() {
  if (status.state === 'idle') setStatus({ state: 'loading', pct: 0 });
  return request('warmup').catch(() => {});
}

export async function compile(source) {
  if (status.state === 'idle') setStatus({ state: 'loading', pct: 0 });
  const r = await request('compile', { source });
  return { ok: r.ok, wasm: r.wasm, diagnostics: r.diagnostics, ms: r.ms };
}

// Run a compiled program in a fresh worker so an endless loop can be killed.
export function run(wasm, stdin = '', onChunk = null) {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./run-worker.js', import.meta.url), { type: 'module' });
    const started = performance.now();
    let stdout = '';
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ stdout, stderr: '', exitCode: -1, timedOut: true, trap: null, ms: RUN_TIMEOUT_MS });
    }, RUN_TIMEOUT_MS);
    worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === 'chunk') {
        if (msg.fd === 1) stdout += msg.text;
        if (onChunk) onChunk(msg.fd, msg.text);
        return;
      }
      clearTimeout(timer);
      worker.terminate();
      resolve({ ...msg, timedOut: false, ms: Math.round(performance.now() - started) });
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ stdout, stderr: '', exitCode: -1, timedOut: false, trap: e.message || 'the program could not start', ms: 0 });
    };
    // copy: the same wasm may be run again for the next test
    worker.postMessage({ id: 1, wasm: wasm.slice(), stdin });
  });
}

export async function compileAndRun(source, stdin = '', onChunk = null) {
  const c = await compile(source);
  if (!c.ok) return { compiled: false, diagnostics: c.diagnostics };
  const r = await run(c.wasm, stdin, onChunk);
  return { compiled: true, diagnostics: c.diagnostics, wasm: c.wasm, ...r };
}

// ---- diagnostics: parse and explain for beginners ----

export function parseDiagnostics(text) {
  const out = [];
  const lines = (text || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^main\.c:(\d+):(\d+): (error|warning|note): (.*)$/);
    if (m) {
      const snippet = [];
      while (i + 1 < lines.length && !/^main\.c:\d+:\d+:/.test(lines[i + 1]) && !/^\d+ (error|warning)s? generated/.test(lines[i + 1])) {
        snippet.push(lines[i + 1]);
        i += 1;
      }
      out.push({ line: +m[1], col: +m[2], kind: m[3], message: m[4], snippet: snippet.join('\n'), explain: explain(m[4]) });
    } else if (/undefined symbol: main|undefined reference to `main'/.test(lines[i])) {
      out.push({ line: 0, col: 0, kind: 'error', message: 'there is no main function', snippet: '', explain: 'Every program needs `int main(void) { ... }` — that is where it starts.' });
    } else if (/undefined symbol: (\w+)/.test(lines[i])) {
      const name = lines[i].match(/undefined symbol: (\w+)/)[1];
      out.push({ line: 0, col: 0, kind: 'error', message: `undefined symbol: ${name}`, snippet: '', explain: `The linker cannot find a function called \`${name}\`. Is it spelled correctly, and did you write its body?` });
    }
  }
  return out;
}

const EXPLAIN = [
  [/expected ';'/, 'A semicolon `;` is missing — usually at the end of this line or the line before.'],
  [/use of undeclared identifier '(\w+)'/, (m) => `C doesn't know the name \`${m[1]}\`. Declare it first (for example \`int ${m[1]};\`) and check the spelling — upper and lower case matter.`],
  [/call to undeclared (?:library )?function '(\w+)'|implicit declaration of function '(\w+)'|implicitly declaring library function '(\w+)'/, (m) => {
    const f = m[1] || m[2] || m[3];
    const hdr = { printf: 'stdio.h', scanf: 'stdio.h', puts: 'stdio.h', malloc: 'stdlib.h', free: 'stdlib.h', calloc: 'stdlib.h', realloc: 'stdlib.h', strlen: 'string.h', strcpy: 'string.h', strcmp: 'string.h', strcat: 'string.h', toupper: 'ctype.h', tolower: 'ctype.h', isdigit: 'ctype.h', sqrt: 'math.h', pow: 'math.h' }[f];
    return hdr ? `\`${f}\` lives in \`<${hdr}>\`. Add \`#include <${hdr}>\` at the top.` : `C doesn't know a function called \`${f}\` yet. Check the spelling, or define/declare it above the place where you call it.`;
  }],
  [/expected '}'/, 'A `{` is never closed. Every `{` needs a matching `}`.'],
  [/extraneous closing brace|expected identifier or '\('/, 'There is a `}` or other symbol where C does not expect one — maybe one brace too many.'],
  [/expected expression/, 'C expected a value here (a number, a variable, a calculation) but found something else.'],
  [/unused variable '(\w+)'/, (m) => `You created \`${m[1]}\` but never used it. Remove it or use it.`],
  [/unused parameter/, 'A function parameter is never used inside the function.'],
  [/variable '(\w+)' is uninitialized when used|variable '(\w+)' may be uninitialized/, (m) => `You read \`${m[1] || m[2]}\` before giving it a value — it contains garbage. Initialise it, e.g. \`= 0\`.`],
  [/using the result of an assignment as a condition/, '`=` *stores* a value; `==` *compares*. In a condition you almost always want `==`.'],
  [/format specifies type '([^']+)' but the argument has type '([^']+)'/, (m) => `The \`%\` code in the format string expects a \`${m[1]}\`, but you passed a \`${m[2]}\`. Match them: \`%d\` int, \`%f\` double, \`%c\` char, \`%s\` string, \`%p\` pointer, \`%zu\` size_t.`],
  [/more '%' conversions than data arguments/, 'The format string has more `%` codes than values after it.'],
  [/data argument not used by format string/, 'You passed more values than there are `%` codes in the format string.'],
  [/incompatible (?:integer to pointer|pointer to integer) conversion/, 'You are mixing a pointer (an address) and a plain number. Missing `&` or `*`?'],
  [/incompatible pointer types/, 'The pointer types do not match, e.g. an `int *` where a `char *` is expected.'],
  [/non-void function does not return a value|control reaches end of non-void function|non-void function '(\w+)' should return a value/, 'This function promises to return a value, but on some path it reaches the end without `return`.'],
  [/void function '(\w+)' should not return a value/, 'This function is `void`, so it must not return a value. Use plain `return;` or remove it.'],
  [/too few arguments to function call/, 'You called a function with fewer arguments than it needs.'],
  [/too many arguments to function call/, 'You called a function with more arguments than it takes.'],
  [/expression is not assignable/, 'The left side of `=` must be something that can store a value, like a variable.'],
  [/array index (\d+) is past the end/, 'This index is outside the array. Remember: an array of N elements has indexes 0 to N-1.'],
  [/has no member named|no member named '(\w+)'/, 'This struct has no member with that name. Check the spelling in the struct definition.'],
  [/is a pointer; (?:did you mean|maybe you meant) to use '->'/, 'You have a *pointer* to a struct: use `->` instead of `.`.'],
  [/redefinition of '(\w+)'/, (m) => `\`${m[1]}\` is declared twice in the same place. Each name can be declared only once per scope.`],
  [/missing terminating '"' character|missing terminating ' character/, 'A string or character is missing its closing quote.'],
  [/comparison of array .* equal to a null pointer|comparison between pointer and integer/, 'You are comparing a pointer with a number — maybe you meant to compare the values it points to.'],
  [/returning address of local variable|address of stack memory/, 'You are returning the address of a local variable. It stops existing when the function returns!'],
  [/'(\w+)' is uninitialized/, (m) => `\`${m[1]}\` is used before it has a value.`],
];

function explain(message) {
  for (const [re, text] of EXPLAIN) {
    const m = message.match(re);
    if (m) return typeof text === 'function' ? text(m) : text;
  }
  return '';
}
