// The terminal frame (after bissbert.ch): the course looks like one shell session.
// No sidebar and no masthead: a tmux-style window bar on top, a neofetch home,
// lessons shown as `cat`-ed files, and a vim-style status line at the bottom.
// Everything is clicked, not typed: there is deliberately no working prompt.

const USER = 'visitor@c-ground-up';
const LOGO = [' ██████╗', '██╔════╝', '██║     ', '██║     ', '╚██████╗', ' ╚═════╝'].join('\n');
const CHIP = ['   ┌┴┴┴┴┴┴┴┐', ' ──┤ int x  ├──', ' ──┤ 0xfff8 ├──', ' ──┤ 4 bytes├──', '   └┬┬┬┬┬┬┬┘'].join('\n');
const SWATCHES = ['#0c0d0c', '#ff5f56', '#3ddc4a', '#ffb000', '#2f6bff', '#c26bff', '#22d3c5', '#d8e8d6'];

let ctx = null;
let route = { kind: 'home' };
let status = null; // the status line lives outside main.js's rebuild and is refreshed in place

const slug = (l) => `${l.number}-${l.meta.id}`;
const bar = (done, total) => '■'.repeat(done) + '□'.repeat(Math.max(0, total - done));

function prompt(path, cmd) {
  const { h } = ctx;
  return h('div', { class: 't-echo' }, h('span', { class: 't-user' }, USER), ':', h('span', { class: 't-path' }, path), '$ ', h('span', { class: 't-cmd' }, cmd));
}

function totals() {
  const total = ctx.course.lessons.reduce((n, l) => n + l.exercises.length, 0);
  const solved = ctx.course.lessons.reduce((n, l) => n + ctx.progress.doneCount(l.exercises), 0);
  return { total, solved };
}

// ---------- home: neofetch, ls -l, cat README ----------

