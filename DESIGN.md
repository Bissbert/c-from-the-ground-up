---
name: C, from the ground up
description: A beginner's C course drawn as an 80-column programmer's coding form.
colors:
  paper: "#f4f6f1"
  paper-raised: "#fafbf8"
  paper-sunk: "#edf2ec"
  form-green: "#1f6b4f"
  form-green-strong: "#17533d"
  form-soft: "#cfe3d6"
  form-faint: "#e3eee6"
  graphite: "#2b2e2c"
  graphite-2: "#48544d"
  graphite-3: "#5c6a62"
  red-pencil: "#b3261e"
  ochre: "#855600"
  highlighter: "#fff2b0"
typography:
  display:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.1em"
  code:
    fontFamily: "Atkinson Hyperlegible Mono, ui-monospace, monospace"
    fontSize: "0.9375rem"
    lineHeight: "1.5rem"
rounded:
  hairline: "1px"
  sm: "2px"
  md: "3px"
spacing:
  gutter-mobile: "16px"
  measure: "44rem"
  rail: "15.5rem"
  ident: "15rem"
components:
  button-primary:
    backgroundColor: "{colors.form-green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0.4rem 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.form-green-strong}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.form-green-strong}"
    rounded: "{rounded.md}"
    padding: "0.4rem 1rem"
  button-secondary-hover:
    backgroundColor: "{colors.form-faint}"
  exercise-box:
    backgroundColor: "{colors.paper-raised}"
    rounded: "{rounded.md}"
  blank-input:
    backgroundColor: "{colors.highlighter}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.hairline}"
---

# Design System: C, from the ground up

## Overview

**Creative North Star: "The Coding Form"**

The course is drawn as an IBM-style 80-column coding form: the pre-printed green sheet programmers wrote code on by hand before it was punched onto cards. The metaphor gives a beginner a physical, orderly place to put code, and it suits a course about how things sit in memory, cell by cell.

Reading is paper and graphite. Everything printed on the form is form green: the masthead fields, the 1–80 column ruler, the statement-number rail, cell rules and field labels. Two further marks appear only with meaning. A red pencil means a compiler error or a failed test. A yellow highlighter marks the memory cell or blank that matters right now. Density is calm (Read mode), and the exercises are an Operate core inside it.

**Key Characteristics:**
- A pre-printed form frame (masthead fields, column ruler, statement numbers, identification margin)
- Paper and graphite for reading; green only for the printed form
- Red and the highlighter carry meaning and are never decoration
- Memory, code and exercises are drawn as ruled form cells
- A single motion moment: the solved check mark draws itself

## Colors

A restrained, near-monochrome green-on-paper palette, with three meaning-bearing accents.

