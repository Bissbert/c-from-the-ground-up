// Interactive pieces of a lesson: runnable examples and the four exercise types.
import { h, icon, button } from './dom.js';
import { inline, renderBlocks, renderMarkdown, renderMemory, codeBlock } from './md.js';
import { highlightC } from './highlight.js';
import { createEditor } from './editor.js';
import { createConsole } from './console.js';
import * as compiler from './compiler.js';
import { progress } from './progress.js';
import { judgeTest, blankAnswers, fillBlanks, normalizeAnswer, normalizeOutput, BLANK_RE } from './lesson-format.js';

const TYPE_LABEL = { code: 'Write code', predict: 'Predict the output', quiz: 'Choose', fill: 'Fill the blanks' };

// ---------- shared ----------

async function compileWithStatus(cons, source) {
  const off = compiler.onStatus((s) => {
    if (s.state === 'loading') cons.compiling(s);
  });
  cons.compiling(compiler.status);
  try {
    return await compiler.compile(source);
  } finally {
    off();
  }
}

async function compileAndRunWithStatus(cons, source, stdin) {
  const c = await compileWithStatus(cons, source);
  if (!c.ok) return { compiled: false, diagnostics: c.diagnostics };
  cons.running();
  const r = await compiler.run(c.wasm, stdin);
  return { compiled: true, diagnostics: c.diagnostics, wasm: c.wasm, ...r };
}

function lineMarks(diags) {
  const marks = [];
  for (const d of diags) if (d.line && d.kind !== 'note') marks.push([d.line, d.kind === 'error' ? 'error' : marks.some(([l]) => l === d.line) ? 'error' : 'warning']);
  return marks;
}

function busy(btn, on) {
  btn.disabled = on;
  btn.classList.toggle('is-busy', on);
}

function stdinField(value, label = 'Input (stdin)') {
  const ta = h('textarea', { class: 'stdin-input', rows: Math.max(1, Math.min(5, value.split('\n').length - 1 || 1)), spellcheck: 'false', 'aria-label': label });
  ta.value = value.replace(/\n$/, '');
  const wrap = h('label', { class: 'stdin-field' }, h('span', { class: 'field-label' }, label), ta);
  return { el: wrap, get: () => (ta.value ? ta.value + '\n' : '') };
}

function crashFriendlyCompileError() {
  return h('div', { class: 'console-status is-error' }, 'The compiler could not be loaded. Reload the page; if it keeps failing, check that the server is still running.');
}

// ---------- runnable example ----------

export function runnable(block) {
  const original = block.code;
  const cons = createConsole();
  let editor;
  const runBtn = button('Run', { icon: 'play', kind: 'primary', onclick: () => doRun() });
  const resetBtn = button('Reset', { icon: 'reset', kind: 'quiet', title: 'Undo your changes to this example', onclick: () => editor.setValue(original) });
  resetBtn.hidden = true;
  editor = createEditor({
    value: original,
    label: 'Example code (you can edit it)',
    minLines: 1,
    onRun: () => doRun(),
    onChange: (v) => {
      resetBtn.hidden = v === original;
    },
  });
  const stdin = block.stdin !== undefined ? stdinField(block.stdin) : null;

  async function doRun() {
    busy(runBtn, true);
    try {
      const r = await compileAndRunWithStatus(cons, editor.getValue(), stdin ? stdin.get() : '');
      const diags = cons.result(r);
      editor.mark(lineMarks(diags));
    } catch {
      cons.append(crashFriendlyCompileError());
    } finally {
      busy(runBtn, false);
    }
  }

  const playLink = h('a', { class: 'btn btn-quiet', href: '#/playground', onclick: () => sessionStorage.setItem('playground-seed', editor.getValue()) }, icon('code'), h('span', {}, 'Open in playground'));
  return h('div', { class: 'example' }, editor.el, stdin ? stdin.el : null, h('div', { class: 'toolbar' }, runBtn, resetBtn, h('span', { class: 'toolbar-spacer' }), playLink), cons.el);
}

