---
id: reading-input
title: Reading input
subtitle: Let the user give your program numbers with scanf, and see why it needs an address.
minutes: 30
goals: Read an int with scanf("%d", &x) and explain why the & is needed
goals: Read several values, including doubles with %lf
goals: Check scanf's return value to detect bad or missing input
goals: Use the stdin box of this app to supply input in advance
docs: scanf | https://en.cppreference.com/w/c/io/fscanf
docs: printf | https://en.cppreference.com/w/c/io/fprintf
docs: Arithmetic types | https://en.cppreference.com/w/c/language/arithmetic_types
---

## Input from outside

So far every value was written into the source code. Real programs read data: a number typed by the user, a file, a message. In C the standard way to read formatted text is the function **`scanf`**, the mirror image of `printf`. Where `printf` sends values out, `scanf` takes values in.

The input arrives through **standard input**, short **stdin**. On a real computer stdin is normally the keyboard, and the program stops and waits while you type. In this course the program runs in your browser and cannot ask questions while it runs. Instead, you fill in the **stdin box** under the editor *before* pressing Run, and the program reads from it as if somebody had typed it.

> [!NOTE]
> Every runnable example in this lesson that reads input comes with its stdin box pre-filled. Change the numbers and run again to see what happens.

## scanf and the ampersand

Here is a program that reads one integer and doubles it:

```c run
#include <stdio.h>

int main(void) {
    int x;
    scanf("%d", &x);
    printf("%d doubled is %d\n", x, x * 2);
    return 0;
}
```

```stdin
21
```

Look at the call `scanf("%d", &x);`:

- `"%d"` is the **format**. It says "expect a decimal integer". It uses the same specifiers you know from `printf`.
- `&x` is **the address of `x`**.

Why the `&`? Think back to lesson 5. When you call `printf("%d", x)`, the function only needs a *copy of the value* of `x`. But `scanf` has a different job: it must **put a new value into your variable**. If you handed it a copy of the value, it would have no way of reaching your box. So you hand it the *address* of the box, and `scanf` writes the number into the bytes that start at that address.

```memory
caption: scanf receives the address and stores the number there
0xfff8* | x | int | 21 | scanf wrote here, because we passed &x
```

Forgetting the `&` is the most common `scanf` mistake. Without it, `scanf` receives the (garbage) value of `x` and treats it as an address, which is a bug.

> [!WARN]
> `printf("%d", x)` takes the **value**. `scanf("%d", &x)` takes the **address**. If you remember only one thing about `scanf`, remember this.

:::exercise quiz "Why the &?"
Why does `scanf("%d", &x)` need the `&` in front of `x`?

```options
- [ ] The `&` tells `scanf` that the number is an integer
- [x] `scanf` has to store the input into the variable, so it needs to know where in memory the variable is
- [ ] The `&` makes the input faster
- [ ] It is just a habit, the program works without it as well
```

```explain
A function that receives only a copy of the value can never change the original variable. By passing the address, `scanf` knows which bytes to overwrite. The type is told by `%d`, not by the `&`.
```
:::

:::exercise code "Triple it"
Read one integer and print three times its value, in exactly this format (shown for the input `5`):

```text
15
```

```c starter
#include <stdio.h>

int main(void) {
    int n;

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    printf("%d\n", n * 3);
    return 0;
}
```

```test
name: input 5
stdin: 5
source-has: scanf
expect:
15
```

```test
name: input -4
stdin: -4
expect:
-12
```

```test
name: input 0
stdin: 0
expect:
0
```

```hint
Call `scanf("%d", ...)` first, then print.
```

```hint
`scanf("%d", &n);` stores the input into `n`. Then `printf("%d\n", n * 3);`
```
:::

## Reading several values

Give `scanf` several specifiers and several addresses, in the same order. Input values are separated by whitespace (spaces, tabs or new lines), and `%d` skips any leading whitespace by itself, so it does not matter whether the numbers come on one line or on several.

```c run
#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("sum = %d\n", a + b);
    printf("product = %d\n", a * b);
    return 0;
}
```

```stdin
6 7
```

Try typing the two numbers on separate lines in the stdin box; the program behaves the same.

:::exercise code "Rectangle"
Read the width and the height of a rectangle (two integers), then print its area and its perimeter, one per line, exactly like this (for `3 5`):

```text
area=15
perimeter=16
```

