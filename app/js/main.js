// App shell: course loading, hash routing, the lesson rail, home sheet, lesson view and playground.
import { h, icon, button, pad2 } from './dom.js';
import { inline, renderBlocks } from './md.js';
import { parseLesson } from './lesson-format.js';
import { runnable, exercise } from './exercises.js';
import { createEditor } from './editor.js';
import { createConsole } from './console.js';
import * as compiler from './compiler.js';
import { progress } from './progress.js';

const view = document.getElementById('view');
const rail = document.getElementById('rail');
const aside = document.getElementById('ident');
const fields = {
  program: document.getElementById('f-program'),
  lesson: document.getElementById('f-lesson'),
  card: document.getElementById('f-card'),
  compiler: document.getElementById('f-compiler'),
};

let course = null; // { title, lessons: [{ file, part, number, meta, sections, exercises: [ids] }] }
let sectionObserver = null;

// ---------- course ----------

async function loadCourse() {
  const res = await fetch('content/course.json');
  const data = await res.json();
  const lessons = await Promise.all(
    data.lessons.map(async (entry, i) => {
      const text = await fetch(`content/lessons/${entry.file}`).then((r) => (r.ok ? r.text() : ''));
      const parsed = parseLesson(text, entry.file.replace(/\.md$/, ''));
      const exercises = [];
      for (const s of parsed.sections) for (const b of s.blocks) if (b.t === 'exercise') exercises.push(b.id);
      return { ...entry, ...parsed, number: pad2(i + 1), index: i, exercises };
    }),
  );
  return { title: data.title, lessons };
}

function lessonState(lesson) {
  const done = progress.doneCount(lesson.exercises);
  if (lesson.exercises.length && done === lesson.exercises.length) return 'done';
  if (done > 0) return 'partial';
  return 'open';
}

// ---------- rail (statement-number column) ----------

function renderRail(activeId) {
  const last = progress.last();
  const list = h('ol', { class: 'rail-list' });
  let part = null;
  for (const l of course.lessons) {
    if (l.part !== part) {
      part = l.part;
      list.append(h('li', { class: 'rail-part', 'aria-hidden': 'true' }, part));
    }
    const state = lessonState(l);
    const done = progress.doneCount(l.exercises);
    const stoppedHere = last && last.lesson === l.meta.id;
    list.append(
      h(
        'li',
        {},
        h(
          'a',
          {
            href: `#/lesson/${l.meta.id}`,
            class: `rail-row is-${state} ${l.meta.id === activeId ? 'is-active' : ''} ${stoppedHere ? 'is-flagged' : ''}`,
            'aria-current': l.meta.id === activeId ? 'page' : null,
            title: `${l.meta.title} — ${done} of ${l.exercises.length} exercises solved${stoppedHere ? ' · you were here last' : ''}`,
          },
          h('span', { class: 'rail-no' }, l.number),
          h('span', { class: 'rail-title' }, l.meta.title),
          h('span', { class: 'rail-mark', 'aria-label': state === 'done' ? 'completed' : state === 'partial' ? `${done} of ${l.exercises.length} solved` : 'not started' }, state === 'done' ? icon('check') : ''),
        ),
      ),
    );
  }
  const total = course.lessons.reduce((n, l) => n + l.exercises.length, 0);
  const solved = course.lessons.reduce((n, l) => n + progress.doneCount(l.exercises), 0);
  rail.replaceChildren(
    h('div', { class: 'rail-head' }, h('span', { class: 'field-label' }, 'Stmt'), h('span', { class: 'field-label' }, 'Lesson')),
    list,
    h(
      'div',
      { class: 'rail-foot' },
      h('a', { href: '#/playground', class: `rail-row rail-play ${activeId === 'playground' ? 'is-active' : ''}` }, h('span', { class: 'rail-no' }, icon('code')), h('span', { class: 'rail-title' }, 'Playground')),
      h('div', { class: 'rail-tally' }, h('span', { class: 'tally-num' }, `${solved}/${total}`), ' exercises solved'),
    ),
  );
}

// ---------- masthead fields ----------

function setFields({ program, lesson, card }) {
  fields.program.textContent = program;
  fields.lesson.textContent = lesson;
  fields.card.textContent = card;
}

