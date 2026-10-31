---
id: memory-and-addresses
title: Memory and addresses
subtitle: Memory is a long street of numbered bytes, and every variable lives at an address.
minutes: 35
goals: Picture memory as a row of numbered bytes
goals: Read simple hexadecimal addresses
goals: Get a variable's address with & and print it with %p
goals: Work out where neighbouring variables live from their sizes
goals: Explain why assignment copies a value and not the box
docs: sizeof | https://en.cppreference.com/w/c/language/sizeof
docs: printf (%p) | https://en.cppreference.com/w/c/io/fprintf
docs: Address-of and indirection operators | https://en.cppreference.com/w/c/language/operator_member_access
docs: Integer constants | https://en.cppreference.com/w/c/language/integer_constant
---

## Memory is a long street

In lesson 2 we drew variables as boxes. Now let's look at what the boxes really are.

The memory of your computer is a gigantic row of **bytes**, like a very long street where every house holds exactly one byte. Every house has a number, its **address**. The first house has address 0, the next 1, then 2, and so on.

```text
address:   0    1    2    3    4    5    6    7    8   ...
         [ . ][ . ][ . ][ . ][ . ][ . ][ . ][ . ][ . ]
```

Every house holds one byte, which is a number from 0 to 255. Bigger things are stored in several houses next to each other. An `int` takes 4 bytes, so a variable of type `int` occupies **four houses in a row**.

The address of a variable is the address of its **first** byte. That is the number the computer uses to find the variable: the name `age` in your source code is just a friendly label for such an address.

> [!NOTE]
> Addresses are not magic: they are ordinary numbers. A big part of C is knowing that every variable has one, and that you can ask for it.

## Hexadecimal, gently

Addresses are usually written in **hexadecimal** ("hex"), a number system with 16 digits instead of 10. After `0` to `9` it uses the letters `a` to `f` for the values ten to fifteen:

| Hex digit | `a` | `b` | `c` | `d` | `e` | `f` |
|---|---|---|---|---|---|---|
| Value | 10 | 11 | 12 | 13 | 14 | 15 |

In C a hex number starts with `0x`, so you can tell it from a normal number. Counting in hex goes like this:

```text
0x8  0x9  0xa  0xb  0xc  0xd  0xe  0xf  0x10  0x11 ... 0x1f  0x20
```

After `0xf` (15) comes `0x10`, which is **sixteen**. Why hex? Because one hex digit stands for exactly 4 bits, so bytes and addresses line up neatly. Each position is worth 16 times the one to its right:

```text
0x10   =  1 * 16 + 0        = 16
0x1c   =  1 * 16 + 12       = 28
0x100  =  1 * 256           = 256
0x1000 =  1 * 4096          = 4096
```

You do **not** need to convert hex to decimal in your head. You only need to be able to add small numbers: `0x1000 + 4` is `0x1004`, and `0x1008 + 4` is `0x100c` (because `8 + 4 = 12 = c`). The only trap is carrying: `0x100c + 4` is `0x1010`.

:::exercise quiz "Counting in hex"
What comes right after `0x1009`?

```options
- [ ] `0x1010`
- [x] `0x100a`
- [ ] `0x1100`
- [ ] `0x10010`
```

```explain
The digits go 8, 9, a, b, c, d, e, f. After 9 comes `a`; you only carry to the next position after `f`. So `0x1009` is followed by `0x100a`, and `0x100f` is followed by `0x1010`.
```
:::

## The address-of operator &

C lets you ask any variable where it lives. The operator **`&`** in front of a variable name means "the address of". `&age` is the address of the first byte of `age`.

To print an address, use the specifier **`%p`** (p for *pointer*) and cast the address to `(void *)`. The cast is a technicality for now; just write it as shown.

```c run
#include <stdio.h>

int main(void) {
    int age = 25;
    printf("value   : %d\n", age);
    printf("address : %p\n", (void *)&age);
    printf("size    : %zu bytes\n", sizeof age);
    return 0;
}
```

The program tells us the value, where it lives, and how many houses it occupies. You will see an address like `0xfff8` or `0xfff4`. Your computer at home would print something much longer, like `0x7ffd5e8c1a4c`, because real PCs have far more memory (this machine is a small 32-bit WebAssembly machine).

```memory
caption: What the program above created (the real address may differ slightly)
0xfff8* | age | int | 25 | 4 bytes: 0xfff8, 0xfff9, 0xfffa, 0xfffb
```

Careful: `&` here gives the address; it is not the same as the "and" operator you may meet later. In front of a single name it always means "address of".

:::exercise code "Where do you live?"
Declare `int x = 42;`. Print one line with this shape. The address will differ, only the part before it is checked:

```text
x occupies 4 bytes at 0xfff8
```

Use `sizeof x` for the number of bytes and `%p` with `(void *)&x` for the address.

```c starter
#include <stdio.h>

int main(void) {
    int x = 42;

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int x = 42;
    printf("x occupies %zu bytes at %p\n", sizeof x, (void *)&x);
    return 0;
}
```

```test
name: prints size and an address
mode: contains
source-has: &x
source-has: sizeof
expect:
x occupies 4 bytes at 0x
```

```hint
You need two placeholders in one `printf`: `%zu` for the size and `%p` for the address.
```

```hint
`printf("x occupies %zu bytes at %p\n", sizeof x, (void *)&x);`
```
:::

## A variable covers several bytes

