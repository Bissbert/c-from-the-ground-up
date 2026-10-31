---
id: loops
title: Loops
subtitle: Make the computer repeat work for you, without copying and pasting.
minutes: 35
goals: Write while, for and do-while loops and know when to use each
goals: Count, sum and search with a loop
goals: Print patterns with nested loops
goals: Spot off-by-one errors and endless loops
docs: while loop | https://en.cppreference.com/w/c/language/while
docs: for loop | https://en.cppreference.com/w/c/language/for
docs: do-while loop | https://en.cppreference.com/w/c/language/do
docs: break | https://en.cppreference.com/w/c/language/break
docs: continue | https://en.cppreference.com/w/c/language/continue
---

## Why loops?

Suppose you want to print the numbers 1 to 5. You could write five `printf` calls. But what about 1 to 1000? Computers are good at doing the same thing again and again, so C gives us **loops**: a block of code that is repeated as long as a condition holds.

The simplest loop is `while`:

```c run
#include <stdio.h>

int main(void) {
    int i = 1;
    while (i <= 5) {
        printf("%d\n", i);
        i = i + 1;
    }
    printf("done, i is now %d\n", i);
    return 0;
}
```

How the computer reads it:

1. Check the condition `i <= 5`. If it is false, skip the loop entirely.
2. If true, run the block between `{` and `}` once (this is one **iteration**).
3. Go back to step 1.

The variable `i` is the **loop variable**. Something inside the loop must change it, otherwise the condition never becomes false. Here `i = i + 1` (or `i++`, from the arithmetic lesson) does that job.

> [!NOTE]
> The condition is checked *before* every iteration, including the first. If it is false right at the start, the body runs **zero** times.

## The for loop

Counting loops are so common that C has a shorter way to write them. A `for` loop puts the three parts of a counting loop on one line:

```c
for (start; condition; step) {
    body
}
```

```c run
#include <stdio.h>

int main(void) {
    for (int i = 1; i <= 5; i++) {
        printf("%d\n", i);
    }
    return 0;
}
```

This does exactly what the `while` version did:

- **start** `int i = 1` runs once, before the loop begins.
- **condition** `i <= 5` is checked before every iteration.
- **step** `i++` runs after every iteration.

A variable declared in the `for` line (like `i` here) exists only inside the loop. We say its **scope** is the loop.

To count from 0, use `<` with the number of repetitions; to count down, use `i--`:

```c run
#include <stdio.h>

int main(void) {
    for (int i = 0; i < 3; i++) {
        printf("round %d\n", i);
    }
    for (int i = 3; i >= 1; i--) {
        printf("%d... ", i);
    }
    printf("liftoff!\n");
    return 0;
}
```

> [!TIP]
> Rule of thumb: use `for` when you know how many times to repeat, and `while` when you repeat *until something happens*. Programmers write "repeat n times" as `for (int i = 0; i < n; i++)` so often that it becomes a reflex.

:::exercise quiz "How many times?"
How many times does the body of this loop run?

```c
for (int i = 2; i < 10; i += 2) {
    /* body */
}
```

```options
- [ ] 10 times
- [ ] 5 times
- [x] 4 times
- [ ] 8 times
```

```explain
i takes the values 2, 4, 6, 8. When i becomes 10, `10 < 10` is false and the loop stops. That is 4 iterations.
```
:::

:::exercise fill "Complete the countdown"
Fill in the blanks so the program prints `5 4 3 2 1` followed by a new line.

```c code
#include <stdio.h>

int main(void) {
    for (int i = [[5]]; i [[>=|> =]] 1; i[[--]]) {
        printf("%d ", i);
    }
    printf("\n");
    return 0;
}
```

```explain
Start at 5, keep going while `i >= 1`, and count down with `i--`. Using `i > 1` would stop before printing 1.
```
:::

## Accumulating: sums and counters

Loops become powerful when they build up a result. The pattern is always the same:

1. Make a variable **before** the loop and give it a neutral start value (0 for sums, 1 for products).
2. Update it **inside** the loop.
3. Use it **after** the loop.

