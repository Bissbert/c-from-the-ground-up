// The output panel under every runnable piece of code: compiler verdict, program output, run status.
import { h, icon } from './dom.js';
import { inline } from './md.js';
import { parseDiagnostics } from './compiler.js';

export function createConsole() {
  const el = h('div', { class: 'console', hidden: true, 'aria-live': 'polite' });

  function show(...children) {
    el.hidden = false;
    el.replaceChildren(...children.filter(Boolean));
  }

  return {
    el,
    hide() {
      el.hidden = true;
      el.replaceChildren();
    },
    compiling(state) {
      const text = state && state.state === 'loading' ? `Loading the compiler… ${state.pct || 0}%` : 'Compiling…';
      show(h('div', { class: 'console-status is-busy' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), text));
    },
    running() {
      show(h('div', { class: 'console-status is-busy' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), 'Running…'));
    },
    // result of compileAndRun; returns the parsed diagnostics so the editor can mark lines
    result(r, { label = 'Output' } = {}) {
      const diags = parseDiagnostics(r.diagnostics);
      const parts = [];
      if (diags.length || (!r.compiled && r.diagnostics)) parts.push(diagnosticsView(diags, r.diagnostics, r.compiled));
      if (r.compiled) parts.push(runView(r, label));
      show(...parts);
      return diags;
    },
    message(text, kind = 'info') {
      show(h('div', { class: `console-status is-${kind}` }, text));
    },
    append(node) {
      el.hidden = false;
      el.append(node);
    },
  };
}

function diagnosticsView(diags, raw, compiled) {
  const errors = diags.filter((d) => d.kind === 'error');
  const warnings = diags.filter((d) => d.kind === 'warning');
  const title = !compiled
    ? `The compiler stopped: ${errors.length || 1} error${errors.length === 1 ? '' : 's'}`
    : `Compiled with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`;
  const list = h('ol', { class: 'diag-list' });
  for (const d of diags.filter((x) => x.kind !== 'note')) {
    list.append(
      h(
        'li',
        { class: `diag diag-${d.kind}` },
        h('div', { class: 'diag-head' }, h('span', { class: 'diag-kind' }, d.kind === 'error' ? 'Error' : 'Warning'), d.line ? h('span', { class: 'diag-line' }, `line ${d.line}`) : null, h('code', { class: 'diag-msg' }, d.message)),
        d.explain ? h('p', { class: 'diag-explain', html: inline(d.explain) }) : null,
      ),
    );
  }
  return h(
    'section',
    { class: `console-diag ${compiled ? 'is-warn' : 'is-error'}` },
    h('div', { class: 'console-label' }, title),
    diags.length ? list : null,
    h('details', { class: 'diag-raw' }, h('summary', {}, 'Full compiler message'), h('pre', {}, raw || '(no output)')),
  );
}

function runView(r, label) {
  let status;
  if (r.timedOut) status = h('div', { class: 'console-status is-error' }, 'Stopped after 4 seconds. Is there a loop that never ends?');
  else if (r.trap) status = h('div', { class: 'console-status is-error' }, `The program crashed: ${r.trap}`);
  else if (r.truncated) status = h('div', { class: 'console-status is-error' }, 'Stopped: the program printed too much (over 64 KB).');
  else status = h('div', { class: 'console-status' }, icon('check'), `Finished · main returned ${r.exitCode} · ${r.ms} ms`);
  const out = r.stdout || '';
  return h(
    'section',
    { class: 'console-run' },
    h('div', { class: 'console-label' }, label),
    h('pre', { class: `console-out ${out ? '' : 'is-empty'}` }, out || '(the program printed nothing)'),
    r.stderr ? h('pre', { class: 'console-out console-err' }, r.stderr) : null,
    status,
  );
}