### Primary
- **Form Green** (#1f6b4f; dark #7cc9a3): all printed furniture (masthead, ruler, rail numbers, cell rules, labels), the primary action, and solved marks.
- **Form Green Strong** (#17533d; dark #9ad8b9): hover on primary actions, secondary-button text.

### Neutral
- **Paper** (#f4f6f1; dark #0f1713): the page ground.
- **Raised Paper** (#fafbf8; dark #142019): exercise boxes.
- **Sunk Paper** (#edf2ec; dark #0b120e): code sheets and consoles.
- **Form Soft / Form Faint** (#cfe3d6 / #e3eee6): inner cell rules / tinted pre-printed columns and hovers.
- **Graphite 1–3** (#2b2e2c, #48544d, #5c6a62): body text, secondary text, captions. Every tier is at least 4.5:1 on paper.

### Tertiary (meaning only)
- **Red Pencil** (#b3261e; dark #ff8f85): compiler errors and failing tests only.
- **Ochre** (#855600; dark #e8bb62): warnings, revealed answers, "careful" notes.
- **Highlighter** (#fff2b0; dark #3d3612): the hot memory row and the blank to fill.

### Named Rules
**The Red Pencil Rule.** Red appears only when the compiler or a test says something is wrong. It is never decoration, emphasis or branding.

**The Mark, Not Hue Rule.** Progress is shown by a mark (empty box, pencil tick, filled check, folded corner), never by colour alone.

## Typography

**Display Font:** Archivo, condensed to 75–85% (fallback Arial Narrow)
**Body Font:** Atkinson Hyperlegible Next (fallback system-ui)
**Label/Mono Font:** Atkinson Hyperlegible Mono (fallback ui-monospace)

**Character:** Condensed, printed-form lettering for the frame; maximum-legibility humanist text for the reading; a mono with a slashed zero so `0x2000` reads correctly.

### Hierarchy
- **Display** (700, clamp(2.25rem, 5vw, 3.5rem), 1.0, Archivo 75%): lesson titles; the home title runs larger, at clamp(2.75rem, 7vw, 5rem).
- **Title** (700, about 1.2rem): exercise titles and section heads in the reading face.
- **Body** (400, 1.0625rem, 1.65): theory text at a 44rem measure.
- **Label** (600, 0.6875rem, 0.1em tracking, uppercase, Archivo 75%): form field labels, column heads, button text.
- **Code** (0.9375rem on a 1.5rem ruled line): editors, examples, addresses, statement numbers, masthead values.

### Named Rules
**The Printed Label Rule.** Uppercase condensed Archivo is reserved for things printed on the form (fields, columns, buttons). It never sits above a heading as an eyebrow.

## Layout

There are three columns. The left statement-number rail (15.5rem) lists lessons 01–18. The centre sheet holds the reading column (44rem measure). The right identification margin (15rem) holds the lesson's contents with per-section tallies, plus its cppreference links. Below 1280px the identification margin folds away. Below 960px the rail becomes a drawer under the masthead with an ink scrim, closed by Escape, a tap outside or choosing a lesson. Below 560px the mobile gutter is 16px, with no horizontal page scroll down to 360px. The masthead is 4.75rem tall, with the 1–80 ruler printed under it.

## Elevation & Depth

Mostly flat: depth is conveyed by paper tone (raised, base, sunk) and 1px green rules. Only exercise boxes carry a faint ambient shadow, which lifts the working area off the sheet.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 6%, transparent), 0 6px 18px -10px color-mix(in srgb, var(--ink) 18%, transparent)`): exercise boxes only.
- **Fold** (`box-shadow: -1px 1px 1px color-mix(in srgb, var(--ink) 18%, transparent)`): the folded corner on the rail row where the learner stopped.

## Shapes

Almost square: 3px corners on boxes and buttons, 1–2px on marks and blanks. Borders are 1px green rules; cells divide with form-soft lines. Code sheets have faint horizontal ruled lines, one per line of code.

## Components

### Buttons
- **Shape:** nearly square (3px), minimum height 2.5rem.
- **Primary:** Form Green fill, paper text, condensed uppercase Archivo label, optional 24px stroke icon.
- **Hover / Focus:** darkens to Form Green Strong; a themed focus ring.
- **Secondary:** 1px green outline, transparent fill, Form Faint on hover. **Quiet:** text-only in graphite-2.

### Exercise box
- Headed by a green sequence cell (`05.3`), the type, the title and a solved box. Raised paper, 1px green border, sheet-lift shadow. Below the body come the toolbar (Check, Run, Hint, Show a solution, Start over), the feedback line, and a "Why" note revealed after solving.

### Inputs / Fields
- **Blanks:** highlighter fill with a green baseline rule, set in the mono face.
- **Editor:** a sunk code sheet with a green line-number gutter and ruled lines; error lines are marked in the gutter in red pencil.

### Navigation
- **Rail:** STMT / LESSON columns, part headers in small caps, and a mark per lesson. The active row fills its statement number in green; a folded corner marks where the learner stopped.

### Memory diagram
- Form cells: Address | Name | Type | Value | Note. The address column is tinted like a pre-printed column, and the row that matters gets the highlighter.

## Do's and Don'ts

### Do:
- **Do** draw every new piece of frame furniture in Form Green (#1f6b4f) with 1px rules.
- **Do** show state with marks (box, tick, check, fold) as well as colour.
- **Do** keep reading text in Atkinson Hyperlegible Next at a 44rem measure.
- **Do** honour `prefers-reduced-motion`; the check-mark draw is the only authored motion.

### Don't:
- **Don't** use red for anything but compiler errors and failed tests.
- **Don't** put eyebrow labels above headings, thick side-stripe callouts, gradient text or emoji.
- **Don't** round corners beyond 3px.