// ---------- exercise frame ----------

export function exercise(ex, lesson) {
  const seq = `${lesson.number}.${ex.number}`;
  const mark = h('span', { class: 'ex-mark', role: 'img' });
  const head = h(
    'header',
    { class: 'ex-head' },
    h('span', { class: 'ex-seq' }, seq),
    h('span', { class: 'ex-type' }, TYPE_LABEL[ex.type] || ex.type),
    h('h3', { class: 'ex-title', html: inline(ex.title || 'Exercise') }),
    mark,
  );
  const root = h('section', { class: `exercise ex-${ex.type}`, id: `ex-${ex.number}`, 'aria-label': `Exercise ${seq}: ${ex.title}` }, head);
  const prompt = h('div', { class: 'ex-prompt' }, renderBlocks(ex.prompt, { runnable }));
  const explain = ex.explain ? h('div', { class: 'ex-explain', hidden: true }, h('div', { class: 'field-label' }, 'Why'), renderMarkdown(ex.explain)) : null;

  const api = {
    root,
    solved() {
      progress.markDone(ex.id);
      setMark();
      if (explain) explain.hidden = false;
    },
    showExplain() {
      if (explain) explain.hidden = false;
    },
  };
  function setMark() {
    const done = progress.isDone(ex.id);
    root.classList.toggle('is-solved', done);
    mark.setAttribute('aria-label', done ? 'Solved' : 'Not solved yet');
    mark.replaceChildren(done ? icon('check') : '');
  }
  setMark();

  const builders = { code: codeExercise, predict: predictExercise, quiz: quizExercise, fill: fillExercise };
  const work = (builders[ex.type] || (() => h('p', {}, `Unknown exercise type “${ex.type}”.`)))(ex, api);
  root.append(prompt, work);
  if (explain) {
    root.append(explain);
    if (progress.isDone(ex.id)) explain.hidden = false;
  }
  return root;
}

function feedback() {
  const el = h('div', { class: 'ex-feedback', 'aria-live': 'polite', hidden: true });
  return {
    el,
    set(kind, md) {
      el.hidden = !md;
      el.className = `ex-feedback is-${kind}`;
      el.innerHTML = md ? inline(md) : '';
    },
  };
}

// ---------- code ----------

