async () => {
  const { parseLesson, blankAnswers } = await import('/js/lesson-format.js');
  const course = await (await fetch('/content/course.json')).json();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, ms = 20000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (fn()) return true;
      await wait(100);
    }
    return false;
  };
  const range = window.__range || [0, course.lessons.length];
  // window.__negative = true: submit untouched starters / wrong answers; none may count as solved.
  const negative = !!window.__negative;
  const report = [];
  for (const entry of course.lessons.slice(range[0], range[1])) {
    const text = await (await fetch('/content/lessons/' + entry.file)).text();
    const lesson = parseLesson(text, entry.file.replace(/\.md$/, ''));
    location.hash = '#/lesson/' + lesson.meta.id;
    await wait(300);
    const exs = lesson.sections.flatMap((s) => s.blocks.filter((b) => b.t === 'exercise'));
    for (const ex of exs) {
      const root = document.getElementById('ex-' + ex.number);
      const tag = `${lesson.meta.id}#${ex.number} (${ex.type})`;
      if (!root) {
        report.push(tag + ': not rendered');
        continue;
      }
      const btn = (label) => [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === label);
      try {
        if (ex.type === 'code') {
          const ta = root.querySelector('textarea.editor-input');
          if (!negative) ta.value = ex.solution;
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          btn('Check').click();
        } else if (ex.type === 'quiz') {
          const inputs = root.querySelectorAll('.option input');
          if (negative) {
            const wrong = ex.options.findIndex((o) => !o.correct);
            inputs[wrong].checked = true;
          } else ex.options.forEach((o, i) => (inputs[i].checked = o.correct));
          btn('Check').click();
        } else if (ex.type === 'predict') {
          btn('Show the real output').click();
          await until(() => root.querySelector('.predict-actual pre'));
          const out = root.querySelector('.predict-actual pre').textContent;
          const ta = root.querySelector('textarea.predict-input');
          ta.value = negative ? 'nope' : out === '(nothing)' ? '' : out;
          btn('Check my prediction').click();
        } else if (ex.type === 'fill') {
          let alts;
          if (ex.code) alts = blankAnswers(ex.code);
          else alts = blankAnswers(ex.memory.rows.map((r) => [r.addr, r.name, r.type, r.value, r.note].join(' ')).join('\n'));
          const inputs = root.querySelectorAll('input.blank');
          if (inputs.length !== alts.length) report.push(`${tag}: ${inputs.length} inputs vs ${alts.length} answers`);
          inputs.forEach((inp, i) => (inp.value = negative ? 'zzz' : alts[i] ? alts[i][0] : ''));
          btn('Check').click();
        }
        if (negative) {
          await until(() => !root.querySelector('.btn.is-busy') && root.querySelector('.ex-feedback:not([hidden])'), 15000);
          await wait(300);
          if (root.classList.contains('is-solved')) report.push(`${tag}: ACCEPTED A WRONG ANSWER`);
          continue;
        }
        const ok = await until(() => root.classList.contains('is-solved'));
        if (!ok) {
          const fb = root.querySelector('.ex-feedback:not([hidden])');
          const failing = [...root.querySelectorAll('.test.is-fail')].map((t) => t.textContent.slice(0, 200));
          report.push(`${tag}: NOT SOLVED — ${fb ? fb.textContent.slice(0, 200) : 'no feedback'} ${failing.join(' | ')}`);
        }
      } catch (e) {
        report.push(`${tag}: threw ${e && e.message}`);
      }
    }
    report.push(`${lesson.meta.id}: ${exs.length} exercises tried`);
  }
  return report;
}
