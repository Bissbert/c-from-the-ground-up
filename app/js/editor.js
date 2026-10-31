// Dependency-free code editor: a transparent textarea over a highlighted <pre>, with a line-number gutter.
import { h } from './dom.js';
import { highlightC } from './highlight.js';

const INDENT = '    ';

export function createEditor({ value = '', onChange = null, onRun = null, label = 'C source code', minLines = 6 } = {}) {
  const gutter = h('pre', { class: 'code-gutter', 'aria-hidden': 'true' });
  const highlight = h('code');
  const pre = h('pre', { class: 'code-body editor-highlight', 'aria-hidden': 'true' }, highlight);
  const ta = h('textarea', {
    class: 'editor-input',
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
    autocorrect: 'off',
    wrap: 'off',
    'aria-label': label,
  });
  ta.value = value;
  const stack = h('div', { class: 'editor-stack' }, pre, ta);
  const el = h('div', { class: 'code-sheet editor' }, gutter, stack);
  let marks = new Map();

  function render() {
    const text = ta.value;
    const lines = text.split('\n');
    const n = Math.max(lines.length, minLines);
    highlight.innerHTML = highlightC(text) + '\n';
    gutter.innerHTML = '';
    for (let i = 1; i <= n; i++) {
      const kind = marks.get(i);
      const line = document.createElement('span');
      line.textContent = String(i);
      if (kind) line.className = `mark-${kind}`;
      gutter.append(line, '\n');
    }
    ta.rows = n;
    ta.style.height = `calc(${n} * var(--code-lh) + 2 * var(--code-pad-y))`;
  }

  function changed() {
    render();
    if (onChange) onChange(ta.value);
  }

  // Edits go through execCommand when available so the browser's undo stack keeps working.
  function insert(text) {
    if (!document.execCommand('insertText', false, text)) {
      const { selectionStart: s, selectionEnd: e } = ta;
      ta.setRangeText(text, s, e, 'end');
      changed();
    }
  }

  ta.addEventListener('input', changed);
  ta.addEventListener('scroll', () => {
    pre.scrollLeft = ta.scrollLeft;
  });
  ta.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRun) onRun();
      return;
    }
    const { selectionStart: s, selectionEnd: end, value: v } = ta;
    if (e.key === 'Tab' && !e.altKey && !e.metaKey && !e.ctrlKey) {
      // Escape then Tab leaves the editor (keyboard users must never be trapped).
      if (ta.dataset.escaped === '1') return;
      e.preventDefault();
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      if (s !== end || e.shiftKey) {
        const nl = v.indexOf('\n', end);
        const block = v.slice(lineStart, nl === -1 ? v.length : nl);
        const next = e.shiftKey ? block.replace(/^ {1,4}/gm, '') : block.replace(/^/gm, INDENT);
        ta.setSelectionRange(lineStart, lineStart + block.length);
        insert(next);
        ta.setSelectionRange(lineStart, lineStart + next.length);
      } else insert(INDENT);
      return;
    }
    if (e.key === 'Escape') {
      ta.dataset.escaped = '1';
      return;
    }
    ta.dataset.escaped = '0';
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      const line = v.slice(lineStart, s);
      let indent = line.match(/^\s*/)[0];
      const before = v.slice(0, s).trimEnd();
      const after = v.slice(end);
      if (before.endsWith('{')) {
        if (/^\s*\}/.test(after)) {
          insert(`\n${indent}${INDENT}\n${indent}`);
          const pos = s + 1 + indent.length + INDENT.length;
          ta.setSelectionRange(pos, pos);
          return;
        }
        indent += INDENT;
      }
      insert(`\n${indent}`);
      return;
    }
    if (e.key === '}' && s === end) {
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      const line = v.slice(lineStart, s);
      if (/^\s+$/.test(line) && line.length >= 4) {
        e.preventDefault();
        ta.setSelectionRange(s - 4, s);
        insert('}');
      }
    }
  });

  render();

  return {
    el,
    textarea: ta,
    getValue: () => ta.value,
    setValue(v) {
      ta.value = v;
      marks = new Map();
      changed();
    },
    mark(lineKinds) {
      marks = new Map(lineKinds);
      render();
    },
    focus: () => ta.focus(),
  };
}
