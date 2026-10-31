// A small, honest C syntax highlighter (tokens → spans). Not a parser; good enough for teaching code.
import { escapeHtml } from './dom.js';

const KEYWORDS = new Set(
  'auto break case const continue default do else enum extern for goto if inline register restrict return sizeof static struct switch typedef union volatile while _Bool _Static_assert'.split(' '),
);
const TYPES = new Set(
  'void char short int long float double signed unsigned bool size_t FILE uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t ptrdiff_t'.split(' '),
);
const CONSTS = new Set('NULL true false EOF INT_MAX INT_MIN LONG_MAX CHAR_MAX UINT_MAX'.split(' '));

const TOKEN = new RegExp(
  [
    String.raw`(\/\*[\s\S]*?(?:\*\/|$))`, // 1 block comment
    String.raw`(\/\/[^\n]*)`, // 2 line comment
    String.raw`("(?:\\.|[^"\\\n])*"?)`, // 3 string
    String.raw`('(?:\\.|[^'\\\n])*'?)`, // 4 char
    String.raw`(^[ \t]*#[^\n]*)`, // 5 preprocessor line
    String.raw`(\b0[xX][0-9a-fA-F]+[uUlL]*\b|\b\d+\.?\d*(?:[eE][+-]?\d+)?[fFuUlL]*\b|\B\.\d+\b)`, // 6 number
    String.raw`([A-Za-z_]\w*)`, // 7 identifier
  ].join('|'),
  'gm',
);

export function highlightC(code) {
  let out = '';
  let last = 0;
  code.replace(TOKEN, (m, block, line, str, chr, pre, num, ident, offset) => {
    out += escapeHtml(code.slice(last, offset));
    last = offset + m.length;
    let cls = null;
    if (block || line) cls = 'tk-com';
    else if (str || chr) cls = 'tk-str';
    else if (pre) {
      // #include <stdio.h>: color the directive and the header separately
      const mm = m.match(/^([ \t]*#\s*\w+)(.*)$/);
      out += `<span class="tk-pre">${escapeHtml(mm ? mm[1] : m)}</span>`;
      if (mm && mm[2]) out += `<span class="tk-str">${escapeHtml(mm[2])}</span>`;
      return m;
    } else if (num) cls = 'tk-num';
    else if (ident) {
      if (KEYWORDS.has(m)) cls = 'tk-kw';
      else if (TYPES.has(m)) cls = 'tk-type';
      else if (CONSTS.has(m)) cls = 'tk-num';
      else if (/^\s*\(/.test(code.slice(last, last + 8))) cls = 'tk-fn';
    }
    out += cls ? `<span class="${cls}">${escapeHtml(m)}</span>` : escapeHtml(m);
    return m;
  });
  out += escapeHtml(code.slice(last));
  return out;
}
