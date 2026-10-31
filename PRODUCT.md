# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: no-build vanilla HTML/CSS/JS (ES modules) served by a dependency-free Node static server (`npm start`). Real C compilation happens in the browser via `@yowasp/clang` (Clang/LLD compiled to WebAssembly, targeting wasm32-wasi) with `@bjorn3/browser_wasi_shim` to run the student's program. Everything works offline once installed. Chosen because the user asked for "C in browser if possible or a container".

## Users

One primary learner (a total beginner, never programmed before), studying on their own at a laptop, guided by a teacher who set the course up. Course language: English. They read a short piece of theory, then immediately solve an exercise on it.

## Product Purpose

A local, self-paced course on the basics of programming in C: from what a program and an `int` are, through variables, memory and addresses, assignment, operators, control flow, functions, arrays, pointers, strings, structs, up to dynamic memory. Success = the learner can read and write small C programs and explain what happens in memory.

## Positioning

Theory and practice are welded together: every lesson ends in an exercise checked by a real C compiler running in the browser (real error messages, real output), plus memory-model exercises that make addresses and bytes visible. References point to the C standard library docs (cppreference.com C section).

## Constraints

- Runs locally, no accounts, no cloud. Progress stored in the browser (localStorage).
- First load fetches ~105 MB of compiler from localhost; must show progress.
- Inferred (user was away): exact lesson list and difficulty curve were authored by the assistant.