```c run
#include <stdio.h>

int main(void) {
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum += i;
    }
    printf("1 + 2 + ... + 10 = %d\n", sum);
    return 0;
}
```

You can also read input inside a loop. With `scanf` you can read several numbers, one per iteration:

```c run
#include <stdio.h>

int main(void) {
    int count, total = 0;
    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        int x;
        scanf("%d", &x);
        total += x;
    }
    printf("total = %d\n", total);
    return 0;
}
```

```stdin
4
10 20 30 5
```

### do-while: check at the end

A `do`-`while` loop checks its condition *after* the body, so the body always runs at least once:

```c run
#include <stdio.h>

int main(void) {
    int n = 0;
    do {
        printf("this runs once even though n is %d\n", n);
        n++;
    } while (n < 0);
    return 0;
}
```

Note the semicolon after `while (...)`. It is needed here, and only here.

:::exercise code "Sum of 1 to n"
Read an integer `n` and print the sum `1 + 2 + ... + n`, in this format:

```text
sum = 55
```

You may assume `n >= 1`.

```c starter
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    // add up 1..n with a loop

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int sum = 0;
    for (int i = 1; i <= n; i++) {
        sum += i;
    }
    printf("sum = %d\n", sum);
    return 0;
}
```

```test
name: n = 10
stdin: 10
expect:
sum = 55
```

```test
name: n = 1
stdin: 1
expect:
sum = 1
```

```test
name: n = 100
stdin: 100
expect:
sum = 5050
```

```test
name: uses a loop
stdin: 7
source-has: for
expect:
sum = 28
```

```hint
Make a variable `sum` that starts at 0, then add `i` to it for every `i` from 1 to `n`.
```

```hint
`for (int i = 1; i <= n; i++) { sum += i; }`, then print `sum` after the loop.
```
:::

## Loops inside loops

A loop body can contain another loop. For each iteration of the **outer** loop, the **inner** loop runs completely. This is how you print grids and patterns.

```c run
#include <stdio.h>

int main(void) {
    for (int row = 1; row <= 3; row++) {
        for (int col = 1; col <= 4; col++) {
            printf("* ");
        }
        printf("\n");
    }
    return 0;
}
```

The outer loop runs 3 times (rows). Each time the inner loop prints 4 stars on the same line, and then `printf("\n")` ends the line. In total: 3 x 4 = 12 stars.

The inner loop's limit can depend on the outer variable. That makes a triangle:

```c run
#include <stdio.h>

int main(void) {
    for (int row = 1; row <= 4; row++) {
        for (int col = 1; col <= row; col++) {
            printf("%d", col);
        }
        printf("\n");
    }
    return 0;
}
```

:::exercise predict "Nested counting"
What does this print?

```c code
#include <stdio.h>

int main(void) {
    for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= 2; j++) {
            printf("%d ", i * j);
        }
        printf("\n");
    }
    return 0;
}
```

```explain
For i = 1 the inner loop prints 1 and 2; for i = 2 it prints 2 and 4; for i = 3 it prints 3 and 6. Each outer iteration ends with a newline.
```
:::

:::exercise code "Right triangle"
Read a number `n` and print a triangle of `#` characters with `n` rows: row 1 has one `#`, row 2 has two, and so on. For `n = 3`:

```text
#
##
###
```

```c starter
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    // outer loop: rows, inner loop: characters in a row

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    for (int row = 1; row <= n; row++) {
        for (int col = 1; col <= row; col++) {
            printf("#");
        }
        printf("\n");
    }
    return 0;
}
```

```test
name: n = 3
stdin: 3
expect:
#
##
###
```

```test
name: n = 1
stdin: 1
expect:
#
```

```test
name: n = 5
stdin: 5
expect:
#
##
###
####
#####
```

```test
name: uses nested loops
stdin: 2
source-has: for
expect:
#
##
```

```hint
You need two loops, one inside the other. The outer one counts rows from 1 to `n`.
```

