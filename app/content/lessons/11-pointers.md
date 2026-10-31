---
id: pointers
title: Pointers
subtitle: A variable that holds the address of another variable, and why that is so useful.
minutes: 50
goals: Declare a pointer, take an address with & and follow it with *
goals: Draw memory diagrams where one box contains another box's address
goals: Write a swap function and other functions that change the caller's variables
goals: Use NULL, and avoid uninitialised and dangling pointers
docs: Pointer declaration | https://en.cppreference.com/w/c/language/pointer
docs: Address-of and indirection operators | https://en.cppreference.com/w/c/language/operator_member_access
docs: NULL | https://en.cppreference.com/w/c/types/NULL
docs: Functions | https://en.cppreference.com/w/c/language/functions
---

## A variable that stores an address

In the memory lesson you learned that every variable lives at an **address**, and that `&x` gives you that address. So far you could only print it. A **pointer** is a variable whose value *is* an address. It "points to" another variable.

```c run
#include <stdio.h>

int main(void) {
    int x = 42;
    int *p = &x;

    printf("x  = %d\n", x);
    printf("&x = %p\n", (void *)&x);
    printf("p  = %p\n", (void *)p);
    printf("&p = %p\n", (void *)&p);
    return 0;
}
```

Read the declaration `int *p = &x;` from right to left, slowly:

- `&x` is the address of `x`.
- `p` is a new variable.
- `int *` is its type: "pointer to `int`". The star is part of the type.
- So `p` is a variable that stores the address of an `int`, and we start it with the address of `x`.

In the output, `p` and `&x` print the **same** address, because `p` contains the address of `x`. And `&p` is a *different* address: the pointer is a variable too, with a box of its own. On this machine a pointer is 4 bytes (`sizeof(int *)` is 4), as large as an `int`.

Here is the memory at that moment:

```memory
caption: p holds the address of x
0xfff8  | x | int   | 42
0xfff4* | p | int * | 0xfff8 | the address of x
```

An arrow in your head helps: `p` ---> `x`. The box of `p` does not contain 42; it contains the *location* where 42 can be found.

> [!NOTE]
> All pointers are boxes of the same size, no matter what they point to. The type `int *` only tells the compiler what is *at* the address, so it knows how many bytes to read and how to interpret them.

:::exercise fill "Fill the pointer box"
After this code runs, `a` is at address `0x2000` and the pointer `q` is at `0x1ffc` (addresses made up). Fill in the memory.

```c
int a = 7;
int *q = &a;
```

```memory
caption: after the two declarations
0x2000 | a | int   | [[7]]
0x1ffc* | q | int * | [[0x2000]]
```

```explain
`a` holds 7. `q` was initialised with `&a`, the address of `a`, which is `0x2000`. The pointer's own address (`0x1ffc`) is a different thing from the address it stores.
```
:::

## Following the pointer: the * operator

To get to the thing a pointer points at, put a `*` in front of it. This is called **dereferencing**. `*p` means "the int that `p` points to". It works for both reading and writing, and `*p` behaves exactly like `x` itself:

```c run
#include <stdio.h>

int main(void) {
    int x = 10;
    int *p = &x;

    printf("*p = %d\n", *p);    // read through the pointer

    *p = 99;                    // write through the pointer
    printf("x  = %d\n", x);     // x has changed!

    *p = *p + 1;
    printf("x  = %d\n", x);
    return 0;
}
```

`*p = 99;` goes to the address stored in `p` and writes 99 there. Since that address is `x`'s box, `x` becomes 99. Nothing happened to `p` itself: it still points at `x`.

Two names for the same box are called **aliases**. Changing one changes "both", because there is only one box.

### The two meanings of *

The star appears in two different roles, and beginners often mix them up:

| Where | Meaning | Example |
|---|---|---|
| In a **declaration** | "this variable is a pointer" | `int *p;` |
| In an **expression** | "the thing pointed to" (dereference) | `*p = 5;` or `y = *p + 1;` |

And `&` is the opposite: it turns a variable into its address. `*&x` is just `x`.

> [!TIP]
> Read `int *p` as "`*p` is an `int`". That is exactly how the compiler thinks: dereferencing `p` gives an `int`.

:::exercise predict "Writing through a pointer"
What does this print?