compiler.onStatus((s) => {
  const el = fields.compiler;
  el.dataset.state = s.state;
  if (s.state === 'loading') el.textContent = `Loading ${s.pct || 0}%`;
  else if (s.state === 'ready') el.textContent = 'Ready';
  else if (s.state === 'error') el.textContent = 'Failed';
  else el.textContent = 'Idle';
  el.title = s.state === 'loading' ? 'Clang is being loaded into your browser (about 105 MB, once)' : s.state === 'error' ? s.message || '' : '';
});

// ---------- home ----------

function renderHome() {
  setFields({ program: course.title, lesson: 'Contents', card: `${course.lessons.length} lessons` });
  aside.replaceChildren();
  aside.hidden = true;
  const last = progress.last();
  const lastLesson = last && course.lessons.find((l) => l.meta.id === last.lesson);
  const firstOpen = course.lessons.find((l) => lessonState(l) !== 'done') || course.lessons[0];
  const target = lastLesson || firstOpen;
  const lastSection = lastLesson && lastLesson.sections.find((s) => s.id === last.section);

  const parts = [];
  let current = null;
  for (const l of course.lessons) {
    if (!current || current.name !== l.part) {
      current = { name: l.part, lessons: [] };
      parts.push(current);
    }
    current.lessons.push(l);
  }

  const sheet = h(
    'div',
    { class: 'home' },
    h(
      'section',
      { class: 'home-intro' },
      h('h1', { class: 'display' }, course.title),
      h('p', { class: 'lede' }, 'A course for complete beginners. Read a short piece of theory, then solve the exercise right below it. Every program you write is compiled by a real C compiler, Clang, running inside this page — nothing is installed, nothing is simulated.'),
      h(
        'div',
        { class: 'toolbar' },
        h('a', { class: 'btn btn-primary', href: `#/lesson/${target.meta.id}${lastSection ? `/${lastSection.id}` : ''}` }, icon(lastLesson ? 'flag' : 'arrowRight'), h('span', {}, lastLesson ? `Continue: ${target.number} ${target.meta.title}` : `Start with lesson 01: ${target.meta.title}`)),
        h('a', { class: 'btn btn-quiet', href: '#/playground' }, icon('code'), h('span', {}, 'Open the playground')),
      ),
      lastSection ? h('p', { class: 'resume-note' }, icon('flag'), h('span', { html: `You stopped at <strong>${inline(lastSection.heading)}</strong>.` })) : null,
    ),
    h(
      'section',
      { class: 'contents', 'aria-label': 'Course contents' },
      parts.map((p) =>
        h(
          'div',
          { class: 'part' },
          h('h2', { class: 'part-title' }, p.name),
          h(
            'ol',
            { class: 'contents-list' },
            p.lessons.map((l) => {
              const done = progress.doneCount(l.exercises);
              const state = lessonState(l);
              return h(
                'li',
                {},
                h(
                  'a',
                  { class: `contents-row is-${state}`, href: `#/lesson/${l.meta.id}` },
                  h('span', { class: 'c-no' }, l.number),
                  h('span', { class: 'c-text' }, h('span', { class: 'c-title' }, l.meta.title), h('span', { class: 'c-sub' }, l.meta.subtitle || '')),
                  h('span', { class: 'c-meta' }, `${l.meta.minutes || '—'} min`),
                  h('span', { class: 'c-tally', 'aria-label': `${done} of ${l.exercises.length} exercises solved` }, tallyMarks(l.exercises.length, done)),
                ),
              );
            }),
          ),
        ),
      ),
    ),
    h(
      'section',
      { class: 'home-notes' },
      h('h2', {}, 'How this course works'),
      h(
        'ul',
        {},
        h('li', { html: inline('**Theory, then practice.** Each idea is followed straight away by an exercise: write code, predict the output, choose, or fill in the blanks.') }),
        h('li', { html: inline('**Examples are editable.** Change any example and press **Run** (or `Ctrl`/`⌘` + `Enter`) to see what happens.') }),
        h('li', { html: inline('**The compiler is real.** Its messages appear with a plain-English explanation underneath.') }),
        h('li', { html: inline('**Your progress stays in this browser.** Nothing is sent anywhere.') }),
        h('li', { html: inline('**References** link to [cppreference.com](https://en.cppreference.com/w/c), the standard reference for the C language.') }),
      ),
      h('button', { class: 'linklike', type: 'button', onclick: resetProgress }, 'Reset all progress'),
    ),
  );
  view.replaceChildren(sheet);
  window.scrollTo(0, 0);
}

