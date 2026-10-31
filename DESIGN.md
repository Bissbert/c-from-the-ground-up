---
name: C, from the ground up
description: A beginner's C course drawn as one calm shell session on a phosphor terminal, after bissbert.ch.
colors:
  screen: "#0b0c0b"
  screen-raised: "#111411"
  screen-sunk: "#070807"
  phosphor: "#3ddc4a"
  phosphor-strong: "#7cf08a"
  phosphor-soft: "#24402a"
  phosphor-faint: "#142017"
  ink: "#dbe9d8"
  ink-2: "#b2c7af"
  ink-3: "#8ba487"
  on-phosphor: "#071007"
  cyan: "#2cb2ff"
  amber: "#ffb000"
  magenta: "#c879ff"
  red: "#ff5f56"
typography:
  display:
    fontFamily: "VT323, ui-monospace, monospace"
    fontSize: "clamp(3rem, 6.5vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 0.95
  heading:
    fontFamily: "VT323, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "VT323, ui-monospace, monospace"
    fontSize: "1.3rem"
    fontWeight: 400
    textTransform: "uppercase"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.9375rem"
    lineHeight: "1.5rem"
rounded:
  none: "0"
spacing:
  gutter-mobile: "16px"
  measure: "46rem"
  bar: "2.25rem"
  status: "1.85rem"
components:
  button-primary:
    backgroundColor: "{colors.phosphor}"
    textColor: "{colors.on-phosphor}"
    rounded: "{rounded.none}"
    padding: "0.25rem 0.6rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.phosphor-strong}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.phosphor}"
    borderColor: "{colors.phosphor}"
    rounded: "{rounded.none}"
  exercise-box:
    backgroundColor: "transparent"
    borderColor: "{colors.phosphor}"
    rounded: "{rounded.none}"
  blank-input:
    backgroundColor: "{colors.screen-sunk}"
    textColor: "{colors.amber}"
    borderColor: "{colors.amber}"
---

# Design System: C, from the ground up

## Overview

The whole course reads as one shell session on a phosphor terminal, borrowed from bissbert.ch. A tmux window bar runs along the top (`0:home  1:05*  2:play`), the home page is a `neofetch` print-out, each lesson opens with `cat 05-memory-and-addresses.md` and a vim-style status line sits at the bottom.

**It is a costume, not a shell.** Nothing on the page can be typed into except the editors and answer fields, and every piece of terminal furniture is a plain link or a read-only readout. An earlier version had a working prompt and it confused beginners about what was real, so it was removed on purpose. Do not bring it back.

The site is dark only. The phosphor-on-black world is the identity; a light variant would be a separate design, not a toggle.

**Key characteristics**
- One screen colour, one phosphor green for frame furniture and primary actions, ANSI colours for meaning.
- Two fonts: VT323 for the frame and headings, JetBrains Mono for reading and code.
- No radius, no shadows, no glow. Depth comes from 1px rules and a faint scanline overlay.
- Shell idiom carries the structure. `#` and `##` mark headings, `[ ]` marks todo items and `//` marks a subtitle.

## Colors

The ANSI palette is deliberate here and comes from bissbert.ch: each hue is a role, never decoration.

### Primary
- **Phosphor** `#3ddc4a`: the window bar, primary buttons, exercise frames, display headings and the active selection.
- **Phosphor strong** `#7cf08a`: hover only.

### Neutral
- **Screen** `#0b0c0b`, with raised `#111411` and sunk `#070807`, for the page and its wells.
- **Ink** `#dbe9d8` for body text, with **ink-2** `#b2c7af` and **ink-3** `#8ba487` for quieter text. Every pairing stays at WCAG AA on the screen colour.
- **Phosphor soft** `#24402a` and **faint** `#142017` for inner rules, the status file chip and hover fills.

### ANSI roles
- **Cyan** `#2cb2ff`: links and field names (`lesson:`, `Course:`).
- **Amber** `#ffb000`: `##` section headings, `[ ]` todo marks, fill-in blanks and the focus ring.
- **Magenta** `#c879ff`: the path in a prompt line and the C keyword colour.
- **Red** `#ff5f56`: compiler errors and the reset action, nothing else.

