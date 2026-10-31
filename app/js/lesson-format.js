// Parser for the lesson Markdown dialect described in CONTENT_FORMAT.md.
// Pure functions only: this module runs in the browser and in Node (tools/check-lessons.mjs).

export function parseFrontMatter(text) {
  const meta = {};
  let body = text;
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---', 4);
    if (end !== -1) {
      const head = text.slice(4, end);
      body = text.slice(end + 4).replace(/^\n/, '');
      for (const line of head.split('\n')) {
        const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
        if (!m) continue;
        const [, key, value] = m;
        if (key === 'docs') {
          meta.docs = meta.docs || [];
          const [label, url] = value.split('|').map((s) => s.trim());
          if (label && url) meta.docs.push({ label, url });
        } else if (key === 'goals') {
          meta.goals = meta.goals || [];
          meta.goals.push(value.trim());
        } else {
          meta[key] = value.trim();
        }
      }
    }
  }
  return { meta, body };
}

export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Parse a lesson file into { meta, sections: [{ id, heading, blocks }] }.
export function parseLesson(text, fallbackId = 'lesson') {
  const { meta, body } = parseFrontMatter(text.replace(/\r\n/g, '\n'));
  meta.id = meta.id || fallbackId;
  const lines = body.split('\n');
  const sections = [];
  let current = { id: 'intro', heading: null, lines: [] };
  for (const line of lines) {
    const h = line.match(/^## (.+)$/);
    if (h) {
      if (current.heading || current.lines.some((l) => l.trim())) sections.push(current);
      current = { id: slugify(h[1]), heading: h[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.heading || current.lines.some((l) => l.trim())) sections.push(current);

  let exerciseCount = 0;
  const parsed = sections.map((s) => {
    const blocks = parseBlocks(s.lines);
    for (const b of blocks) {
      if (b.t === 'exercise') {
        exerciseCount += 1;
        b.id = `${meta.id}/${exerciseCount}`;
        b.number = exerciseCount;
      }
    }
    return { id: s.id, heading: s.heading, blocks };
  });
  return { meta, sections: parsed };
}

function parseFenceInfo(info) {
  const words = info.trim().split(/\s+/).filter(Boolean);
  return { lang: words[0] || 'text', flags: words.slice(1) };
}

// Turn an array of lines into blocks.
export function parseBlocks(lines) {
  const blocks = [];
  let i = 0;
  let para = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push({ t: 'p', md: para.join(' ').trim() });
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // exercise container
    const ex = line.match(/^:::exercise\s+(\w+)\s*(?:"([^"]*)")?\s*$/);
    if (ex) {
      flushPara();
      const inner = [];
      i += 1;
      let inFence = false;
      while (i < lines.length) {
        const l = lines[i];
        if (/^```/.test(l)) inFence = !inFence;
        if (!inFence && /^:::\s*$/.test(l)) break;
        inner.push(l);
        i += 1;
      }
      i += 1; // skip closing :::
      blocks.push(buildExercise(ex[1], ex[2] || '', parseBlocks(inner)));
      continue;
    }

    // fenced code
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      flushPara();
      const { lang, flags } = parseFenceInfo(fence[1]);
      const code = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      const text = code.join('\n');
      if (lang === 'memory') {
        blocks.push(parseMemory(text, flags));
      } else if (lang === 'stdin' && blocks.length && blocks[blocks.length - 1].t === 'code') {
        blocks[blocks.length - 1].stdin = text + '\n';
      } else {
        blocks.push({ t: 'code', lang, flags, code: text, run: flags.includes('run') });
      }
      continue;
    }

    // heading level 3
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      flushPara();
      blocks.push({ t: 'h3', text: h3[1].trim() });
      i += 1;
      continue;
    }

    // callout / blockquote
    if (/^>/.test(line)) {
      flushPara();
      const q = [];
      while (i < lines.length && /^>/.test(lines[i])) {
        q.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      let kind = 'note';
      const first = q[0] && q[0].match(/^\[!(\w+)\]\s*(.*)$/);
      if (first) {
        kind = first[1].toLowerCase();
        q[0] = first[2];
      }
      blocks.push({ t: 'callout', kind, blocks: parseBlocks(q) });
      continue;
    }

    // table
    if (/^\|/.test(line)) {
      flushPara();
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        const cells = splitRow(lines[i]);
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i += 1;
      }
      blocks.push({ t: 'table', head: rows[0] || [], rows: rows.slice(1) });
      continue;
    }

    // lists
    const li = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (li && li[1].length === 0) {
      flushPara();
      const ordered = /\d/.test(li[2]);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^([-*]|\d+\.)\s+(.*)$/);
        if (m) {
          items.push(m[2]);
          i += 1;
        } else if (/^\s{2,}\S/.test(lines[i]) && items.length) {
          items[items.length - 1] += ' ' + lines[i].trim();
          i += 1;
        } else break;
      }
      blocks.push({ t: 'list', ordered, items });
      continue;
    }

    if (!line.trim()) {
      flushPara();
      i += 1;
      continue;
    }

    para.push(line.trim());
    i += 1;
  }
  flushPara();
  return blocks;
}

function splitRow(line) {
  // split on | that are not inside backticks or escaped
  const cells = [];
  let cur = '';
  let inCode = false;
  const s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if (ch === '\\' && s[k + 1] === '|') {
      cur += '|';
      k += 1;
      continue;
    }
    if (ch === '`') inCode = !inCode;
    if (ch === '|' && !inCode) {
      cells.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

// memory fence:  address | name | type | value   (one row per line; "caption: ..." optional)
function parseMemory(text, flags) {
  const rows = [];
  let caption = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const cap = line.match(/^caption:\s*(.*)$/);
    if (cap) {
      caption = cap[1];
      continue;
    }
    // Split on | but not inside [[blank|alternatives]].
    const parts = line.split(/\|(?![^[]*\]\])/).map((s) => s.trim());
    const [addr = '', name = '', type = '', value = '', note = ''] = parts;
    rows.push({ addr, name, type, value, note, highlight: /\*$/.test(addr) });
  }
  for (const r of rows) r.addr = r.addr.replace(/\*$/, '').trim();
  return { t: 'memory', rows, caption, flags };
}

function parseTest(text) {
  const test = { name: '', stdin: '', expect: null, mode: 'exact', sourceHas: [], sourceLacks: [] };
  const lines = text.split('\n');
  for (let k = 0; k < lines.length; k++) {
    const line = lines[k];
    if (/^expect:\s*$/.test(line)) {
      test.expect = lines.slice(k + 1).join('\n');
      break;
    }
    const m = line.match(/^([\w-]+):\s?(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (key === 'name') test.name = value;
    else if (key === 'stdin') test.stdin = value.replace(/\\n/g, '\n') + '\n';
    else if (key === 'mode') test.mode = value.trim();
    else if (key === 'source-has') test.sourceHas.push(value);
    else if (key === 'source-lacks') test.sourceLacks.push(value);
    else if (key === 'expect') test.expect = value;
  }
  return test;
}

function buildExercise(type, title, blocks) {
  const ex = {
    t: 'exercise',
    type,
    title,
    prompt: [],
    starter: null,
    solution: null,
    code: null,
    memory: null,
    stdin: '',
    tests: [],
    hints: [],
    options: [],
    explain: null,
  };
  for (const b of blocks) {
    if (b.t === 'code') {
      const role = b.flags[0];
      if (b.lang === 'c' && role === 'starter') ex.starter = b.code;
      else if (b.lang === 'c' && role === 'solution') ex.solution = b.code;
      else if (b.lang === 'c' && role === 'code') {
        ex.code = b.code;
        if (b.stdin) ex.stdin = b.stdin;
      } else if (b.lang === 'test') ex.tests.push(parseTest(b.code));
      else if (b.lang === 'hint') ex.hints.push(b.code);
      else if (b.lang === 'explain') ex.explain = b.code;
      else if (b.lang === 'options') {
        for (const line of b.code.split('\n')) {
          const m = line.match(/^- \[( |x)\]\s+(.*)$/);
          if (m) ex.options.push({ correct: m[1] === 'x', text: m[2] });
        }
      } else ex.prompt.push(b);
    } else if (b.t === 'memory' && type === 'fill' && !ex.memory && /\[\[/.test(JSON.stringify(b.rows))) {
      ex.memory = b;
    } else ex.prompt.push(b);
  }
  return ex;
}

// ---- blanks for "fill" exercises: [[answer|alternative]] ----
export const BLANK_RE = /\[\[(.+?)\]\]/g;

export function blankAnswers(text) {
  const out = [];
  text.replace(BLANK_RE, (_, inner) => {
    out.push(inner.split('|').map((s) => s.trim()));
    return '';
  });
  return out;
}

export function fillBlanks(text, values) {
  let k = 0;
  return text.replace(BLANK_RE, (_, inner) => {
    const v = values ? values[k] : inner.split('|')[0];
    k += 1;
    return v;
  });
}

export function normalizeAnswer(s) {
  return String(s).replace(/\s+/g, '').toLowerCase();
}

export function normalizeOutput(s) {
  return String(s)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

// Strip comments and string literals so source checks don't match inside them.
export function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "' '");
}

// Compare one test result. Returns { pass, reason }.
export function judgeTest(test, source, run) {
  const src = codeOnly(source);
  for (const needle of test.sourceHas) {
    if (!src.includes(needle)) return { pass: false, reason: `Your code should use \`${needle}\`.` };
  }
  for (const needle of test.sourceLacks) {
    if (src.includes(needle)) return { pass: false, reason: `Solve it without using \`${needle}\`.` };
  }
  if (run.timedOut) return { pass: false, reason: 'The program did not finish in time. Is there an endless loop?' };
  if (run.trap) return { pass: false, reason: `The program crashed: ${run.trap}` };
  if (test.expect === null) return { pass: run.exitCode === 0, reason: run.exitCode === 0 ? '' : `main returned ${run.exitCode}.` };
  const got = normalizeOutput(run.stdout);
  const want = normalizeOutput(test.expect);
  if (test.mode === 'contains' ? got.includes(want) : got === want) return { pass: true, reason: '' };
  return { pass: false, reason: 'The output is not what was expected.' };
}