```c starter
#include <stdio.h>

int main(void) {
    int w, h;

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int w, h;
    scanf("%d %d", &w, &h);
    printf("area=%d\n", w * h);
    printf("perimeter=%d\n", 2 * (w + h));
    return 0;
}
```

```test
name: 3 by 5
stdin: 3 5
expect:
area=15
perimeter=16
```

```test
name: 10 by 1 on separate lines
stdin: 10\n1
expect:
area=10
perimeter=22
```

```test
name: square
stdin: 7 7
expect:
area=49
perimeter=28
```

```hint
`scanf("%d %d", &w, &h);` reads both numbers; the first goes to `w`, the second to `h`.
```

```hint
The perimeter is `2 * (w + h)`. Remember the parentheses.
```
:::

## Reading doubles

For a `double` the specifier changes. This is a quirk of C you simply have to remember:

| Type | `printf` | `scanf` |
|---|---|---|
| `int` | `%d` | `%d` |
| `double` | `%f` | **`%lf`** |
| `char` | `%c` | `%c` |

In `scanf` the letter `l` ("long float") is **required** for `double`. With plain `%f` it would store a smaller `float`, and your `double` would be filled wrongly.

```c run
#include <stdio.h>

int main(void) {
    double price;
    int count;
    scanf("%lf %d", &price, &count);
    printf("total = %.2f\n", price * count);
    return 0;
}
```

```stdin
2.5 4
```

Mixing types is no problem: the format string describes, left to right, what to read and where each item goes.

:::exercise fill "Fill in the scanf"
Complete the program so it reads a temperature in Celsius (a `double`) and prints it in Fahrenheit.

```c code
#include <stdio.h>

int main(void) {
    double celsius;
    scanf("%[[lf]]", [[&celsius|& celsius]]);
    printf("%.1f\n", celsius * 9 / 5 + 32);
    return 0;
}
```

```stdin
100
```

```explain
With the input 100 the program prints `212.0`. A `double` is read with `%lf`, and `scanf` needs the address `&celsius` so that it can store the number in the variable. The expression `celsius * 9 / 5 + 32` is done in floating point because `celsius` is a double.
```
:::

## Did the read work? The return value

What if the input is not what the format expects, or has run out? `scanf` returns an `int` telling you how many items it successfully read:

- the number of values stored, if all went well (for `"%d %d"` that is `2`),
- fewer than expected if the input stopped matching (for example letters instead of digits),
- the special value `EOF` (which is `-1`) if the input ended before anything could be read.

```c run
#include <stdio.h>

int main(void) {
    int x;
    int result = scanf("%d", &x);
    printf("scanf returned %d\n", result);
    if (result == 1) {
        printf("I read %d\n", x);
    } else {
        printf("That was not a number.\n");
    }
    return 0;
}
```

```stdin
abc
```

Run it, then change `abc` to `42` and run again. The `if` statement is the topic of the next lesson; for now just read it as "if the result is 1, do the first thing, otherwise the second".

> [!TIP]
> Always remember that `scanf` can fail. In programs where wrong input matters, check the return value before you use the variables.

:::exercise predict "What did scanf return?"
The input is `7 hello`. What does the program print?

```c code
#include <stdio.h>

int main(void) {
    int a = -1, b = -1;
    int n = scanf("%d %d", &a, &b);
    printf("%d %d %d\n", n, a, b);
    return 0;
}
```

```stdin
7 hello
```

```explain
`scanf` reads `7` into `a` successfully. Then it tries to read an integer for `b` but finds the letter `h`, so it stops. Only one item was stored: it returns 1, `a` is 7 and `b` keeps its old value, -1.
```
:::

:::exercise code "Average of three"
Read three integers and print their average with two decimals, like this (for `4 3 6`):

```text
average=4.33
```

```c starter
#include <stdio.h>

int main(void) {
    int a, b, c;

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    printf("average=%.2f\n", (a + b + c) / 3.0);
    return 0;
}
```

```test
name: 4 3 6
stdin: 4 3 6
expect:
average=4.33
```

```test
name: all the same
stdin: 10 10 10
expect:
average=10.00
```

```test
name: spread over lines
stdin: 1\n2\n4
expect:
average=2.33
```

```hint
Read all three with one `scanf` and three addresses. Remember that dividing an `int` by an `int` throws the fraction away.
```

```hint
Divide by `3.0` (a double) instead of `3`, or use a cast like `(double)(a + b + c) / 3`.
```
:::
