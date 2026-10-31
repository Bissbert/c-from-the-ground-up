// Progress lives in this browser only (localStorage). Everything is wrapped: storage can be blocked.

const KEY = 'c-ground-up:v1';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { done: {}, drafts: {}, last: null, theme: null, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return { done: {}, drafts: {}, last: null, theme: null };
}

const state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: progress just won't persist */
  }
  for (const fn of listeners) fn(state);
}

export const progress = {
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  isDone: (id) => Boolean(state.done[id]),
  markDone(id) {
    if (state.done[id]) return;
    state.done[id] = Date.now();
    save();
  },
  draft: (id) => state.drafts[id],
  saveDraft(id, code) {
    state.drafts[id] = code;
    clearTimeout(progress._t);
    progress._t = setTimeout(save, 400);
  },
  clearDraft(id) {
    delete state.drafts[id];
    save();
  },
  last: () => state.last,
  setLast(lessonId, sectionId) {
    if (state.last && state.last.lesson === lessonId && state.last.section === sectionId) return;
    state.last = { lesson: lessonId, section: sectionId, at: Date.now() };
    save();
  },
  theme: () => state.theme,
  setTheme(t) {
    state.theme = t;
    save();
  },
  doneCount(ids) {
    return ids.filter((id) => state.done[id]).length;
  },
  reset() {
    state.done = {};
    state.drafts = {};
    state.last = null;
    save();
  },
};