export function home(c) {
  ctx = c;
  const { h, course, progress, lessonState, inline } = c;
  const { total, solved } = totals();
  const minutes = course.lessons.reduce((n, l) => n + (Number(l.meta.minutes) || 0), 0);
  const parts = new Set(course.lessons.map((l) => l.part));
  const last = progress.last();
  const lastLesson = last && course.lessons.find((l) => l.meta.id === last.lesson);
  const target = lastLesson || course.lessons.find((l) => lessonState(l) !== 'done') || course.lessons[0];
  const pct = total ? Math.round((solved / total) * 100) : 0;

  const fact = (k, v) => h('div', { class: 't-fact' }, h('dt', {}, `${k}:`), h('dd', {}, v));
  const fetch = h(
    'section',
    { class: 't-fetch' },
    h('div', { class: 't-art', 'aria-hidden': 'true' }, h('pre', { class: 't-logo' }, LOGO), h('pre', { class: 't-chip' }, CHIP)),
    h(
      'div',
      { class: 't-info' },
      h('h1', { class: 't-name' }, course.title),
      h('p', { class: 't-host' }, `${USER}`),
      h(
        'dl',
        { class: 't-facts' },
        fact('Course', 'C for complete beginners'),
        fact('Host', 'your browser — nothing installed'),
        fact('Kernel', 'clang → wasm32-wasi'),
        fact('Lessons', `${course.lessons.length} in ${parts.size} parts`),
        fact('Uptime', `about ${Math.round(minutes / 60)} hours of reading`),
        fact('Exercises', `${total}`),
        fact('Solved', h('span', {}, `${solved}/${total} `, h('span', { class: 't-meter', 'aria-hidden': 'true' }, h('span', { style: `width:${pct}%` })), ` ${pct}%`)),
        fact('Last', lastLesson ? `${lastLesson.number} ${lastLesson.meta.title}` : '—'),
      ),
      h('p', { class: 't-welcome' }, 'Welcome to the course!'),
      h('p', { class: 't-lede' }, 'Read a short piece of theory, then solve the exercise right below it. Every program you write is compiled by a real C compiler running inside this page — nothing is simulated.'),
      h(
        'p',
        { class: 't-try' },
        h('a', { href: `#/lesson/${target.meta.id}${lastLesson && last.section ? `/${last.section}` : ''}` }, lastLesson ? `Continue ${target.number}` : `Start ${target.number}`),
        h('span', { class: 't-dim' }, ` ${target.meta.title}`),
        h('br'),
        h('a', { href: '#/playground' }, 'Playground'),
        h('span', { class: 't-dim' }, ' a blank sheet to try things'),
      ),
      h('div', { class: 't-swatches', 'aria-hidden': 'true' }, SWATCHES.map((c) => h('span', { style: `background:${c}` }))),
    ),
  );

  const listing = h('ol', { class: 't-ls' });
  let part = null;
  for (const l of course.lessons) {
    if (l.part !== part) {
      part = l.part;
      listing.append(h('li', { class: 't-comment', 'aria-hidden': 'true' }, `# ${part}`));
    }
    const done = progress.doneCount(l.exercises);
    const state = lessonState(l);
    listing.append(
      h(
        'li',
        {},
        h(
          'a',
          { class: `t-row is-${state}`, href: `#/lesson/${l.meta.id}`, 'aria-label': `${l.number} ${l.meta.title}, ${done} of ${l.exercises.length} exercises solved` },
          h('span', { class: 't-row-cmd' }, `${slug(l)}.md`),
          h('span', { class: 't-row-title' }, `- ${l.meta.title}`),
          h('span', { class: 't-row-min' }, `${l.meta.minutes || '?'}m`),
          h('span', { class: 't-row-bar', 'aria-hidden': 'true' }, `[${bar(done, l.exercises.length)}]`),
        ),
      ),
    );
  }

  const notes = [
    '**Theory, then practice.** Each idea is followed straight away by an exercise: write code, predict the output, choose, or fill in the blanks.',
    '**Examples are editable.** Change any example and press **Run** (or `Ctrl`/`⌘` + `Enter`).',
    '**The compiler is real.** Its messages appear with a plain-English explanation underneath.',
    '**Your progress stays in this browser.** Nothing is sent anywhere.',
    '**References** link to [cppreference.com](https://en.cppreference.com/w/c), the standard reference for C.',
  ];

  return h(
    'div',
    { class: 't-home' },
    prompt('~', 'neofetch'),
    fetch,
    h('section', { class: 't-block', 'aria-label': 'Course contents' }, prompt('~/lessons', 'ls -l'), h('h2', { class: 't-h2' }, 'Lessons'), listing),
    h(
      'section',
      { class: 't-block t-readme' },
      prompt('~', 'cat README.md'),
      h('h2', { class: 't-h2' }, 'How this course works'),
      h('ul', {}, notes.map((n) => h('li', { html: inline(n) }))),
      h('button', { class: 'btn btn-quiet t-danger', type: 'button', onclick: c.resetProgress }, h('span', {}, 'rm -rf ~/.progress')),
    ),
  );
}

// ---------- lesson header: `cat 05-….md` ----------

export function lessonHead(c, lesson) {
  ctx = c;
  const { h, inline, progress } = c;
  const { meta } = lesson;
  const done = progress.doneCount(lesson.exercises);
  const line = (k, v) => h('div', {}, h('dt', {}, `${k}:`), h('dd', {}, v));
  return h(
    'header',
    { class: 'lesson-head t-lesson-head' },
    prompt('~/lessons', `cat ${slug(lesson)}.md`),
    h('h1', { class: 'display' }, h('span', { class: 't-hash', 'aria-hidden': 'true' }, '# '), meta.title),
    meta.subtitle ? h('p', { class: 'lede' }, h('span', { class: 't-slashes', 'aria-hidden': 'true' }, '// '), h('span', { html: inline(meta.subtitle) })) : null,
    h(
      'dl',
      { class: 't-meta' },
      line('lesson', `${lesson.number} of ${c.pad2(c.course.lessons.length)}`),
      line('part', lesson.part),
      line('time', `~${meta.minutes || '?'} min`),
      line('solved', `${done}/${lesson.exercises.length} [${bar(done, lesson.exercises.length)}]`),
    ),
    meta.goals && meta.goals.length
      ? h('div', { class: 't-goals' }, h('h2', { class: 't-h2' }, 'TODO'), h('ul', {}, meta.goals.map((g) => h('li', {}, h('span', { class: 't-box', 'aria-hidden': 'true' }, '[ ] '), h('span', { html: inline(g) })))))
      : null,
  );
}