function tallyMarks(total, done) {
  const wrap = h('span', { class: 'tally' });
  for (let i = 0; i < total; i++) wrap.append(h('span', { class: `tally-box ${i < done ? 'is-done' : ''}` }));
  return wrap;
}

function resetProgress() {
  const really = document.getElementById('confirm-reset');
  really.showModal();
}

// ---------- lesson ----------

function renderLesson(id, sectionId) {
  const lesson = course.lessons.find((l) => l.meta.id === id);
  if (!lesson) return renderNotFound();
  const { meta } = lesson;
  setFields({ program: meta.title, lesson: lesson.number, card: `${lesson.number} of ${pad2(course.lessons.length)}` });
  document.title = `${lesson.number} ${meta.title} · ${course.title}`;

  const header = h(
    'header',
    { class: 'lesson-head' },
    h('h1', { class: 'display' }, meta.title),
    meta.subtitle ? h('p', { class: 'lede', html: inline(meta.subtitle) }) : null,
    h(
      'dl',
      { class: 'lesson-facts' },
      h('div', {}, h('dt', {}, 'Part'), h('dd', {}, lesson.part)),
      h('div', {}, h('dt', {}, 'Time'), h('dd', {}, `about ${meta.minutes || '?'} minutes`)),
      h('div', {}, h('dt', {}, 'Exercises'), h('dd', {}, `${lesson.exercises.length}`)),
    ),
    meta.goals && meta.goals.length ? h('div', { class: 'goals' }, h('h2', { class: 'field-label' }, 'After this lesson you can'), h('ul', {}, meta.goals.map((g) => h('li', { html: inline(g) })))) : null,
  );

  const body = h('div', { class: 'lesson-body' });
  for (const s of lesson.sections) {
    const sec = h('section', { class: 'lesson-section', id: s.id, dataset: { section: s.id } });
    if (s.heading) sec.append(h('h2', { html: inline(s.heading) }));
    sec.append(renderBlocks(s.blocks, { runnable, exercise: (ex) => exercise(ex, lesson) }));
    body.append(sec);
  }

  const prev = course.lessons[lesson.index - 1];
  const next = course.lessons[lesson.index + 1];
  const pager = h(
    'nav',
    { class: 'pager', 'aria-label': 'Lessons' },
    prev ? h('a', { class: 'pager-link', href: `#/lesson/${prev.meta.id}` }, h('span', { class: 'field-label' }, icon('arrowLeft'), ` Lesson ${prev.number}`), h('span', { class: 'pager-title' }, prev.meta.title)) : h('span'),
    next ? h('a', { class: 'pager-link is-next', href: `#/lesson/${next.meta.id}` }, h('span', { class: 'field-label' }, `Lesson ${next.number} `, icon('arrowRight')), h('span', { class: 'pager-title' }, next.meta.title)) : h('a', { class: 'pager-link is-next', href: '#/' }, h('span', { class: 'field-label' }, 'The end'), h('span', { class: 'pager-title' }, 'Back to the contents')),
  );

  view.replaceChildren(h('article', { class: 'lesson' }, header, body, pager));
  renderAside(lesson);

  if (sectionId) {
    const target = document.getElementById(sectionId);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  } else window.scrollTo(0, 0);
  observeSections(lesson);
}

