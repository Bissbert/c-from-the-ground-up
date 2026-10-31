---
id: arithmetic
title: Arithmetic
subtitle: Let the computer calculate, and learn the surprises of integer division.
minutes: 25
goals: Use + - * / and % on int values
goals: Predict integer division and remainder results
goals: Apply precedence rules and parentheses
goals: Use x = x + 1, compound assignment and ++/--
docs: Arithmetic operators | https://en.cppreference.com/w/c/language/operator_arithmetic
docs: Assignment operators | https://en.cppreference.com/w/c/language/operator_assignment
docs: Increment and decrement | https://en.cppreference.com/w/c/language/operator_incdec
docs: Operator precedence | https://en.cppreference.com/w/c/language/operator_precedence
---

## The basic operators

C can calculate with the usual symbols. These are the **arithmetic operators**:

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+` | addition | `7 + 2` | `9` |
| `-` | subtraction | `7 - 2` | `5` |
| `*` | multiplication | `7 * 2` | `14` |
| `/` | division | `7 / 2` | `3` (!) |
| `%` | remainder | `7 % 2` | `1` |

Notice the star for multiplication; there is no `×` on a keyboard. The last two rows look odd, and they are the heart of this lesson.

```c run
#include <stdio.h>

int main(void) {
    int a = 17;
    int b = 5;
    printf("%d + %d = %d\n", a, b, a + b);
    printf("%d - %d = %d\n", a, b, a - b);
    printf("%d * %d = %d\n", a, b, a * b);
    printf("%d / %d = %d\n", a, b, a / b);
    printf("%d %% %d = %d\n", a, b, a % b);
    return 0;
}
```

Two details: you can put a whole calculation as an argument of `printf`, and to print a literal percent sign you write `%%`.

## Integer division and remainder

When both sides of `/` are `int`, the result is an `int` too, so the fractional part is simply **thrown away** (cut off, not rounded). `17 / 5` is `3`, because 5 fits into 17 three times.

What is left over is the **remainder**, which is what `%` (the *modulo* operator) gives you: `17 % 5` is `2`, because `3 * 5 + 2 = 17`.

```text
17 / 5  =  3      (how many whole times 5 fits in 17)
17 % 5  =  2      (what is left over)
```

The two always fit together: `(a / b) * b + (a % b)` equals `a`.

`%` is wonderfully useful. `n % 2` is `0` for even numbers and `1` for odd numbers. `n % 10` gives the last digit of `n`. Minutes on a clock: `130 % 60` is `10`, and `130 / 60` is `2` hours.

> [!WARN]
> Dividing an integer by zero is a bug. In this course your program stops with "integer division by zero". On a real PC it crashes too. `%` with zero on the right is just as bad.

:::exercise predict "Division with leftovers"
What does this program print?

```c code
#include <stdio.h>

int main(void) {
    printf("%d\n", 23 / 4);
    printf("%d\n", 23 % 4);
    printf("%d\n", 3 / 4);
    printf("%d\n", 3 % 4);
    return 0;
}
```

```explain
4 fits into 23 five times (20), leaving 3, so `23 / 4` is 5 and `23 % 4` is 3. For `3 / 4` the divisor is bigger than the dividend: it fits zero times, so the quotient is 0 and the remainder is the whole 3.
```
:::

:::exercise code "Minutes to hours"
Use the variable `total` that is already set to `205` minutes. Print how many whole hours and how many minutes that is, in this format:

```text
3 h 25 min
```

```c starter
#include <stdio.h>

int main(void) {
    int total = 205;

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int total = 205;
    printf("%d h %d min\n", total / 60, total % 60);
    return 0;
}
```

```test
name: 205 minutes
source-has: %
expect:
3 h 25 min
```

```hint
Hours are how many whole 60s fit into `total`. Minutes are what is left over.
```

```hint
`printf("%d h %d min\n", total / 60, total % 60);`
```
:::

## Precedence and parentheses

What is `2 + 3 * 4`? In maths, multiplication goes first, and C agrees: the answer is `14`, not `20`. The rule that decides which operator goes first is called **precedence**.

- `*`, `/` and `%` bind tighter than `+` and `-`.
- Operators of equal strength are evaluated left to right: `20 - 5 - 3` is `(20 - 5) - 3 = 12`.
- **Parentheses** `( )` override everything: whatever is inside is calculated first.

```c run
#include <stdio.h>

