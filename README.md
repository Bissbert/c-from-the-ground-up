# C, from the ground up

A local web course that teaches programming in C to complete beginners. It starts at "what is a program?" and works up through variables, memory addresses, pointers, arrays, strings, structs, dynamic memory and linked lists.

There are 18 lessons. Each piece of theory is followed straight away by an exercise. Exercises come in four kinds:

- write code
- predict the output
- multiple choice
- fill in the blanks (in code or in a memory diagram)

All of your code is compiled by a real C compiler, Clang. It is compiled to WebAssembly and runs inside the page, so nothing needs to be installed and no code leaves your machine.

## Run it

You need Node.js 20 or newer.

```sh
npm install
npm start
```

Open <http://127.0.0.1:5173>.

The first visit downloads the compiler, about 105 MB served from your own machine. You can watch the progress in the status line at the bottom of the screen, which reads `clang ready` once it is done. After that the browser caches it.

### With Docker

```sh
docker build -t c-ground-up .
docker run --rm -p 5173:5173 c-ground-up
```

### On GitHub Pages

`npm run build` writes a fully static copy to `dist/` (the app plus the compiler files under `dist/vendor/`). The workflow in `.github/workflows/pages.yml` runs `npm run check` and `npm run build` on every push to `main` and publishes `dist/` to GitHub Pages; the compiler files are never committed. In the repository settings, Pages must use "GitHub Actions" as its source.

## How it works

| Part | Where |
|---|---|
| Static server (serves `app/` and the compiler files) | `server.mjs` |
| Lessons, in a small Markdown dialect | `app/content/lessons/*.md`, ordered by `app/content/course.json` |
| Lesson format reference for authors | `CONTENT_FORMAT.md` |
| Compiler worker (Clang via `@yowasp/clang`) | `app/js/compile-worker.js` |
| Program runner (WASI, killed after 4 s) | `app/js/run-worker.js` |
| UI | `app/js/main.js`, `exercises.js`, `editor.js`, `console.js`, `app/css/app.css` |

Each program targets `wasm32-wasi`:

- `int`, `long` and pointers are 4 bytes; `long long` is 8.
- Reading or writing through `NULL` does not crash the way it does on a desktop OS.
- Dividing by zero does crash.

The lessons say this where it matters.

Progress and drafts are saved in your browser's `localStorage`. You can reset them with `rm -rf ~/.progress` at the bottom of the home page.

## Checking the lessons

```sh
npm run check            # parse every lesson, compile every example, run every solution against its tests
npm run check -- 14      # only lessons whose file name contains "14"
VERBOSE=1 npm run check  # also print program output
```

`tools/e2e-solve-all.js` is a browser-side harness. Evaluate it in the page through DevTools, optionally setting `window.__range = [from, to]` first. It solves every exercise through the real UI and reports any exercise that does not accept its own reference answer. Set `window.__negative = true` to instead submit untouched starters and wrong answers, and report any exercise that accepts one.

## References

The lessons link to [cppreference.com's C reference](https://en.cppreference.com/w/c) for every function and concept they introduce.