function renderAside(lesson) {
  aside.hidden = false;
  const toc = h('ol', { class: 'toc' });
  for (const s of lesson.sections) {
    if (!s.heading) continue;
    const exIds = s.blocks.filter((b) => b.t === 'exercise').map((b) => b.id);
    const done = progress.doneCount(exIds);
    toc.append(
      h(
        'li',
        {},
        h(
          'a',
          { href: `#/lesson/${lesson.meta.id}/${s.id}`, dataset: { toc: s.id } },
          h('span', { class: 'toc-text', html: inline(s.heading) }),
          exIds.length ? h('span', { class: 'toc-tally', 'aria-label': `${done} of ${exIds.length} exercises solved` }, tallyMarks(exIds.length, done)) : null,
        ),
      ),
    );
  }
  const docs = (lesson.meta.docs || []).map((d) => h('li', {}, h('a', { href: d.url, target: '_blank', rel: 'noopener' }, h('span', {}, d.label), icon('external'))));
  aside.replaceChildren(
    h('div', { class: 'ident-block' }, h('h2', { class: 'field-label' }, 'In this lesson'), toc),
    docs.length ? h('div', { class: 'ident-block' }, h('h2', { class: 'field-label' }, 'C reference'), h('ul', { class: 'docs' }, docs)) : null,
  );
}

function observeSections(lesson) {
  if (sectionObserver) sectionObserver.disconnect();
  const visible = new Map();
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) visible.set(e.target.dataset.section, e.isIntersecting ? e.boundingClientRect.top : null);
      let best = null;
      for (const s of lesson.sections) {
        if (visible.get(s.id) !== null && visible.get(s.id) !== undefined) {
          best = s.id;
          break;
        }
      }
      if (!best) return;
      progress.setLast(lesson.meta.id, best);
      aside.querySelectorAll('[data-toc]').forEach((a) => a.classList.toggle('is-current', a.dataset.toc === best));
    },
    { rootMargin: '-15% 0px -60% 0px' },
  );
  view.querySelectorAll('.lesson-section').forEach((s) => sectionObserver.observe(s));
}

// ---------- playground ----------

const PLAYGROUND_KEY = 'playground';
const PLAYGROUND_DEFAULT = `#include <stdio.h>

int main(void) {
    int x = 42;
    printf("x = %d, and it lives at %p\\n", x, (void *)&x);
    return 0;
}
`;

function renderPlayground() {
  setFields({ program: 'Playground', lesson: '—', card: 'Free sheet' });
  document.title = `Playground · ${course.title}`;
  aside.hidden = true;
  let seed = null;
  try {
    seed = sessionStorage.getItem('playground-seed');
    sessionStorage.removeItem('playground-seed');
  } catch {
    /* ignore */
  }
  const cons = createConsole();
  const editor = createEditor({
    value: seed || progress.draft(PLAYGROUND_KEY) || PLAYGROUND_DEFAULT,
    label: 'Playground code',
    minLines: 16,
    onRun: run,
    onChange: (v) => progress.saveDraft(PLAYGROUND_KEY, v),
  });
  if (seed) progress.saveDraft(PLAYGROUND_KEY, seed);
  const stdin = h('textarea', { class: 'stdin-input', rows: 3, spellcheck: 'false', placeholder: 'Anything typed here is what scanf will read', 'aria-label': 'Input (stdin)' });
  const runBtn = button('Run', { icon: 'play', kind: 'primary', onclick: run, title: 'Compile and run (Ctrl/⌘ + Enter)' });

  async function run() {
    runBtn.disabled = true;
    cons.compiling(compiler.status);
    const off = compiler.onStatus((s) => s.state === 'loading' && cons.compiling(s));
    try {
      const c = await compiler.compile(editor.getValue());
      off();
      let r = { compiled: false, diagnostics: c.diagnostics };
      if (c.ok) {
        cons.running();
        r = { compiled: true, diagnostics: c.diagnostics, ...(await compiler.run(c.wasm, stdin.value ? stdin.value + '\n' : '')) };
      }
      const diags = cons.result(r);
      editor.mark(diags.filter((d) => d.line).map((d) => [d.line, d.kind === 'error' ? 'error' : 'warning']));
    } catch {
      off();
      cons.message('The compiler could not be loaded. Reload the page.', 'error');
    } finally {
      runBtn.disabled = false;
    }
  }

  view.replaceChildren(
    h(
      'div',
      { class: 'playground' },
      h('header', { class: 'lesson-head' }, h('h1', { class: 'display' }, 'Playground'), h('p', { class: 'lede' }, 'A blank coding sheet. Try anything; your code is kept in this browser.')),
      editor.el,
      h('label', { class: 'stdin-field' }, h('span', { class: 'field-label' }, 'Input (stdin)'), stdin),
      h(
        'div',
        { class: 'toolbar' },
        runBtn,
        button('New sheet', {
          icon: 'reset',
          kind: 'quiet',
          onclick: () => {
            editor.setValue(PLAYGROUND_DEFAULT);
            cons.hide();
          },
        }),
      ),
      cons.el,
    ),
  );
  window.scrollTo(0, 0);
  editor.focus();
}