function codeExercise(ex, api) {
  const starter = ex.starter ?? '#include <stdio.h>\n\nint main(void) {\n    \n    return 0;\n}';
  const saved = progress.draft(ex.id);
  const cons = createConsole();
  const fb = feedback();
  const results = h('ol', { class: 'tests', hidden: true });
  const editor = createEditor({
    value: saved ?? starter,
    label: `Your solution for ${ex.title}`,
    minLines: 8,
    onRun: () => doRun(),
    onChange: (v) => progress.saveDraft(ex.id, v),
  });
  const firstStdin = (ex.tests.find((t) => t.stdin) || {}).stdin;
  const stdin = firstStdin !== undefined ? stdinField(firstStdin, 'Input for Run (stdin)') : null;

  const hintsBox = h('div', { class: 'hints' });
  let hintsShown = 0;
  const hintBtn = button(hintLabel(), { icon: 'hint', kind: 'quiet', onclick: showHint });
  hintBtn.hidden = ex.hints.length === 0;
  function hintLabel() {
    const left = ex.hints.length - hintsShown;
    return hintsShown === 0 ? 'Hint' : left > 0 ? `Another hint (${left} left)` : 'No more hints';
  }
  function showHint() {
    if (hintsShown >= ex.hints.length) return;
    hintsBox.append(h('div', { class: 'hint' }, h('div', { class: 'field-label' }, `Hint ${hintsShown + 1}`), renderMarkdown(ex.hints[hintsShown])));
    hintsShown += 1;
    hintBtn.querySelector('span:last-child').textContent = hintLabel();
    hintBtn.disabled = hintsShown >= ex.hints.length;
  }

  const solutionBox = h('div', { class: 'solution', hidden: true });
  let attempts = 0;
  const solutionBtn = button('Show a solution', { icon: 'eye', kind: 'quiet', onclick: showSolution });
  solutionBtn.hidden = !ex.solution;
  solutionBtn.disabled = true;
  solutionBtn.title = 'Available after your first check';
  function showSolution() {
    solutionBox.hidden = false;
    solutionBox.replaceChildren(
      h('div', { class: 'field-label' }, 'One possible solution'),
      codeBlock(ex.solution, 'c'),
      h('div', { class: 'toolbar' }, button('Copy into my editor', { icon: 'copy', kind: 'quiet', onclick: () => editor.setValue(ex.solution) })),
    );
    solutionBtn.hidden = true;
  }

  const runBtn = button('Run', { icon: 'play', kind: 'secondary', onclick: () => doRun(), title: 'Compile and run (Ctrl/⌘ + Enter)' });
  const checkBtn = button('Check', { icon: 'check', kind: 'primary', onclick: () => doCheck() });
  const resetBtn = button('Start over', {
    icon: 'reset',
    kind: 'quiet',
    onclick: () => {
      editor.setValue(starter);
      progress.clearDraft(ex.id);
    },
  });

  async function doRun() {
    busy(runBtn, true);
    results.hidden = true;
    try {
      const r = await compileAndRunWithStatus(cons, editor.getValue(), stdin ? stdin.get() : '');
      editor.mark(lineMarks(cons.result(r)));
    } catch {
      cons.append(crashFriendlyCompileError());
    } finally {
      busy(runBtn, false);
    }
  }

  async function doCheck() {
    busy(checkBtn, true);
    fb.set('info', '');
    results.hidden = true;
    const source = editor.getValue();
    try {
      const c = await compileWithStatus(cons, source);
      attempts += 1;
      solutionBtn.disabled = false;
      solutionBtn.title = '';
      if (!c.ok) {
        editor.mark(lineMarks(cons.result({ compiled: false, diagnostics: c.diagnostics })));
        fb.set('error', 'It does not compile yet. Fix the error above first — the explanation tells you where to look.');
        return;
      }
      const diags = compiler.parseDiagnostics(c.diagnostics);
      editor.mark(lineMarks(diags));
      if (diags.length) cons.result({ compiled: false, diagnostics: c.diagnostics }).length;
      else cons.hide();
      if (diags.length) cons.el.querySelector('.console-label').textContent = `Compiled with ${diags.filter((d) => d.kind === 'warning').length} warning(s) — worth fixing`;
      const tests = ex.tests.length ? ex.tests : [{ name: 'runs without crashing', stdin: '', expect: null, mode: 'exact', sourceHas: [], sourceLacks: [] }];
      results.replaceChildren();
      results.hidden = false;
      let passed = 0;
      for (const [i, t] of tests.entries()) {
        const row = h('li', { class: 'test is-running' }, h('span', { class: 'test-mark' }), h('span', { class: 'test-name' }, t.name || `Test ${i + 1}`));
        results.append(row);
        const run = await compiler.run(c.wasm, t.stdin);
        const verdict = judgeTest(t, source, run);
        row.className = `test ${verdict.pass ? 'is-pass' : 'is-fail'}`;
        row.querySelector('.test-mark').replaceChildren(icon(verdict.pass ? 'check' : 'cross'));
        if (verdict.pass) passed += 1;
        else row.append(testDetail(t, run, verdict));
      }
      if (passed === tests.length) {
        fb.set('pass', attempts === 1 ? '**Solved on the first try.** Well done.' : '**Solved.** All tests pass.');
        api.solved();
      } else {
        fb.set('error', `${passed} of ${tests.length} tests pass. Open the failing test to compare your output with the expected one.`);
      }
    } catch {
      cons.append(crashFriendlyCompileError());
    } finally {
      busy(checkBtn, false);
    }
  }

  return h(
    'div',
    { class: 'ex-work' },
    editor.el,
    stdin ? stdin.el : null,
    h('div', { class: 'toolbar' }, checkBtn, runBtn, hintBtn, h('span', { class: 'toolbar-spacer' }), solutionBtn, resetBtn),
    cons.el,
    results,
    fb.el,
    hintsBox,
    solutionBox,
  );
}