An `int` at address `0x1000` occupies the four bytes `0x1000`, `0x1001`, `0x1002` and `0x1003`. The *next* free house is `0x1004`, so the next `int` can start there.

```text
address:   0x1000 0x1001 0x1002 0x1003 | 0x1004 0x1005 0x1006 0x1007
           [   first int, 4 bytes     ] [   second int, 4 bytes    ]
```

The rule is simple: **a variable at address A with size S covers the addresses A up to A + S - 1**. The next one can begin at A + S.

```memory
caption: Made-up addresses to practise with
0x1004 | b | int  | 7
0x1000 | a | int  | 5
```

Different types take different amounts of room: a `char` takes 1 byte, a `short` 2, an `int` 4 and a `double` 8.

:::exercise fill "Where does the next one start?"
An `int` called `a` lives at `0x1000`. These are made-up addresses. Fill in the address where the next `int` can start, and the address of its last byte.

```memory
caption: Two ints back to back
0x1000 | a | int | 5 | first byte of a
[[0x1004]] | b | int | 7 | starts right after a
```

```explain
`a` is 4 bytes and covers `0x1000` to `0x1003`. The next free byte is `0x1004`, which is where `b` starts. `b` covers `0x1004` to `0x1007`.
```
:::

## Neighbours on the stack

Variables that you declare inside `main` live in a part of memory called the **stack**. Let's see where two ints end up.

```c run
#include <stdio.h>

int main(void) {
    int a = 5;
    int b = 7;
    printf("a at %p holds %d\n", (void *)&a, a);
    printf("b at %p holds %d\n", (void *)&b, b);
    return 0;
}
```

Look at the two addresses: they are exactly 4 apart because an `int` takes 4 bytes, and they are probably packed tightly together. And notice the direction: the variable declared **later** gets the **lower** address. On most computers the stack **grows downwards**: new variables are placed at smaller and smaller addresses.

```memory
caption: Roughly what the stack looks like (the real addresses depend on the compiler)
0xfff8 | a | int | 5
0xfff4* | b | int | 7
```

> [!NOTE]
> The C language does not promise the order or the spacing of variables. A different compiler may arrange them differently. But looking at this typical pattern is the best way to build intuition.

:::exercise fill "Stack neighbours"
On a downward-growing stack, `a` is declared first and sits at `0x1008`. Then `b` and `c` (both `int`) are declared. Fill in their addresses (made-up numbers).

```memory
caption: Stack, highest address on top
0x1008 | a | int | 1
[[0x1004]] | b | int | 2
[[0x1000]] | c | int | 3
```

```explain
Each `int` is 4 bytes and the stack counts down: `0x1008 - 4 = 0x1004` for `b`, and `0x1004 - 4 = 0x1000` for `c`.
```
:::

## Assignment copies the value, not the box

Now we can state something precisely. In `b = a;` the program reads the value stored in the box `a` and **copies** it into the box `b`. The two boxes stay at their own, different addresses.

```c run
#include <stdio.h>

int main(void) {
    int a = 5;
    int b = a;
    a = 99;
    printf("a = %d, b = %d\n", a, b);
    printf("a lives at %p, b lives at %p\n", (void *)&a, (void *)&b);
    return 0;
}
```

`b` still holds 5: it got a copy of the old value, and later changes to `a` do not affect it. The last line shows that the two addresses differ, so they are two different boxes.

```memory
caption: After b = a and then a = 99
0xfff8 | a | int | 99
0xfff4* | b | int | 5
```

:::exercise predict "Copy or share?"
What does this program print?

```c code
#include <stdio.h>

int main(void) {
    int x = 10;
    int y = x;
    y = y + 5;
    x = x * 2;
    printf("%d %d\n", x, y);
    return 0;
}
```

```explain
`y` starts as a copy of 10 and becomes 15. `x` is doubled to 20. They never influenced each other because they are separate boxes with separate addresses.
```
:::

:::exercise quiz "Reading addresses"
An `int` named `n` is stored at address `0x2000`. Which statements are true? Pick all that apply.

```options
- [x] `&n` is `0x2000`
- [x] `n` occupies `0x2000`, `0x2001`, `0x2002` and `0x2003`
- [ ] `n` occupies only the single byte `0x2000`
- [ ] The next `int` on a downward-growing stack is stored at `0x2004`
- [x] The next `int` on a downward-growing stack could be stored at `0x1ffc`
```

```explain
The address of a variable is the address of its first byte, and an `int` takes 4 bytes. On the downward-growing stack the next variable is placed *below*: `0x2000 - 4 = 0x1ffc`.
```
:::

:::exercise code "Two boxes, two addresses"
Declare `int a = 1;` and `int b = a;`. Then print exactly this on one line, which shows that copying does not make `b` an alias for `a`:

```text
a=1 b=1
```

Then change `a` to `100` (with an assignment) and print another line:

```text
a=100 b=1
```

```c starter
#include <stdio.h>

int main(void) {
    int a = 1;

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int a = 1;
    int b = a;
    printf("a=%d b=%d\n", a, b);
    a = 100;
    printf("a=%d b=%d\n", a, b);
    return 0;
}
```

```test
name: copy stays independent
source-has: int b = a
expect:
a=1 b=1
a=100 b=1
```

```hint
`b = a` copies the value at that moment. After that, they are separate boxes.
```

```hint
Print once with both values, assign `a = 100;`, print again with the same format.
```
:::