int main(void) {
    printf("%d\n", 2 + 3 * 4);
    printf("%d\n", (2 + 3) * 4);
    printf("%d\n", 20 - 5 - 3);
    printf("%d\n", 20 - (5 - 3));
    printf("%d\n", 10 / 4 * 2);
    return 0;
}
```

The last line is a classic trap: `10 / 4 * 2` goes left to right, so it is `(10 / 4) * 2 = 2 * 2 = 4`, not 5.

> [!TIP]
> If you are not sure about precedence, add parentheses. Clear code beats clever code.

:::exercise quiz "Which value?"
What is the value of `7 + 8 / 2 * 3 - 1`?

```options
- [ ] 6
- [ ] 8
- [x] 18
- [ ] 13
```

```explain
Division and multiplication first, left to right: `8 / 2` is 4, then `4 * 3` is 12. Now `7 + 12 - 1` is 18.
```
:::

## A variable on both sides

Because `=` means "store", this is perfectly legal and extremely common:

```c
x = x + 1;
```

It reads: "take the current value of `x`, add 1, store the result back into `x`." The right side is always calculated first, using the old value.

```memory
caption: x = x + 1; x was 4, now 5 (made-up address)
0x1000* | x | int | 5
```

```c run
#include <stdio.h>

int main(void) {
    int x = 4;
    x = x + 1;
    printf("%d\n", x);
    x = x * 3;
    printf("%d\n", x);
    return 0;
}
```

### Shortcuts

Updating a variable is so common that C has shorter spellings:

| Long | Short |
|---|---|
| `x = x + 5;` | `x += 5;` |
| `x = x - 5;` | `x -= 5;` |
| `x = x * 5;` | `x *= 5;` |
| `x = x / 5;` | `x /= 5;` |
| `x = x % 5;` | `x %= 5;` |
| `x = x + 1;` | `x++;` (or `++x;`) |
| `x = x - 1;` | `x--;` (or `--x;`) |

`++` and `--` are the **increment** and **decrement** operators. As a lone statement, `x++;` and `++x;` do the same thing. The difference only shows when you use their result inside a bigger expression; avoid that for now.

:::exercise predict "Shortcuts"
What does this program print?

```c code
#include <stdio.h>

int main(void) {
    int n = 10;
    n += 5;
    n *= 2;
    n -= 3;
    n++;
    n %= 10;
    printf("%d\n", n);
    return 0;
}
```

```explain
Step by step: 10, then 15, then 30, then 27, then 28, then 28 % 10 = 8.
```
:::

## Swapping two variables

A classic puzzle: you have `a = 1` and `b = 2` and want to exchange them. This does **not** work:

```c
a = b;   // a is now 2, but the old 1 is lost!
b = a;   // b gets 2 again
```

The first line destroys the old value of `a`. The fix is a third box, a **temporary** variable, to hold it safely:

```c run
#include <stdio.h>

int main(void) {
    int a = 1;
    int b = 2;
    int temp = a;   // save a's value
    a = b;          // overwrite a
    b = temp;       // put the saved value into b
    printf("a=%d b=%d\n", a, b);
    return 0;
}
```

Think of two cups of different drinks: to swap them you need a third, empty cup.

:::exercise code "Swap"
The variables `x` and `y` are already set up. Swap their values using a temporary variable, then print them in this format (the output below is for `x = 3`, `y = 8`):

```text
x=8 y=3
```

```c starter
#include <stdio.h>

int main(void) {
    int x = 3;
    int y = 8;

    printf("x=%d y=%d\n", x, y);
    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int x = 3;
    int y = 8;
    int temp = x;
    x = y;
    y = temp;
    printf("x=%d y=%d\n", x, y);
    return 0;
}
```

```test
name: swapped
source-has: temp
expect:
x=8 y=3
```

```hint
Save one of the values in a new variable first, before you overwrite it.
```

```hint
`int temp = x;` then `x = y;` then `y = temp;`
```
:::

:::exercise fill "Count and average"
Fill in the blanks so the program prints the sum, then the whole-number average of the three scores.

```c code
#include <stdio.h>

int main(void) {
    int a = 70, b = 85, c = 90;
    int sum = a + b [[+]] c;
    int average = sum [[/]] 3;
    printf("sum=%d average=%d\n", sum, average);
    return 0;
}
```

```test
name: output
expect:
sum=245 average=81
```

```explain
The sum is 245. Dividing by 3 with integer division gives 81, because 245 / 3 is 81.67 and the fractional part is cut off. In lesson 4 you will learn how to get 81.67.
```
:::