function renderNotFound() {
  setFields({ program: course.title, lesson: '—', card: '—' });
  aside.hidden = true;
  view.replaceChildren(h('div', { class: 'home-intro' }, h('h1', { class: 'display' }, 'No such lesson'), h('p', {}, 'This address does not match any lesson.'), h('a', { class: 'btn btn-primary', href: '#/' }, icon('arrowLeft'), h('span', {}, 'Back to the contents'))));
}

// ---------- routing ----------

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  setRailOpen(false);
  if (parts[0] === 'lesson' && parts[1]) {
    renderLesson(parts[1], parts[2]);
    renderRail(parts[1]);
  } else if (parts[0] === 'playground') {
    renderPlayground();
    renderRail('playground');
  } else {
    if (sectionObserver) sectionObserver.disconnect();
    document.title = course.title;
    renderHome();
    renderRail(null);
  }
  view.focus({ preventScroll: true });
}

function setRailOpen(open) {
  document.body.classList.toggle('rail-open', open);
  const t = document.getElementById('rail-toggle');
  t.setAttribute('aria-expanded', String(open));
  t.setAttribute('aria-label', open ? 'Hide lessons' : 'Show lessons');
}

// ---------- theme ----------

function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const btn = document.getElementById('theme-toggle');
  btn.replaceChildren(icon(dark ? 'sun' : 'moon'));
  btn.setAttribute('aria-label', dark ? 'Switch to light paper' : 'Switch to dark carbon');
  btn.title = btn.getAttribute('aria-label');
}

// ---------- ruler ----------

function buildRuler() {
  const ruler = document.getElementById('ruler');
  for (let c = 1; c <= 80; c++) {
    const cell = h('span', { class: `col ${c % 10 === 0 ? 'is-ten' : c % 5 === 0 ? 'is-five' : ''}` });
    if (c === 1 || c % 10 === 0 || c === 6 || c === 72 || c === 73) cell.textContent = String(c);
    ruler.append(cell);
  }
}

// ---------- boot ----------

async function boot() {
  buildRuler();
  applyTheme(progress.theme());
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const t = dark ? 'light' : 'dark';
    progress.setTheme(t);
    applyTheme(t);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(progress.theme()));
  const railToggle = document.getElementById('rail-toggle');
  railToggle.addEventListener('click', () => setRailOpen(!document.body.classList.contains('rail-open')));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && document.body.classList.contains('rail-open') && (setRailOpen(false), railToggle.focus()));
  rail.addEventListener('click', (e) => e.target.closest('a') && setRailOpen(false));
  document.querySelector('.layout').addEventListener('click', (e) => document.body.classList.contains('rail-open') && !rail.contains(e.target) && setRailOpen(false));
  const dialog = document.getElementById('confirm-reset');
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'reset') {
      progress.reset();
      route();
    }
  });

  try {
    course = await loadCourse();
  } catch {
    view.replaceChildren(h('div', { class: 'home-intro' }, h('h1', { class: 'display' }, 'The course could not be loaded'), h('p', {}, 'Start the server with npm start and open the address it prints.')));
    return;
  }
  progress.onChange(() => {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    renderRail(parts[0] === 'lesson' ? parts[1] : parts[0] === 'playground' ? 'playground' : null);
    if (parts[0] === 'lesson') {
      const lesson = course.lessons.find((l) => l.meta.id === parts[1]);
      if (lesson) refreshAsideTallies(lesson);
    }
  });
  window.addEventListener('hashchange', route);
  route();
  // Load the compiler in the background so the first Run is quick.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  idle(() => compiler.warmup());
}

function refreshAsideTallies(lesson) {
  const current = aside.querySelector('.is-current');
  const currentId = current && current.dataset.toc;
  renderAside(lesson);
  if (currentId) {
    const a = aside.querySelector(`[data-toc="${currentId}"]`);
    if (a) a.classList.add('is-current');
  }
}

boot();