### Named Rules
- **One meaning per hue.** If amber means "you can type here" or "look here", it never also means "warning".
- **Green is the frame.** Content text is ink, never phosphor.

## Typography

- **VT323** (self-hosted, latin and latin-ext): the window bar, the status line, buttons, display and section headings. It is always 400 weight, because the pixel face has no bold.
- **JetBrains Mono 2.304** (self-hosted, variable 100–800, plus italic): body text, code and the ASCII art. The subset keeps the box-drawing and block range (U+2500–25FF) because the `╔═╗` and `█` logo is drawn with it. Google's subsets drop that range, which is why the font is built from the official release.

### Hierarchy
- Display: VT323 at `clamp(3rem, 6.5vw, 4.5rem)`, line-height 0.95, phosphor.
- Section heading: VT323 at 1.5rem, amber, prefixed by a dim `##`.
- Body: JetBrains Mono at 0.95rem with line-height 1.75 and a 46rem measure.
- Code: JetBrains Mono at 0.9375rem on a 1.5rem line grid.

### Named Rules
- **The logo snaps to the pixel.** It uses stepped sizes (40, 30 and 25px), never a fluid clamp, so the 0.6em cells stay whole. A 0.6px same-colour text-shadow closes antialias seams between `█` cells.

## Layout

- A sticky tmux bar (2.25rem) sits on top and a fixed status line (1.85rem) at the bottom. The body pads for both.
- Lessons use a single 46rem column. From 1280px up, an outline pane on the right lists `ls in this lesson` and `ls c reference`.
- The home page puts the neofetch art in a left column, the facts in a right column and the `ls -l` lesson list below.
- Phones (≤560px):
  - the lesson window shrinks to its number (`1:05*`);
  - the bracket links are hidden and the art stacks above the facts;
  - the status line keeps only the file name and the solved count.
- Keep a 16px side gutter, and never let the page scroll sideways.

## Elevation & Depth

The page is flat. The only layering is the scanline overlay (`body::after`, a 3px repeating gradient at 22% black, `pointer-events: none`) and the 1px phosphor rules.

### Shadow Vocabulary
- `inset 0 0 0 3px screen, inset 0 0 0 4px phosphor-soft`: the double-rule frame on exercise boxes. Nothing else uses `box-shadow`. There is no `text-shadow` glow; the logo's 0.6px seam fix is not a glow.

## Shapes

Every shape is square, with radius 0 everywhere. Brackets stand in for button outlines: buttons render as `[ CHECK ]` through `::before` and `::after`.

## Components

### Buttons
- VT323 uppercase at 1.43rem, wrapped in `[ ]`, with a minimum height of 2.25rem.
- Primary: a phosphor fill with on-phosphor text.
- Secondary: a 1px phosphor border.
- Quiet: ink-2 text.
- Danger: red text.

### Exercise box
- A 1px phosphor border with the inset double rule.
- Solved state follows the existing `.is-solved` hooks.

### Inputs / Fields
- Fill-in blanks: a sunk background with an amber border and amber text.
- Editors: the screen colour with a phosphor rule and a dim line-number gutter.

### Navigation
- Window bar: `[c]`, numbered windows with the active one inverted, then `[ PREV ] [ NEXT ] [ LESSONS ]` on the right.
- Status line:
  - the file chip, the lesson's part and the clang state;
  - `n/112 solved`;
  - the scroll position (`Top` / `42%` / `Bot` / `All`).
- Every navigation item is a link. Nothing accepts commands.

### Memory diagram
Rows of cells in JetBrains Mono, addresses in ink-3 and the highlighted cell in the `--hot` amber wash.

## Do's and Don'ts

### Do:
- Use shell idiom for structure: prompts, `cat`, `ls -l`, `#` headings, `[ ]` todos.
- Keep every terminal element clickable or read-only and self-explanatory to someone who has never used a shell.
- Respect `prefers-reduced-motion`: the scanline overlay is switched off.

### Don't:
- Add a real prompt, typed commands or keyboard-only navigation.
- Add glows, gradients, rounded corners or drop shadows.
- Use phosphor for body text, or red for anything but errors and reset.
- Add a light theme toggle to this design.