// ---------- chrome: tmux window bar + status line ----------

export function chrome(c, r) {
  ctx = c;
  route = r;
  const { h, course } = c;
  const lessons = course.lessons;
  const current = r.kind === 'lesson' && r.lesson;

  // window bar: 0:home  1:<lesson>  2:play   ……   [ PREV ] [ NEXT ] [ LESSONS ]
  const win = (n, label, href, active) => h('a', { class: `t-win ${active ? 'is-active' : ''}`, href, 'aria-current': active ? 'page' : null }, h('span', { class: 't-win-n' }, `${n}:`), label, active ? '*' : '');
  const prev = current && lessons[current.index - 1];
  const next = current && lessons[current.index + 1];
  const winbar = h(
    'nav',
    { class: 'look-chrome t-bar', 'aria-label': 'Windows' },
    h('span', { class: 't-session', 'aria-hidden': 'true' }, '[c]'),
    win(0, 'home', '#/', r.kind === 'home'),
    current ? win(1, [current.number, h('span', { class: 't-win-long' }, slug(current).slice(current.number.length))], `#/lesson/${current.meta.id}`, true) : null,
    win(current ? 2 : 1, 'play', '#/playground', r.kind === 'playground'),
    h('span', { class: 't-bar-gap' }),
    prev ? h('a', { class: 't-bracket', href: `#/lesson/${prev.meta.id}`, title: `${prev.number} ${prev.meta.title}` }, 'prev') : null,
    next ? h('a', { class: 't-bracket', href: `#/lesson/${next.meta.id}`, title: `${next.number} ${next.meta.title}` }, 'next') : null,
    h('a', { class: 't-bracket t-bracket-ls', href: '#/' }, 'lessons'),
  );
  document.body.prepend(winbar);

  buildStatus();
  updateStatus();
}

function buildStatus() {
  if (status) {
    if (!status.isConnected) document.body.append(status);
    return;
  }
  status = ctx.h('footer', { class: 't-status' });
  document.body.append(status);

  // mirror the compiler state, and keep the page clear of the status line's height
  const comp = document.getElementById('f-compiler');
  if (comp) new MutationObserver(updateStatus).observe(comp, { childList: true, characterData: true, subtree: true, attributes: true });
  new ResizeObserver(() => document.documentElement.style.setProperty('--t-shell-h', `${status.offsetHeight}px`)).observe(status);
  window.addEventListener('scroll', updateStatus, { passive: true });
}

function updateStatus() {
  if (!status || !ctx) return;
  const { h } = ctx;
  const { total, solved } = totals();
  const comp = document.getElementById('f-compiler');
  const lesson = route.kind === 'lesson' && route.lesson;
  const file = lesson ? `${slug(lesson)}.md` : route.kind === 'playground' ? 'playground.c' : '~/README';
  const max = document.documentElement.scrollHeight - innerHeight;
  const pos = max <= 0 ? 'All' : scrollY <= 0 ? 'Top' : scrollY >= max - 2 ? 'Bot' : `${Math.round((scrollY / max) * 100)}%`;
  status.replaceChildren(
    ...[
      h('span', { class: 't-file' }, file),
      lesson ? h('span', { class: 't-st t-st-part' }, lesson.part) : null,
      h('span', { class: 't-gap' }),
      h('span', { class: `t-st t-clang is-${comp ? comp.dataset.state : 'idle'}` }, `clang ${comp ? comp.textContent.toLowerCase() : ''}`),
      h('span', { class: 't-st t-solved' }, `${solved}/${total} solved`),
      h('span', { class: 't-st t-pos', 'aria-hidden': 'true' }, pos),
    ].filter(Boolean),
  );
}