function testDetail(t, run, verdict) {
  const d = h('div', { class: 'test-detail' }, h('p', { html: inline(verdict.reason) }));
  if (t.expect !== null && !run.trap && !run.timedOut && !verdict.reason.startsWith('Your code') && !verdict.reason.startsWith('Solve')) {
    const cols = h(
      'div',
      { class: 'compare' },
      t.stdin ? h('div', {}, h('div', { class: 'field-label' }, 'Input'), h('pre', {}, t.stdin.replace(/\n$/, ''))) : null,
      h('div', {}, h('div', { class: 'field-label' }, t.mode === 'contains' ? 'Should contain' : 'Expected'), h('pre', {}, normalizeOutput(t.expect) || ' ')),
      h('div', {}, h('div', { class: 'field-label' }, 'Your program printed'), h('pre', {}, normalizeOutput(run.stdout) || '(nothing)')),
    );
    d.append(cols);
  }
  return d;
}

// ---------- predict ----------

function predictExercise(ex, api) {
  const fb = feedback();
  const answer = h('textarea', { class: 'predict-input', rows: 3, spellcheck: 'false', 'aria-label': 'What will the program print?', placeholder: 'Type exactly what the program prints, line by line' });
  const actual = h('div', { class: 'predict-actual', hidden: true });
  let cached = null;
  async function realRun(cons) {
    if (!cached) cached = await compileAndRunWithStatus(cons, ex.code, ex.stdin || '');
    return cached;
  }
  const cons = createConsole();
  const checkBtn = button('Check my prediction', { icon: 'check', kind: 'primary', onclick: check });
  const revealBtn = button('Show the real output', { icon: 'eye', kind: 'quiet', onclick: reveal });
  revealBtn.hidden = true;

  async function check() {
    if (!answer.value.trim()) {
      fb.set('info', 'Write your prediction first — guessing is part of learning.');
      return;
    }
    busy(checkBtn, true);
    try {
      const r = await realRun(cons);
      cons.hide();
      if (!r.compiled) return cons.result(r);
      const ok = normalizeOutput(answer.value) === normalizeOutput(r.stdout);
      if (ok) {
        fb.set('pass', '**Exactly right.** That is what the program printed.');
        showActual(r);
        api.solved();
      } else {
        const lines = normalizeOutput(r.stdout).split('\n');
        const mine = normalizeOutput(answer.value).split('\n');
        const firstWrong = lines.findIndex((l, i) => l !== mine[i]);
        fb.set('error', `Not quite${firstWrong >= 0 ? ` — line ${firstWrong + 1} differs` : mine.length > lines.length ? ' — you have extra lines' : ''}. Trace the code once more, one statement at a time.`);
        revealBtn.hidden = false;
      }
    } catch {
      cons.append(crashFriendlyCompileError());
    } finally {
      busy(checkBtn, false);
    }
  }
  function showActual(r) {
    actual.hidden = false;
    actual.replaceChildren(h('div', { class: 'field-label' }, 'The program printed'), h('pre', { class: 'console-out' }, r.stdout || '(nothing)'));
    revealBtn.hidden = true;
  }
  async function reveal() {
    const r = await realRun(cons);
    if (r.compiled) {
      cons.hide();
      showActual(r);
      api.showExplain();
    }
  }

  return h(
    'div',
    { class: 'ex-work' },
    codeBlock(ex.code, 'c'),
    ex.stdin ? h('div', { class: 'given-input' }, h('div', { class: 'field-label' }, 'Input given to the program'), h('pre', {}, ex.stdin.replace(/\n$/, ''))) : null,
    h('label', { class: 'predict-field' }, h('span', { class: 'field-label' }, 'Your prediction'), answer),
    h('div', { class: 'toolbar' }, checkBtn, revealBtn),
    cons.el,
    fb.el,
    actual,
  );
}

