---
id: decisions
title: Decisions
subtitle: Make your program choose between different paths with if, else and switch.
minutes: 30
goals: Write if, else if and else chains
goals: Use comparison and logical operators correctly
goals: Avoid the == versus = mistake
goals: Explain that in C, 0 is false and everything else is true
docs: if statement | https://en.cppreference.com/w/c/language/if
docs: switch statement | https://en.cppreference.com/w/c/language/switch
docs: Comparison operators | https://en.cppreference.com/w/c/language/operator_comparison
docs: Logical operators | https://en.cppreference.com/w/c/language/operator_logical
---

## Choosing with if

Until now a program ran from the first line to the last, always the same. To react to data, a program must be able to **decide**. The tool for this is the `if` statement:

```c
if (condition) {
    // runs only when the condition is true
}
```

The **condition** is an expression in parentheses. If it is *true*, the block in curly braces runs; if not, the block is skipped. You can add an `else` block for the other case.

```c run
#include <stdio.h>

int main(void) {
    int temperature;
    scanf("%d", &temperature);
    if (temperature < 0) {
        printf("Freezing!\n");
    } else {
        printf("Not freezing.\n");
    }
    return 0;
}
```

```stdin
-5
```

Change the number in the stdin box and run again: the program takes a different path.

### Comparison operators

A condition is usually made with a **comparison**:

| Operator | Meaning | Example |
|---|---|---|
| `<` | less than | `5 < 3` false |
| `>` | greater than | `5 > 3` true |
| `<=` | less than or equal | `5 <= 5` true |
| `>=` | greater than or equal | `5 >= 6` false |
| `==` | equal to | `5 == 5` true |
| `!=` | not equal to | `5 != 3` true |

Notice that "equal to" is written with **two** equals signs.

## The == versus = trap

Remember: a single `=` is **assignment** (store), a double `==` is **comparison** (ask). Mixing them up is one of the most famous mistakes in C, because the compiler accepts both.

```c run warn
#include <stdio.h>

int main(void) {
    int x = 3;
    if (x = 5) {
        printf("x is five\n");
    }
    printf("x is now %d\n", x);
    return 0;
}
```

This does not ask "is `x` equal to 5?". It **stores 5 into `x`**, and the value of an assignment is the value that was stored: 5, which counts as true. So the block always runs, and `x` has been changed behind your back. Clang warns you about it: read warnings!

> [!WARN]
> `if (x == 5)` asks. `if (x = 5)` changes `x` and is almost never what you want.

:::exercise quiz "Spot the question"
Which condition really asks whether `age` is exactly 18?

```options
- [ ] `if (age = 18)`
- [x] `if (age == 18)`
- [ ] `if (age === 18)`
- [ ] `if (age =< 18)`
```

```explain
Only `==` compares. `=` assigns, `===` does not exist in C, and `=<` is not an operator (the correct one is `<=`).
```
:::

## else if: more than two paths

When there are several cases, chain them. The conditions are checked from top to bottom and the **first** one that is true wins. The rest are skipped. A final `else` catches everything else.

```c run
#include <stdio.h>

int main(void) {
    int score;
    scanf("%d", &score);
    if (score >= 90) {
        printf("A\n");
    } else if (score >= 80) {
        printf("B\n");
    } else if (score >= 50) {
        printf("C\n");
    } else {
        printf("F\n");
    }
    return 0;
}
```

```stdin
85
```

For 85, the first test fails (85 is not at least 90), the second succeeds, so `B` is printed and the remaining branches are not even looked at. That is why you do not need to write "score is less than 90" in the second condition.

:::exercise code "Sign of a number"
Read one integer and print `negative`, `zero` or `positive`.

```text
negative
```

```c starter
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    if (n < 0) {
        printf("negative\n");
    } else if (n == 0) {
        printf("zero\n");
    } else {
        printf("positive\n");
    }
    return 0;
}
```

```test
name: negative
stdin: -8
expect:
negative
```

```test
name: zero
stdin: 0
expect:
zero
```

```test
name: positive
stdin: 12
expect:
positive
```

```hint
You need three outcomes, so use `if`, `else if` and `else`.
```

```hint
Test `n < 0` first, then `n == 0`. Everything else must be positive. Use two equals signs for the zero test.
```
:::

## Combining conditions: && || !

Sometimes one comparison is not enough. The **logical operators** combine conditions:

- `a && b` (**and**): true when both `a` and `b` are true.
- `a || b` (**or**): true when at least one of them is true.
- `!a` (**not**): true when `a` is false, and false when `a` is true.

Is a number between 1 and 10? Both conditions must hold:

```c
if (n >= 1 && n <= 10) { ... }
```

You cannot write `1 <= n <= 10` like in maths; it compiles but does not do what you expect.

