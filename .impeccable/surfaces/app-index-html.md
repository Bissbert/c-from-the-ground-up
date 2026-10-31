---
version: 1
slug: "app-index-html"
primary_target: "app/index.html"
related_targets: []
---

# Surface: course app (lesson reader + exercises)

Mode: Read (lessons) with an Operate core (editor, run, tests). Audience: one total beginner at a laptop, evening at a home desk; course in English. Job: read a short theory section, then immediately solve the exercise under it, checked by a real compiler. Constraint: local, offline, no accounts; ~105 MB compiler loads from localhost with visible progress. User was away: direction chosen unattended from the roll (assigned candidate), no decision page served.

## Direction contract

Replaced on 2026-10-31. The user compared four full redesigns (Steeple, Poster, Crystal, Terminal) and chose Terminal, after bissbert.ch. They then asked for the working prompt to be removed because it might confuse beginners. The previous coding-form direction is retired; DESIGN.md holds the current system.

THESIS: The course is one calm shell session on a phosphor terminal. A tmux window bar sits on top, the home page is a neofetch print-out, each lesson opens with `cat NN-slug.md`, and a vim-style status line sits at the bottom. It is a costume, not a shell: nothing accepts typed commands.

OWN-WORLD: Near-black screen with phosphor green for the frame and ANSI cyan, amber, magenta and red, each with one meaning. VT323 for the frame and headings, JetBrains Mono for reading and code. Square corners, a scanline overlay, no glow. Dark only.

STORY: The learner sees where they are in the window bar and status line, reads one section, solves the exercise below it, sees the real compiler's verdict and moves on.

FIRST VIEWPORT: On home, the neofetch art on the left and the course facts on the right, with "Continue NN" and "Playground" links and the `ls -l` lesson list below. On a lesson, the prompt line, the title, the facts, a TODO list of goals, then the reading column. On wide screens an outline pane on the right holds `ls in this lesson` and `ls c reference`.