// ---------- quiz ----------

function quizExercise(ex, api) {
  const multi = ex.options.filter((o) => o.correct).length > 1;
  const name = `q-${ex.id}`;
  const fb = feedback();
  let wrongTries = 0;
  const items = ex.options.map((o, i) => {
    const input = h('input', { type: multi ? 'checkbox' : 'radio', name, value: String(i) });
    const li = h('li', { class: 'option' }, h('label', {}, input, h('span', { class: 'option-box', 'aria-hidden': 'true' }), h('span', { class: 'option-text', html: inline(o.text) })));
    return { o, input, li };
  });
  const checkBtn = button('Check', { icon: 'check', kind: 'primary', onclick: check });
  function check() {
    const chosen = items.filter((it) => it.input.checked);
    if (!chosen.length) return fb.set('info', multi ? 'Choose every answer you think is right.' : 'Choose an answer first.');
    for (const it of items) it.li.classList.remove('is-right', 'is-wrong', 'is-missed');
    let allRight = true;
    for (const it of items) {
      if (it.input.checked && it.o.correct) it.li.classList.add('is-right');
      else if (it.input.checked && !it.o.correct) {
        it.li.classList.add('is-wrong');
        allRight = false;
      } else if (!it.input.checked && it.o.correct) allRight = false;
    }
    if (allRight) {
      fb.set('pass', '**Correct.**');
      api.solved();
    } else {
      wrongTries += 1;
      const wrong = chosen.filter((it) => !it.o.correct).length;
      fb.set('error', wrong ? `Not yet: ${wrong === 1 ? 'one of your choices is' : `${wrong} of your choices are`} wrong.` : 'Not yet: there is still a right answer you have not chosen.');
      if (wrongTries >= 2) {
        for (const it of items) if (it.o.correct && !it.input.checked) it.li.classList.add('is-missed');
        api.showExplain();
      }
    }
  }
  return h(
    'div',
    { class: 'ex-work' },
    multi ? h('p', { class: 'quiz-note' }, 'Choose all that apply.') : null,
    h('ul', { class: 'options' }, items.map((it) => it.li)),
    h('div', { class: 'toolbar' }, checkBtn),
    fb.el,
  );
}

// ---------- fill ----------

function blankInput(alternatives, index) {
  const width = Math.max(2, ...alternatives.map((a) => a.length)) + 1;
  return h('input', {
    class: 'blank',
    type: 'text',
    spellcheck: 'false',
    autocomplete: 'off',
    autocapitalize: 'off',
    'aria-label': `Blank ${index + 1}`,
    style: `width:${width}ch`,
  });
}