```c run
#include <stdio.h>

int main(void) {
    int age;
    int has_ticket;
    scanf("%d %d", &age, &has_ticket);
    if (has_ticket && age >= 18) {
        printf("Welcome\n");
    } else if (!has_ticket) {
        printf("Please buy a ticket\n");
    } else {
        printf("Too young\n");
    }
    return 0;
}
```

```stdin
20 1
```

`&&` and `||` are evaluated left to right and **stop early**: in `a && b` if `a` is false, `b` is not even looked at (the result is already false). `&&` binds tighter than `||`, but use parentheses when mixing them.

:::exercise predict "Combine them"
What does this print for the values given?

```c code
#include <stdio.h>

int main(void) {
    int x = 7;
    int y = 12;
    if (x > 5 && y < 10) {
        printf("A\n");
    }
    if (x > 5 || y < 10) {
        printf("B\n");
    }
    if (!(x == 7)) {
        printf("C\n");
    }
    if (x != y && x + y == 19) {
        printf("D\n");
    }
    return 0;
}
```

```explain
`x > 5` is true but `y < 10` is false, so the `&&` is false (no A). With `||` one true side is enough: B. `x == 7` is true, `!` turns it false: no C. `x != y` is true and `7 + 12 == 19` is true: D. The output is B and D.
```
:::

## True and false are numbers

C has no special yes/no value in its original form. A condition is simply an `int`:

- **0 means false**.
- **Any other value means true.**

A comparison produces `1` when it is true and `0` when it is false. You can print it:

```c run
#include <stdio.h>

int main(void) {
    int a = 5;
    printf("%d\n", a > 3);
    printf("%d\n", a == 4);
    printf("%d\n", !a);
    printf("%d\n", !0);
    if (a) {
        printf("a is non-zero, so true\n");
    }
    return 0;
}
```

That means `if (count)` is a short way of writing `if (count != 0)`. It works, but it is clearer for a beginner to write the comparison out.

:::exercise code "Leap year"
A year is a leap year if it is divisible by 4, except that years divisible by 100 are not leap years, unless they are divisible by 400. Read a year and print `leap` or `common`.

```text
leap
```

```c starter
#include <stdio.h>

int main(void) {
    int year;
    scanf("%d", &year);

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int year;
    scanf("%d", &year);
    if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
        printf("leap\n");
    } else {
        printf("common\n");
    }
    return 0;
}
```

```test
name: 2024
stdin: 2024
expect:
leap
```

```test
name: 1900
stdin: 1900
expect:
common
```

```test
name: 2000
stdin: 2000
expect:
leap
```

```test
name: 2023
stdin: 2023
expect:
common
```

```hint
Use `%` to test divisibility: `year % 4 == 0` means divisible by 4.
```

```hint
Leap if (divisible by 4 and not by 100) or divisible by 400. Use parentheses around the first part.
```
:::

## Nested conditions

An `if` can sit inside another `if` (or `else`). This is called **nesting**. The inner decision is only reached when the outer one lets it through.

```c run
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    if (n > 0) {
        if (n % 2 == 0) {
            printf("positive even\n");
        } else {
            printf("positive odd\n");
        }
    } else {
        printf("not positive\n");
    }
    return 0;
}
```

```stdin
7
```

Always use curly braces, even for a single statement, and indent the inside by four spaces. Without braces only the first statement belongs to the `if`, which leads to nasty surprises.

## switch for many fixed values

When you compare **one integer** against many fixed values, a `switch` can be neater than a long `else if` chain.

```c run
#include <stdio.h>

int main(void) {
    int day;
    scanf("%d", &day);
    switch (day) {
        case 1:
            printf("Monday\n");
            break;
        case 2:
            printf("Tuesday\n");
            break;
        case 6:
        case 7:
            printf("Weekend\n");
            break;
        default:
            printf("Some other day\n");
            break;
    }
    return 0;
}
```

```stdin
7
```

The program jumps to the matching `case` and runs from there. `break;` leaves the switch. If you forget `break`, execution **falls through** into the next case, which is occasionally useful (as with 6 and 7 above sharing one result) but usually a bug. `default` handles every value without its own case.

:::exercise fill "Finish the switch"
Complete the program so it prints `one`, `two` or `many` for the input numbers 1, 2 and anything else.

```c code
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    [[switch]] (n) {
        case 1:
            printf("one\n");
            break;
        [[case]] 2:
            printf("two\n");
            break;
        [[default]]:
            printf("many\n");
            break;
    }
    return 0;
}
```

```stdin
2
```

```explain
`switch (n)` selects on the value of `n`, `case 2:` is one of the labels and `default:` catches the rest. Each case ends with `break;` so execution does not fall through to the next one. With the input 2 the program prints `two`.
```
:::
