// Renders the lesson dialect's blocks to DOM. Exercises and runnable code are delegated to `ctx` hooks.
import { h, escapeHtml } from './dom.js';
import { highlightC } from './highlight.js';
import { parseBlocks } from './lesson-format.js';

export function inline(md) {
  const codes = [];
  let s = String(md).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = escapeHtml(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
      const ext = /^https?:/.test(url);
      return `<a href="${url}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w*])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/(^|\W)_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, k) => `<code>${escapeHtml(codes[+k])}</code>`);
}

export function inlineEl(tag, md, attrs = {}) {
  return h(tag, { ...attrs, html: inline(md) });
}

// Render a raw markdown string (hint / explain bodies).
export function renderMarkdown(text, ctx = {}) {
  return renderBlocks(parseBlocks(String(text).split('\n')), ctx);
}

export function renderBlocks(blocks, ctx = {}) {
  const frag = document.createDocumentFragment();
  for (const b of blocks) {
    const el = renderBlock(b, ctx);
    if (el) frag.append(el);
  }
  return frag;
}

function renderBlock(b, ctx) {
  switch (b.t) {
    case 'p':
      return inlineEl('p', b.md);
    case 'h3':
      return inlineEl('h3', b.text);
    case 'list': {
      const list = h(b.ordered ? 'ol' : 'ul');
      for (const item of b.items) list.append(inlineEl('li', item));
      return list;
    }
    case 'table':
      return renderTable(b);
    case 'callout': {
      const labels = { note: 'Note', tip: 'Tip', warn: 'Careful', deep: 'Going deeper' };
      const kind = labels[b.kind] ? b.kind : 'note';
      return h('aside', { class: `callout callout-${kind}` }, h('div', { class: 'callout-label' }, labels[kind]), h('div', { class: 'callout-body' }, renderBlocks(b.blocks, ctx)));
    }
    case 'memory':
      return renderMemory(b);
    case 'code':
      if (b.run && ctx.runnable) return ctx.runnable(b);
      return codeBlock(b.code, b.lang);
    case 'exercise':
      return ctx.exercise ? ctx.exercise(b) : null;
    default:
      return null;
  }
}

function renderTable(b) {
  const table = h('table', { class: 'grid-table' });
  if (b.head.length) table.append(h('thead', {}, h('tr', {}, b.head.map((c) => inlineEl('th', c)))));
  table.append(h('tbody', {}, b.rows.map((r) => h('tr', {}, r.map((c) => inlineEl('td', c))))));
  return h('div', { class: 'table-wrap' }, table);
}

export function codeBlock(code, lang = 'c', extraClass = '') {
  const lines = code.split('\n');
  const gutter = lines.map((_, i) => i + 1).join('\n');
  const body = lang === 'c' ? highlightC(code) : escapeHtml(code);
  return h(
    'div',
    { class: `code-sheet ${lang === 'c' ? '' : 'code-plain'} ${extraClass}`.trim() },
    h('pre', { class: 'code-gutter', 'aria-hidden': 'true' }, gutter),
    h('pre', { class: 'code-body', tabindex: '0' }, h('code', { html: body })),
  );
}

// Memory diagram: one ruled row per cell, the address in the left "sequence" field.
export function renderMemory(b, cellRenderer = null) {
  const hasNote = b.rows.some((r) => r.note);
  const cell = (row, key, cls) => {
    const td = h('td', { class: cls });
    if (cellRenderer) cellRenderer(td, row[key], key, row);
    else td.innerHTML = inline(row[key]);
    return td;
  };
  const table = h(
    'table',
    { class: 'memory' },
    h('thead', {}, h('tr', {}, h('th', { class: 'm-addr' }, 'Address'), h('th', {}, 'Name'), h('th', {}, 'Type'), h('th', { class: 'm-val' }, 'Value'), hasNote ? h('th', {}, 'Note') : null)),
    h(
      'tbody',
      {},
      b.rows.map((r) =>
        h(
          'tr',
          { class: r.highlight ? 'is-hot' : '' },
          cell(r, 'addr', 'm-addr'),
          cell(r, 'name', 'm-name'),
          cell(r, 'type', 'm-type'),
          cell(r, 'value', 'm-val'),
          hasNote ? cell(r, 'note', 'm-note') : null,
        ),
      ),
    ),
  );
  return h('figure', { class: 'memory-figure' }, h('div', { class: 'table-wrap' }, table), b.caption ? inlineEl('figcaption', b.caption) : null);
}