function fillExercise(ex, api) {
  const fb = feedback();
  const cons = createConsole();
  const inputs = [];
  let view;
  let source = null;

  if (ex.code) {
    source = ex.code;
    const answers = blankAnswers(ex.code);
    const pieces = ex.code.split(BLANK_RE); // even = text, odd = blank inner
    const codeEl = h('code');
    let html = '';
    for (let k = 0; k < pieces.length; k++) html += k % 2 === 0 ? highlightC(pieces[k]) : `<span class="blank-slot" data-k="${(k - 1) / 2}"></span>`;
    codeEl.innerHTML = html;
    codeEl.querySelectorAll('.blank-slot').forEach((slot) => {
      const k = +slot.dataset.k;
      const input = blankInput(answers[k], k);
      inputs.push({ input, alts: answers[k] });
      slot.replaceWith(input);
    });
    const lines = fillBlanks(ex.code).split('\n').length;
    view = h('div', { class: 'code-sheet fill-sheet' }, h('pre', { class: 'code-gutter', 'aria-hidden': 'true' }, Array.from({ length: lines }, (_, i) => i + 1).join('\n')), h('pre', { class: 'code-body' }, codeEl));
  } else if (ex.memory) {
    let k = 0;
    view = renderMemory(ex.memory, (td, text) => {
      const parts = String(text).split(BLANK_RE);
      for (let p = 0; p < parts.length; p++) {
        if (p % 2 === 0) {
          if (parts[p]) td.insertAdjacentHTML('beforeend', inline(parts[p]));
        } else {
          const alts = parts[p].split('|').map((s) => s.trim());
          const input = blankInput(alts, k++);
          inputs.push({ input, alts });
          td.append(input);
        }
      }
    });
  } else view = h('p', {}, 'This exercise has no blanks.');

  for (const { input } of inputs) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        check();
      }
    });
    input.addEventListener('input', () => input.classList.remove('is-right', 'is-wrong'));
  }

  const checkBtn = button('Check', { icon: 'check', kind: 'primary', onclick: check });
  const revealBtn = button('Show the answers', { icon: 'eye', kind: 'quiet', onclick: reveal });
  revealBtn.hidden = true;

  async function check() {
    const values = inputs.map(({ input }) => input.value);
    if (values.some((v) => !v.trim())) {
      fb.set('info', 'Fill in every blank first.');
      const empty = inputs.find(({ input }) => !input.value.trim());
      if (empty) empty.input.focus();
      return;
    }
    let right = 0;
    for (const { input, alts } of inputs) {
      const ok = alts.some((a) => normalizeAnswer(a) === normalizeAnswer(input.value));
      input.classList.toggle('is-right', ok);
      input.classList.toggle('is-wrong', !ok);
      if (ok) right += 1;
    }
    let solved = right === inputs.length;
    // For code with tests, a different-but-working answer also counts.
    if (source && (ex.tests.length || solved)) {
      busy(checkBtn, true);
      try {
        const filled = fillBlanks(source, values);
        if (ex.tests.length && !solved) {
          const c = await compileWithStatus(cons, filled);
          cons.hide();
          if (c.ok) {
            const runs = await Promise.all(ex.tests.map((t) => compiler.run(c.wasm, t.stdin || ex.stdin)));
            if (ex.tests.every((t, i) => judgeTest(t, filled, runs[i]).pass)) {
              solved = true;
              for (const { input } of inputs) input.classList.replace('is-wrong', 'is-right');
            }
          }
        }
        if (solved) {
          const r = await compileAndRunWithStatus(cons, filled, (ex.tests[0] && ex.tests[0].stdin) || ex.stdin);
          cons.result(r, { label: 'Your completed program printed' });
        }
      } catch {
        cons.append(crashFriendlyCompileError());
      } finally {
        busy(checkBtn, false);
      }
    }
    if (solved) {
      fb.set('pass', '**All blanks are right.**');
      api.solved();
    } else {
      fb.set('error', `${right} of ${inputs.length} blank${inputs.length === 1 ? ' is' : 's are'} right. The wrong ones are marked.`);
      revealBtn.hidden = false;
    }
  }
  function reveal() {
    for (const { input, alts } of inputs) {
      if (!alts.some((a) => normalizeAnswer(a) === normalizeAnswer(input.value))) {
        input.value = alts[0];
        input.classList.remove('is-wrong');
        input.classList.add('is-revealed');
      }
    }
    revealBtn.hidden = true;
    fb.set('info', 'The missing answers are filled in. Read the explanation, then try to say why each one is right.');
    api.showExplain();
  }

  return h('div', { class: 'ex-work' }, view, h('div', { class: 'toolbar' }, checkBtn, revealBtn), cons.el, fb.el);
}