```hint
The inner loop prints `#` exactly `row` times. After it finishes, print a single `\n`.
```
:::

## break and continue

Two keywords change the normal flow of a loop:

- `break` leaves the loop immediately.
- `continue` skips the rest of the current iteration and jumps to the next one.

```c run
#include <stdio.h>

int main(void) {
    for (int i = 1; i <= 10; i++) {
        if (i % 2 == 0) {
            continue;       // skip even numbers
        }
        if (i > 7) {
            break;          // stop completely
        }
        printf("%d ", i);
    }
    printf("\n");
    return 0;
}
```

`break` is perfect for searching: once you have found what you looked for, there is no reason to keep going.

```c run
#include <stdio.h>

int main(void) {
    int n = 91;
    int divisor = 0;
    for (int d = 2; d < n; d++) {
        if (n % d == 0) {
            divisor = d;
            break;
        }
    }
    if (divisor != 0) {
        printf("%d is divisible by %d\n", n, divisor);
    } else {
        printf("%d has no divisor between 2 and n-1\n", n);
    }
    return 0;
}
```

> [!NOTE]
> In nested loops, `break` and `continue` affect only the **innermost** loop that contains them.

:::exercise code "First multiple"
Read a number `k`. Print the first number between 1 and 100 that is divisible by both `k` and 7, or `none` if there is no such number. Example output:

```text
14
```

```c starter
#include <stdio.h>

int main(void) {
    int k;
    scanf("%d", &k);
    // search 1..100, stop at the first hit

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int k;
    scanf("%d", &k);
    int found = 0;
    for (int i = 1; i <= 100; i++) {
        if (i % k == 0 && i % 7 == 0) {
            printf("%d\n", i);
            found = 1;
            break;
        }
    }
    if (!found) {
        printf("none\n");
    }
    return 0;
}
```

```test
name: k = 2
stdin: 2
expect:
14
```

```test
name: k = 5
stdin: 5
expect:
35
```

```test
name: k = 13
stdin: 13
expect:
91
```

```test
name: k = 50
stdin: 50
expect:
none
```

```hint
Loop `i` from 1 to 100 and test `i % k == 0 && i % 7 == 0`.
```

```hint
When the test is true, print `i` and leave the loop with `break`. Remember a flag variable (`found`) to know afterwards whether anything was printed.
```
:::

## Off-by-one errors and endless loops

The most common loop bug is the **off-by-one error**: the loop runs one time too many or too few. It almost always comes from `<` versus `<=`, or from starting at 0 versus 1.

```c run
#include <stdio.h>

int main(void) {
    // We want to print 5 stars.
    for (int i = 0; i <= 5; i++) {
        printf("*");
    }
    printf("\n");
    return 0;
}
```

That prints six stars, because `i` takes the values 0, 1, 2, 3, 4 **and** 5. The fix is `i < 5`. When you count from 0, `i < n` repeats exactly `n` times.

The second classic bug is the **endless loop**: a loop whose condition never becomes false.

```c
int i = 1;
while (i <= 5) {
    printf("%d\n", i);
    // forgot i++ ... i stays 1 forever
}
```

The program prints `1` again and again and never stops. On a real computer you would press Ctrl+C. In this course the app stops a program that runs for too long, but it is better to avoid them. When a loop does not end, ask yourself: *what changes inside the loop that will eventually make the condition false?*

> [!WARN]
> Sometimes an endless loop is intentional (a game's main loop, `while (1) { ... if (done) break; }`). But a beginner's endless loop is nearly always a missing `i++`, a wrong direction (`i--` when you meant `i++`) or a condition that can never fail.

:::exercise quiz "Spot the bug"
This loop is meant to print the numbers 1 to 10. Why would it never end?

```c
int i = 1;
while (i <= 10) {
    printf("%d\n", i);
}
```

```options
- [ ] Because `<=` should be `<`
- [x] Because nothing inside the loop changes `i`
- [ ] Because `printf` is not allowed in a loop
- [ ] Because `while` needs a semicolon at the end
```

```explain
`i` stays 1, so `i <= 10` is true forever. Adding `i++;` inside the loop fixes it. Compare with the `for` loop, where the step `i++` sits in the loop header and is hard to forget.
```
:::