```c code
#include <stdio.h>

int main(void) {
    int a = 5;
    int b = 8;
    int *p = &a;

    *p = *p * 2;
    p = &b;
    *p = *p + a;

    printf("%d %d\n", a, b);
    return 0;
}
```

```explain
First `p` points at `a`, so `*p = *p * 2` makes `a` equal to 10. Then `p = &b` makes `p` point at `b` (this changes the pointer, not any int). `*p = *p + a` makes `b = 8 + 10 = 18`.
```
:::

:::exercise quiz "Two stars"
In which of these lines does the `*` mean **dereference** (follow the pointer)?

```options
- [ ] `int *p = &x;`
- [x] `*p = 7;`
- [x] `y = *p + 1;`
- [ ] `int *q;`
```

```explain
In `int *p` and `int *q` the star is part of the declaration's type: it creates a pointer variable. In `*p = 7` and `*p + 1` the star is used in an expression and follows the pointer to the int it refers to.
```
:::

## Pointers as function parameters: swap

In the functions lesson you saw that a function only gets *copies*. So this function does nothing useful:

```c run
#include <stdio.h>

void swap_broken(int a, int b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int main(void) {
    int x = 1, y = 2;
    swap_broken(x, y);
    printf("x = %d, y = %d\n", x, y);   // still 1 and 2
    return 0;
}
```

The fix: give the function the **addresses** of `x` and `y`. The function still receives copies, but copies of *addresses*, and an address leads to the original box.

```c run
#include <stdio.h>

void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int main(void) {
    int x = 1, y = 2;
    swap(&x, &y);
    printf("x = %d, y = %d\n", x, y);
    return 0;
}
```

In the call `swap(&x, &y)`, the parameter `a` receives the address of `x` and `b` the address of `y`. Inside, `*a` *is* `x` and `*b` *is* `y`. Memory while `swap` is running (addresses made up):

```memory
caption: inside swap, before the first assignment
0xfff8  | x   | int   | 1      | main
0xfff4  | y   | int   | 2      | main
0xffe8  | a   | int * | 0xfff8 | swap: points to x
0xffe4  | b   | int * | 0xfff4 | swap: points to y
0xffe0* | tmp | int   | 1      | swap: = *a
```

This is **pass by pointer** (sometimes loosely called "pass by reference"). Strictly C still passes by value: the *pointer* is copied. But since the copy points to the same variable, the function can change it. This is also exactly what `scanf("%d", &x)` has been doing all along: you hand it the address so that it can write into `x`.

:::exercise code "Make a swap work"
Write `void swap(int *a, int *b)` that exchanges two integers. In `main`, read two integers, swap them with your function and print them as shown:

```text
a = 2, b = 1
```

(for the input `1 2`).

```c starter
#include <stdio.h>

void swap(int *a, int *b) {
    // exchange *a and *b using a temporary variable
    (void)a; (void)b;
}

int main(void) {
    int x, y;
    scanf("%d %d", &x, &y);
    // call swap here

    printf("a = %d, b = %d\n", x, y);
    return 0;
}
```

```c solution
#include <stdio.h>

void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int main(void) {
    int x, y;
    scanf("%d %d", &x, &y);
    swap(&x, &y);
    printf("a = %d, b = %d\n", x, y);
    return 0;
}
```

```test
name: 1 and 2
stdin: 1 2
source-has: swap(&
expect:
a = 2, b = 1
```

```test
name: negative numbers
stdin: -5 30
source-has: int *
expect:
a = 30, b = -5
```

```test
name: equal values
stdin: 4 4
source-has: swap(&
expect:
a = 4, b = 4
```

```hint
The parameters are pointers, so inside the function you work with `*a` and `*b`. Save one value first: `int tmp = *a;`.
```

```hint
`int tmp = *a; *a = *b; *b = tmp;` and call it with the addresses: `swap(&x, &y);`.
```
:::

:::exercise code "Change the caller's variable"
Write `void to_zero_if_negative(int *p)` that sets the integer `p` points to to `0` **only if** it is negative. In `main`, read two integers, call the function on each, and print:

```text
0 7
```

(for the input `-3 7`).

```c starter
#include <stdio.h>

void to_zero_if_negative(int *p) {
    // look at *p and maybe change it
    (void)p;
}

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    // call the function twice

    printf("%d %d\n", a, b);
    return 0;
}
```

