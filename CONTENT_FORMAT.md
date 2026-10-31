# Lesson format

Lessons live in `app/content/lessons/NN-name.md` and are listed (in order) in `app/content/course.json`.
They are written in a small Markdown dialect, parsed by `app/js/lesson-format.js`.
Validate with `npm run check` (or `node tools/check-lessons.mjs 05` for one lesson): every runnable
example and every solution is compiled with the same Clang the browser uses, and every test is run.

`app/content/lessons/01-first-program.md` is the reference lesson — copy its tone and structure.

## Front matter

```
---
id: pointers                      # unique, kebab-case, never change it once published (progress is keyed on it)
title: Pointers
subtitle: One sentence shown under the title.
minutes: 30
goals: One learning goal per line (3–4 lines)
goals: ...
docs: printf | https://en.cppreference.com/w/c/io/fprintf     # "label | url", one per line
---
```

Docs links point at the **C** section of cppreference.com (`https://en.cppreference.com/w/c/...`).
Only use URLs you are sure exist.

## Body

- `## Heading` starts a section (sections become the lesson's table of contents).
- `### Heading` is a sub-heading inside a section.
- Paragraphs, `- lists`, `1. ordered lists`, `| tables |`, `` `inline code` ``, `**bold**`, `*italic*`, `[links](url)`.
- Callouts: a blockquote whose first line is `> [!NOTE]`, `> [!TIP]`, `> [!WARN]` or `> [!DEEP]` (an optional "going deeper" aside).

### Code blocks

````
```c run            ← a runnable example: shows a Run button; must compile without warnings
```c run warn       ← runnable, compiles but warnings are intended (to demonstrate a warning)
```c run error      ← runnable, deliberately does NOT compile (to demonstrate an error)
```c run crash      ← runnable, deliberately crashes at run time
```c                ← code shown but not runnable (fragments)
```text             ← plain text (e.g. expected output)
````

A runnable example that reads input can be followed directly by a ` ```stdin ` block; its content
is pre-filled as the program's input.

### Memory diagrams

````
```memory
caption: Two ints next to each other on the stack
0xfff8* | a | int | 5          ← address | name | type | value | (optional note); "*" after the address highlights the row
0xfff4  | b | int | 7
```
````

Rows are drawn top to bottom as cells of memory. Use the addresses the real compiler produces when you
can (see platform facts below), or round, readable ones (`0x1000`, `0x1004`) and say they are made up.

## Exercises

An exercise is a container placed **right after the theory it practises** — theory, then immediately practice:

````
:::exercise <type> "Title"
Prompt in Markdown (any normal blocks).
...role blocks...
:::
````

Types:

### `code` — the student writes a program; it is compiled and tested

- ` ```c starter ` — what the editor starts with (should compile, or deliberately not, for "fix the bug" tasks).
- ` ```c solution ` — reference solution (must compile without warnings and pass all tests).
- one or more ` ```test ` blocks:

````
```test
name: adds two numbers          ← shown to the student
stdin: 3 4                      ← optional; "\n" for newlines
source-has: ->                  ← optional, repeatable: code (outside comments/strings) must contain this
source-lacks: [                 ← optional, repeatable: must NOT contain this
mode: contains                  ← optional; default is exact output match (trailing spaces/newlines ignored)
expect:
7
```
````

Everything after the `expect:` line is the expected stdout. Without `expect:` the test only requires
`main` to return 0 without crashing. Use several tests with different `stdin` so hard-coding the
answer fails.

- ` ```hint ` blocks (1–3, revealed one at a time, progressively more concrete).
- ` ```explain ` shown after solving (optional for code, recommended for everything else).

### `predict` — "what does this print?"

- ` ```c code ` (optionally followed by ` ```stdin `). The expected answer is computed by **really running**
  the code, so it is always right. The student types the output.
- ` ```explain `.

### `quiz` — multiple choice

````
```options
- [ ] wrong answer
- [x] right answer (several [x] allowed → student must pick all of them)
```
````
plus ` ```explain `.

### `fill` — fill in the blanks

A ` ```c code ` block **or** a ` ```memory ` block containing `[[answer]]` blanks. Alternatives are
separated with `|`: `[[&x|& x]]`. Comparison ignores whitespace and case. For code, the code with the
first alternative filled in must compile and run. Optional ` ```test ` blocks also apply to the filled code.
Add ` ```explain `.

## Platform facts (this compiler: Clang targeting wasm32-wasi)

Verified in this environment — write lessons that agree with them:

| | |
|---|---|
| `sizeof`: char 1, short 2, **int 4**, **long 4**, long long 8, float 4, double 8, **pointers 4**, size_t 4 | |
| `INT_MAX` 2147483647 | `LONG_MAX` is also 2147483647 here (on a 64-bit PC it would be much larger) |
| Stack addresses look like `0xfff8`, `0xfff4`… (they count **down**); globals ~`0x10a28`; string literals ~`0x10021`; heap (`malloc`) ~`0x111e0` | addresses are small because this is a 32-bit WebAssembly machine; on a laptop they look like `0x7ffd5e8c1a4c` |
| `struct { char c; int i; double d; }` has sizeof 16 (padding!) | |
| Dereferencing `NULL` does **not** crash here (address 0 is valid WebAssembly memory) — on a real PC it is a segfault. Say so when you teach it. | |
| Integer division by zero traps → the app shows "integer division by zero" | |
| Out-of-bounds array access usually does not crash, it silently reads/writes neighbours — great for demonstrations | |
| `scanf` works with pre-supplied stdin; there is no interactive typing while the program runs | |
| Warnings flags: `-Wall -Wextra -std=c17`. Unused variables/parameters produce warnings. | |
| Use `%zu` for `sizeof`, `%p` with `(void *)` casts for addresses. | |

## Pedagogy rules

- The student is a **total beginner**. Introduce every term before using it. Short paragraphs. Concrete before abstract.
- Each section: explain → tiny runnable example → (often) an exercise straight away.
- 4–7 sections and **4–7 exercises per lesson**, mixing types (at least 2 `code` exercises per lesson; use
  `predict` and `fill`/memory exercises to make memory visible).
- Exercises must be solvable with only what has been taught so far (lesson order is in course.json).
- Programs print exactly what tests expect — specify the exact output format in the prompt (show it in a ```text block).
- Always `int main(void)` and `return 0;`. 4-space indentation. No `system()`, no files, no `getch`.
- Reference the docs: front-matter `docs:` plus inline links where a function is introduced.
