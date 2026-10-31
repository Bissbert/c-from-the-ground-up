---
id: types-and-sizes
title: Types and sizes
subtitle: Bits, bytes, the integer and floating-point types, and what happens when a number does not fit.
minutes: 30
goals: Explain bits and bytes and why a type has a limited range
goals: Choose between char, short, int, long, long long, float and double
goals: Measure types with sizeof and print them with the right format specifier
goals: Predict overflow, integer vs floating-point division and casts
docs: Arithmetic types | https://en.cppreference.com/w/c/language/arithmetic_types
docs: sizeof | https://en.cppreference.com/w/c/language/sizeof
docs: Limits of integer types | https://en.cppreference.com/w/c/types/limits
docs: printf | https://en.cppreference.com/w/c/io/fprintf
docs: Integer constants | https://en.cppreference.com/w/c/language/integer_constant
---

## Bits and bytes

Inside the computer everything is stored as **bits**. A bit is a tiny switch that is either `0` or `1`. With one bit you can tell two things apart; with two bits four things (`00`, `01`, `10`, `11`); with *n* bits you can tell 2^*n* things apart.

Bits are grouped into **bytes**: one byte is 8 bits, so it can hold 2^8 = 256 different patterns. Memory is measured in bytes. Every box of memory you declared in the last lessons is made of one or more bytes.

That is why a variable cannot hold any number whatsoever: a box of 4 bytes has 32 bits, so it can only tell 2^32 = 4 294 967 296 different numbers apart. A type decides **how many bytes** a variable takes and **how those bits are read**.

| Bytes | Bits | Different patterns |
|---|---|---|
| 1 | 8 | 256 |
| 2 | 16 | 65 536 |
| 4 | 32 | 4 294 967 296 |
| 8 | 64 | about 1.8 x 10^19 |

## The integer types

C has several whole-number types that differ in size. Bigger types cost more memory but hold bigger numbers.

| Type | Size here | Typical range (signed) |
|---|---|---|
| `char` | 1 byte | -128 to 127 |
| `short` | 2 bytes | -32 768 to 32 767 |
| `int` | 4 bytes | about -2.1 billion to 2.1 billion |
| `long` | 4 bytes (!) | same as `int` in this course |
| `long long` | 8 bytes | about -9.2 x 10^18 to 9.2 x 10^18 |

> [!NOTE]
> The C standard only promises minimum sizes, so sizes vary between machines. This course runs in a 32-bit WebAssembly machine where `long` is 4 bytes. On a 64-bit Linux or Mac PC, `long` is 8 bytes. Never assume; measure.

By default these types are **signed**: one bit is spent on the sign, so negative numbers are allowed. If you write `unsigned` in front, all bits are used for the magnitude and negatives are not allowed: an `unsigned char` holds 0 to 255, an `unsigned int` holds 0 to about 4.29 billion.

## Measuring with sizeof

The operator `sizeof` tells you how many bytes a type or a variable takes. Its result has the type `size_t`, an unsigned whole number, which you print with `%zu`.

```c run
#include <stdio.h>

int main(void) {
    int n = 5;
    printf("char      : %zu\n", sizeof(char));
    printf("short     : %zu\n", sizeof(short));
    printf("int       : %zu\n", sizeof(int));
    printf("long      : %zu\n", sizeof(long));
    printf("long long : %zu\n", sizeof(long long));
    printf("n         : %zu\n", sizeof n);
    return 0;
}
```

### Format specifiers

`printf` must be told how to read the bytes you give it. Using the wrong specifier is a bug, and the compiler warns about it.

| Specifier | Type |
|---|---|
| `%d` | `int` |
| `%u` | `unsigned int` |
| `%ld` | `long` |
| `%lld` | `long long` |
| `%f` | `double` (and `float`, which is promoted) |
| `%c` | a single character |
| `%zu` | `size_t` (the result of `sizeof`) |

:::exercise quiz "Which specifier?"
You want to print `sizeof(double)`. Which line is correct?

```options
- [ ] `printf("%d\n", sizeof(double));`
- [ ] `printf("%f\n", sizeof(double));`
- [x] `printf("%zu\n", sizeof(double));`
- [ ] `printf("%c\n", sizeof(double));`
```

```explain
`sizeof` produces a `size_t`, so `%zu` is the matching specifier. `%d` expects a plain `int` and the compiler warns about the mismatch. `%f` is for floating-point numbers.
```
:::

:::exercise code "Size report"
Print the sizes of `short`, `int` and `long long`, each on its own line, in exactly this format:

```text
short=2
int=4
long long=8
```

```c starter
#include <stdio.h>

int main(void) {
    // use sizeof and %zu

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    printf("short=%zu\n", sizeof(short));
    printf("int=%zu\n", sizeof(int));
    printf("long long=%zu\n", sizeof(long long));
    return 0;
}
```

```test
name: sizes
source-has: sizeof
expect:
short=2
int=4
long long=8
```

```hint
`sizeof(short)` is an expression you can pass to `printf` like any other value.
```

```hint
`printf("short=%zu\n", sizeof(short));` and the same for the other two types.
```
:::

## Overflow

What happens if you try to store a number that is too big for the type? It does not fit, so the extra bits are lost. This is called **overflow**. The largest `int` is `INT_MAX`, defined in `<limits.h>`.

```c run
#include <stdio.h>
#include <limits.h>

int main(void) {
    int big = INT_MAX;
    printf("INT_MAX     = %d\n", big);
    big = big + 1;
    printf("INT_MAX + 1 = %d\n", big);
    return 0;
}
```

