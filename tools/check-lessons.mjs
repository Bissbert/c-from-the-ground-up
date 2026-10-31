#!/usr/bin/env node
// Validates every lesson: parses it, compiles every runnable example, every solution,
// runs every test, and checks quiz / fill / predict exercises.
// Usage: node tools/check-lessons.mjs [lesson-file-substring ...]

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runClang } from '@yowasp/clang';
import * as shim from '@bjorn3/browser_wasi_shim';
import { parseLesson, judgeTest, blankAnswers, fillBlanks } from '../app/js/lesson-format.js';
import { compileC } from '../app/js/compile-core.js';
import { runWasm } from '../app/js/wasi-run.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const lessonDir = path.join(root, 'app/content/lessons');
const filters = process.argv.slice(2);
const verbose = process.env.VERBOSE === '1';

let errors = 0;
let warnings = 0;
const err = (where, msg) => {
  errors += 1;
  console.log(`  \x1b[31mERROR\x1b[0m ${where}: ${msg}`);
};
const warn = (where, msg) => {
  warnings += 1;
  console.log(`  \x1b[33mwarn\x1b[0m  ${where}: ${msg}`);
};

async function compileAndRun(src, stdin = '') {
  const c = await compileC(runClang, src);
  if (!c.ok) return { compiled: false, diagnostics: c.diagnostics };
  const r = await runWasm(shim, c.wasm, stdin);
  return { compiled: true, diagnostics: c.diagnostics, ...r };
}

const course = JSON.parse(await readFile(path.join(root, 'app/content/course.json'), 'utf8'));
const listed = new Set(course.lessons.map((l) => l.file));
const files = (await readdir(lessonDir)).filter((f) => f.endsWith('.md')).sort();
for (const l of course.lessons) if (!files.includes(l.file)) warn('course.json', `lesson file missing: ${l.file}`);

for (const file of files) {
  if (filters.length && !filters.some((f) => file.includes(f))) continue;
  if (!listed.has(file)) warn(file, 'not listed in course.json');
  console.log(`\n\x1b[1m${file}\x1b[0m`);
  const text = await readFile(path.join(lessonDir, file), 'utf8');
  const lesson = parseLesson(text, file.replace(/\.md$/, ''));
  if (!lesson.meta.title) err(file, 'front matter has no title');
  let exCount = 0;
  let runCount = 0;

  for (const section of lesson.sections) {
    const walk = async (blocks, where) => {
      for (const b of blocks) {
        if (b.t === 'callout') await walk(b.blocks, where);
        if (b.t === 'code' && b.lang === 'c' && b.run) {
          runCount += 1;
          const r = await compileAndRun(b.code, b.stdin || '');
          const expectError = b.flags.includes('error');
          if (expectError && r.compiled) err(where, 'example marked `error` compiled fine');
          if (!expectError && !r.compiled) err(where, `runnable example does not compile:\n${r.diagnostics}`);
          if (r.compiled && r.diagnostics && !b.flags.includes('warn')) warn(where, `example has warnings (add flag "warn" if intended):\n${r.diagnostics}`);
          if (r.compiled && r.trap && !b.flags.includes('crash')) err(where, `example crashed: ${r.trap}`);
          if (verbose && r.compiled) console.log(`    [run] ${JSON.stringify(r.stdout).slice(0, 120)}`);
        }
        if (b.t === 'exercise') {
          exCount += 1;
          await checkExercise(b, `${file} § ${section.heading || 'intro'} — ex ${b.number} "${b.title}"`);
        }
      }
    };
    await walk(section.blocks, `${file} § ${section.heading || 'intro'}`);
  }
  console.log(`  ${lesson.sections.length} sections, ${runCount} runnable examples, ${exCount} exercises`);
  if (exCount < 3) warn(file, `only ${exCount} exercises`);
}

async function checkExercise(ex, where) {
  if (!ex.title) warn(where, 'exercise has no title');
  if (!ex.prompt.length) err(where, 'exercise has no prompt text');
  switch (ex.type) {
    case 'code': {
      if (!ex.solution) return err(where, 'code exercise needs a ```c solution block');
      if (!ex.starter) warn(where, 'no ```c starter block (student starts from empty editor)');
      if (!ex.tests.length) return err(where, 'code exercise needs at least one ```test block');
      const sol = await compileAndRun(ex.solution, ex.tests[0].stdin);
      if (!sol.compiled) return err(where, `solution does not compile:\n${sol.diagnostics}`);
      if (sol.diagnostics) warn(where, `solution has warnings:\n${sol.diagnostics}`);
      for (const t of ex.tests) {
        const r = await compileAndRun(ex.solution, t.stdin);
        const j = judgeTest(t, ex.solution, r);
        if (!j.pass) err(where, `solution fails test "${t.name}": ${j.reason}\n    got:  ${JSON.stringify(r.stdout)}\n    want: ${JSON.stringify(t.expect)}`);
      }
      if (ex.starter) {
        // Only compile the starter: it may legitimately loop forever until the student fixes it.
        const s = await compileC(runClang, ex.starter);
        if (!s.ok) warn(where, `starter does not compile (fine only if that is the point of the exercise):\n${s.diagnostics}`);
      }
      break;
    }
    case 'predict': {
      if (!ex.code) return err(where, 'predict exercise needs a ```c code block');
      const r = await compileAndRun(ex.code, ex.stdin);
      if (!r.compiled) return err(where, `code does not compile:\n${r.diagnostics}`);
      if (r.trap) err(where, `code crashes: ${r.trap}`);
      if (!r.stdout.trim()) err(where, 'code prints nothing to predict');
      if (verbose) console.log(`    [predict] ${JSON.stringify(r.stdout)}`);
      break;
    }
    case 'quiz': {
      if (ex.options.length < 2) err(where, 'quiz needs at least 2 options in an ```options block');
      if (!ex.options.some((o) => o.correct)) err(where, 'quiz has no correct option ([x])');
      if (!ex.explain) warn(where, 'quiz has no ```explain block');
      break;
    }
    case 'fill': {
      const target = ex.code ?? (ex.memory ? JSON.stringify(ex.memory.rows) : null);
      if (!target) return err(where, 'fill exercise needs a ```c code block or a ```memory block with [[blanks]]');
      const answers = blankAnswers(target);
      if (!answers.length) return err(where, 'fill exercise has no [[blanks]]');
      if (ex.code) {
        const r = await compileAndRun(fillBlanks(ex.code), ex.stdin);
        if (!r.compiled) err(where, `code with first answers filled in does not compile:\n${r.diagnostics}`);
        else if (r.trap) err(where, `filled code crashes: ${r.trap}`);
        for (const t of ex.tests) {
          const j = judgeTest(t, fillBlanks(ex.code), r);
          if (!j.pass) err(where, `filled code fails test "${t.name}": ${j.reason} got ${JSON.stringify(r.stdout)}`);
        }
      }
      break;
    }
    default:
      err(where, `unknown exercise type "${ex.type}"`);
  }
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