```c solution
#include <stdio.h>

void to_zero_if_negative(int *p) {
    if (*p < 0) {
        *p = 0;
    }
}

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    to_zero_if_negative(&a);
    to_zero_if_negative(&b);
    printf("%d %d\n", a, b);
    return 0;
}
```

```test
name: first negative
stdin: -3 7
source-has: to_zero_if_negative(&
expect:
0 7
```

```test
name: both negative
stdin: -1 -2
source-has: int *p
expect:
0 0
```

```test
name: none negative
stdin: 5 0
expect:
5 0
```

```hint
Inside the function, `*p` is the integer. Test it with `if (*p < 0)`.
```

```hint
`if (*p < 0) { *p = 0; }`. In `main`, pass the addresses: `to_zero_if_negative(&a);`.
```
:::

## Pointers to pointers (briefly)

A pointer is a variable, so it has an address, and you can store *that* in another pointer. The type then gets a second star:

```c run
#include <stdio.h>

int main(void) {
    int x = 5;
    int *p = &x;
    int **pp = &p;

    **pp = 6;                   // follow twice: pp -> p -> x
    printf("x = %d\n", x);
    printf("*p = %d, **pp = %d\n", *p, **pp);
    return 0;
}
```

```memory
caption: three boxes, each pointing at the next (addresses made up)
0x1000  | x  | int    | 6
0x0ffc  | p  | int *  | 0x1000 | points to x
0x0ff8* | pp | int ** | 0x0ffc | points to p
```

You will rarely need this at first, but it appears whenever a function must change a *pointer* variable of its caller, for the same reason `swap` needs `int *` to change an `int`.

:::exercise fill "Follow the arrows"
Complete the program so it prints `30`: the function must write 30 into the variable `n` through the pointer.

```c code
#include <stdio.h>

void set_thirty(int [[*]]p) {
    [[*]]p = 30;
}

int main(void) {
    int n = 0;
    set_thirty([[&]]n);
    printf("%d\n", n);
    return 0;
}
```

```explain
The parameter must be a pointer (`int *p`), the assignment must go through it (`*p = 30`), and the caller must pass the address of `n` (`&n`).
```
:::

## NULL and the dangers of pointers

A pointer that points nowhere in particular should hold the special value `NULL` (from `<stddef.h>`, `<stdio.h>` and others). It means "this pointer points at nothing". Before dereferencing a pointer that might be `NULL`, check it:

```c run
#include <stdio.h>

void show(int id, int *p) {
    if (p == NULL) {
        printf("#%d: no value\n", id);
    } else {
        printf("#%d: %d\n", id, *p);
    }
}

int main(void) {
    int x = 12;
    show(1, &x);
    show(2, NULL);
    return 0;
}
```

`if (p == NULL)` can also be written `if (!p)`, because `NULL` counts as false.

> [!WARN]
> On a real PC, dereferencing `NULL` crashes the program immediately ("segmentation fault"), which is actually helpful: you find the bug right away. In this browser environment (WebAssembly) address 0 is ordinary valid memory, so `*NULL` does **not** crash here, it silently reads garbage. Never rely on this: always check for `NULL` first.

### The classic mistakes

- **Uninitialised pointer.** `int *p;` holds garbage, an address that points who-knows-where. Writing `*p = 5;` then scribbles over some random place in memory. Always give a pointer a value (`&something` or `NULL`) when you declare it.
- **Pointing to the wrong type.** An `int *` must point to an `int`. The compiler warns when you mix them up; don't ignore it.
- **Dangling pointer.** Returning the address of a *local* variable from a function: the variable (and its stack frame) is gone after the function returns, so the pointer leads to memory that will be reused.
- **Forgetting `*` or `&`.** `p = 5;` (instead of `*p = 5;`) tries to put the number 5 into the pointer as if it were an address.

```c
int *bad(void) {
    int local = 3;
    return &local;      // WRONG: local dies when bad() returns
}
```

:::exercise quiz "Safe or dangerous?"
Which of these are bugs?

```options
- [x] `int *p; *p = 5;`
- [ ] `int *p = NULL; if (p != NULL) { *p = 5; }`
- [x] `int *f(void) { int v = 1; return &v; }`
- [ ] `int v = 1; int *p = &v; *p = 5;`
```

```explain
The first writes through a pointer that was never given a value. The third returns the address of a local variable that no longer exists once `f` returns. The second checks for `NULL` before dereferencing, and the fourth is the normal, correct use.
```
:::