The counter wrapped around to the most negative number, just like a car's odometer rolling over from 999999 to 000000. Technically C calls signed overflow *undefined behaviour*: the standard does not say what must happen, so the compiler may do anything. Treat it as a bug. Unsigned types, by contrast, are defined to wrap around.

The header `<limits.h>` also gives `INT_MIN`, `LONG_MAX`, `CHAR_MAX` and friends (see the [limits reference](https://en.cppreference.com/w/c/types/limits)).

:::exercise predict "Rolling over"
This uses an `unsigned char`, which holds 0 to 255 and wraps around by definition. What does it print?

```c code
#include <stdio.h>

int main(void) {
    unsigned char c = 250;
    c = c + 10;
    printf("%d\n", c);
    return 0;
}
```

```explain
250 + 10 is 260, but the box only has 8 bits (0 to 255). 260 wraps around to 260 - 256 = 4.
```
:::

## Characters are small numbers

The type `char` is an integer that is just one byte long. By agreement (the **ASCII** table) each number stands for a letter: `65` is `'A'`, `66` is `'B'`, `97` is `'a'`, `48` is the digit `'0'`. A character in single quotes, like `'A'`, is simply that number.

```c run
#include <stdio.h>

int main(void) {
    char letter = 'A';
    printf("%c is the number %d\n", letter, letter);
    letter = letter + 1;
    printf("%c is the number %d\n", letter, letter);
    printf("%c\n", 'a' + 2);
    return 0;
}
```

The same box prints as a letter with `%c` and as a number with `%d`. Only the format specifier changes how we look at it. Note the difference between `'A'` (single quotes: one character, a number) and `"A"` (double quotes: a string, which we meet in lesson 13).

:::exercise predict "Letters are numbers"
What does this print? Remember `'A'` is 65 and `'a'` is 97.

```c code
#include <stdio.h>

int main(void) {
    char c = 'a';
    printf("%d\n", c - 'A');
    printf("%c\n", c + 1);
    return 0;
}
```

```explain
`c - 'A'` is 97 - 65 = 32, the distance between lowercase and uppercase letters in ASCII. `c + 1` is 98, which `%c` shows as `b`.
```
:::

## Numbers with a fractional part

Integers cannot store 3.14. For that C has the **floating-point** types:

| Type | Size | Precision |
|---|---|---|
| `float` | 4 bytes | about 7 significant digits |
| `double` | 8 bytes | about 15 significant digits |

Use `double` by default; it is the normal choice. A literal with a decimal point, like `3.14`, is a `double`. Print with `%f` (six digits after the point) or choose the digits yourself: `%.2f` prints two.

```c run
#include <stdio.h>

int main(void) {
    double pi = 3.14159265358979;
    float f = 0.1f;
    printf("%f\n", pi);
    printf("%.2f\n", pi);
    printf("%.10f\n", f);
    return 0;
}
```

Look at the last line: `0.1` cannot be stored exactly in binary, so a `float` prints something slightly off. Floating-point numbers are **approximations**.

## Integer versus floating-point division

The type of the operands decides which division happens. If **both** are integers, the result is an integer and the fraction is lost. If **at least one** is floating-point, you get a real division.

```c run warn
#include <stdio.h>

int main(void) {
    printf("%d\n", 7 / 2);
    printf("%f\n", 7.0 / 2);
    printf("%f\n", 7 / 2.0);
    printf("%f\n", 7 / 2);
    return 0;
}
```

The last line is a trap: `7 / 2` is integer division, so it is `3`. But `%f` expects a `double` while we pass an `int`, which gives wrong output and a compiler warning.

### Casts

A **cast** converts a value to another type, written as the type in parentheses: `(double)x`. A cast is how you divide two integer variables properly:

```c run
#include <stdio.h>

int main(void) {
    int total = 7;
    int count = 2;
    printf("%d\n", total / count);
    printf("%.2f\n", (double)total / count);
    printf("%d\n", (int)3.99);
    return 0;
}
```

`(double)total` makes a double copy of the value, so the division is done in floating point. Casting a double to `int` throws away the fraction (3.99 becomes 3, not 4).

> [!TIP]
> Write `(double)total / count`, not `(double)(total / count)`. The second form divides first as integers and only then converts, which is too late.

:::exercise fill "Average with decimals"
Fill in the blanks so the program prints the exact average of the two scores with two decimals.

```c code
#include <stdio.h>

int main(void) {
    int a = 7;
    int b = 8;
    double average = ([[double]])(a + b) / 2;
    printf("%[[.2f|.2lf]]\n", average);
    return 0;
}
```

```test
name: average
expect:
7.50
```

```explain
`a + b` is 15, and `15 / 2` as integers would be 7. Casting the sum to `double` first makes the division floating-point, giving 7.5. `%.2f` prints it with two decimals: `7.50`.
```
:::

:::exercise code "Mean of three"
Three `int` variables are set up for you. Print their mean with exactly two decimals, in this format:

```text
mean=4.33
```

```c starter
#include <stdio.h>

int main(void) {
    int a = 4;
    int b = 3;
    int c = 6;

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int a = 4;
    int b = 3;
    int c = 6;
    double mean = (double)(a + b + c) / 3;
    printf("mean=%.2f\n", mean);
    return 0;
}
```

```test
name: mean of 4 3 6 (13/3)
source-has: double
expect:
mean=4.33
```

```hint
The sum is an `int`. Dividing it by 3 loses the fraction, so one side needs to become a `double` first.
```

```hint
`double mean = (double)(a + b + c) / 3;` then print with `%.2f`.
```
:::
