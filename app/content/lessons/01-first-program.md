---
id: first-program
title: Your first program
subtitle: What a program is, what a compiler does, and how to make the computer say something.
minutes: 20
goals: Explain what a program and a compiler are
goals: Write, compile and run a program that prints text
goals: Read a compiler error message without panicking
docs: printf | https://en.cppreference.com/w/c/io/fprintf
docs: main function | https://en.cppreference.com/w/c/language/main_function
docs: Escape sequences | https://en.cppreference.com/w/c/language/escape
docs: Comments | https://en.cppreference.com/w/c/comment
---

## What is a program?

A computer is a very fast, very obedient machine that understands only one thing: long lists of tiny instructions like "add these two numbers" or "copy this value over there". A **program** is such a list of instructions.

Nobody wants to write those tiny instructions by hand. So we write in a **programming language** — text that humans can read — and a tool called a **compiler** translates that text into instructions the machine can run.

C is one of the oldest languages still in everyday use (it was created around 1972). Your operating system, your phone's firmware and the software in your car are full of C. It is close to the machine: when you learn C, you also learn how a computer really works inside — and that is exactly why we are learning it.

> [!NOTE]
> In this course the compiler is **Clang**, running right here in your browser. When you press **Run**, your text is compiled into a real program, which is then executed. Nothing is simulated.

## The smallest useful program

Here is a complete C program. Press **Run** to compile and run it.

```c run
#include <stdio.h>

int main(void) {
    printf("Hello, world!\n");
    return 0;
}
```

Every piece matters. Let's go through it line by line:

| Line | What it means |
|---|---|
| `#include <stdio.h>` | "Please give me the standard input/output tools." `printf` lives there. |
| `int main(void) {` | Every C program starts running at a function called `main`. |
| `printf("Hello, world!\n");` | Print the text between the quotes. |
| `return 0;` | Tell the operating system "I finished without problems". |
| `}` | End of `main`. |

The text between double quotes, `"Hello, world!\n"`, is called a **string**. The `\n` at the end is a special pair of characters that means *new line* — like pressing Enter.

> [!TIP]
> Notice the **semicolon** `;` after each instruction. In C, a semicolon ends a *statement*, the way a full stop ends a sentence. Forgetting one is the most common beginner mistake.

:::exercise quiz "Where does it start?"
When you run a C program, where does the computer start executing your code?

```options
- [ ] At the first line of the file
- [x] At the beginning of the function called `main`
- [ ] At the `#include` line
- [ ] At the `return 0;` line
```

```explain
Execution always begins at `main`, no matter where it sits in the file. The `#include` line is not an instruction that runs at all; it is processed *before* compiling, to pull in the declarations of `printf` and friends.
```
:::

## Printing more than one line

You can call `printf` as often as you want. Each call prints exactly what you give it — nothing more. If you forget `\n`, the next text continues on the same line.

```c run
#include <stdio.h>

int main(void) {
    printf("one ");
    printf("two\n");
    printf("three\nfour\n");
    return 0;
}
```

A few other escape sequences you will meet:

| Write | You get |
|---|---|
| `\n` | a new line |
| `\t` | a tab (a wide space) |
| `\"` | a double quote inside a string |
| `\\` | a single backslash |

:::exercise predict "Read like a computer"
What exactly does this program print? Type the output line by line, exactly as it would appear.

```c code
#include <stdio.h>

int main(void) {
    printf("C is ");
    printf("fun\n");
    printf("really\nfun\n");
    return 0;
}
```

```explain
`printf` only moves to a new line where you write `\n`. The first two calls together build the line `C is fun`; the third prints two lines.
```
:::

:::exercise code "Say hello"
Write a program that prints exactly these two lines:

```text
Hello, C!
I am learning to program.
```

```c starter
#include <stdio.h>

int main(void) {
    // write your printf calls here

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    printf("Hello, C!\n");
    printf("I am learning to program.\n");
    return 0;
}
```

```test
name: prints both lines
expect:
Hello, C!
I am learning to program.
```

```hint
You need two `printf` calls (or one with a `\n` in the middle). Every line ends with `\n`.
```

```hint
Copy the text *exactly* — capital letters, the comma and the full stop all count.
```
:::

## Comments: notes for humans

Text after `//` until the end of the line is a **comment**. The compiler ignores it completely. Longer comments go between `/*` and `*/`. Use comments to explain *why* your code does something.

```c run
#include <stdio.h>

/* This program greets the reader.
   It was written while learning C. */
int main(void) {
    printf("Hi!\n");   // print a greeting
    // printf("This line is switched off.\n");
    return 0;
}
```

## When the compiler complains

The compiler is strict. If your text breaks the rules of C, it refuses to produce a program and prints an **error message**. This is normal; professionals see errors all day. Run this broken program and read what Clang says:

```c run error
#include <stdio.h>

int main(void) {
    printf("Missing something?\n")
    return 0;
}
```

An error message has a shape: `main.c:4:35: error: expected ';' after expression`. That means **file** `main.c`, **line** 4, **column** 35, then a description. Always read the *first* error first — later errors are often just consequences of it.

> [!WARN]
> Errors stop compilation. **Warnings** don't, but they mean "this is legal, but it is probably not what you meant". Treat warnings as bugs.

:::exercise code "Fix the program"
This program has three mistakes. Run it, read the errors, and fix them until it prints `Fixed it!`.

```c starter
#include <stdio.h>

int main(void) {
    printf("Fixed it!\n")
    return 0
```

```c solution
#include <stdio.h>

int main(void) {
    printf("Fixed it!\n");
    return 0;
}
```

```test
name: prints the message
expect:
Fixed it!
```

```hint
Look for missing semicolons. There are two.
```

```hint
Every `{` needs a matching `}`. Where does `main` end?
```
:::

:::exercise fill "Complete the skeleton"
Fill in the blanks so the program prints `Ready.` followed by a new line.

```c code
#include <[[stdio.h]]>

int [[main]](void) {
    printf("Ready.[[\n]]");
    return [[0]];
}
```

```explain
`stdio.h` provides `printf`, the program starts at `main`, `\n` ends the line, and `return 0;` reports success.
```
:::
