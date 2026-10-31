---
id: arrays
title: Arrays
subtitle: Many boxes of the same type, side by side in memory, reached by number.
minutes: 40
goals: Declare, initialise and index arrays, starting from 0
goals: Loop over an array and compute sums, maxima and counts
goals: Picture the memory layout of an array and see out-of-bounds access
goals: Pass an array to a function together with its length
docs: Arrays | https://en.cppreference.com/w/c/language/array
docs: Array initialization | https://en.cppreference.com/w/c/language/array_initialization
docs: sizeof | https://en.cppreference.com/w/c/language/sizeof
docs: size_t | https://en.cppreference.com/w/c/types/size_t
---

## Many boxes under one name

Imagine you need to store the scores of 30 students. Thirty variables `score1`, `score2`, ... would be absurd. An **array** is a row of boxes of the **same type**, one directly after the other in memory, under a single name.

```c run
#include <stdio.h>

int main(void) {
    int scores[4] = {90, 75, 60, 85};

    printf("first:  %d\n", scores[0]);
    printf("second: %d\n", scores[1]);
    printf("last:   %d\n", scores[3]);

    scores[1] = 80;                 // change one box
    printf("second is now %d\n", scores[1]);
    return 0;
}
```

- `int scores[4]` declares 4 `int` boxes.
- `{90, 75, 60, 85}` fills them. This is the **initialiser list**.
- `scores[i]` is the box number `i`. The number in brackets is the **index**.

> [!WARN]
> Indexing starts at **0**. An array with 4 elements has the indices 0, 1, 2 and 3. There is no `scores[4]`. The reason becomes clear below: the index says "how many boxes to skip from the start".

Some useful variants of initialisation:

```c run
#include <stdio.h>

int main(void) {
    int a[5] = {1, 2};          // missing ones become 0: 1 2 0 0 0
    int b[3] = {0};             // all zero
    int c[] = {7, 8, 9, 10};    // size 4, counted by the compiler

    printf("%d %d %d %d %d\n", a[0], a[1], a[2], a[3], a[4]);
    printf("%d %d %d\n", b[0], b[1], b[2]);
    printf("c has %zu elements\n", sizeof(c) / sizeof(c[0]));
    return 0;
}
```

An array declared **without** an initialiser (`int d[5];`) contains garbage: whatever bytes happened to be in that memory. Always initialise.

The last line shows a handy trick. `sizeof(c)` is the size of the whole array in bytes (4 elements x 4 bytes = 16), and `sizeof(c[0])` is the size of one element (4). Dividing gives the **number of elements**, so you don't have to count yourself.

:::exercise predict "Indexing"
What does this program print?

```c code
#include <stdio.h>

int main(void) {
    int v[5] = {10, 20, 30, 40, 50};
    v[2] = v[0] + v[4];
    printf("%d %d %d\n", v[1], v[2], v[3]);
    return 0;
}
```

```explain
`v[0] + v[4]` is 10 + 50 = 60, stored into `v[2]` (the third box, because counting starts at 0). The neighbours `v[1]` = 20 and `v[3]` = 40 are unchanged.
```
:::

## Looping over an array

Arrays and `for` loops belong together: the loop variable is the index.

```c run
#include <stdio.h>

int main(void) {
    int temps[] = {12, 15, 9, 20, 17};
    int n = sizeof(temps) / sizeof(temps[0]);

    int sum = 0;
    int max = temps[0];
    for (int i = 0; i < n; i++) {
        sum += temps[i];
        if (temps[i] > max) {
            max = temps[i];
        }
    }
    printf("n = %d, sum = %d, max = %d\n", n, sum, max);
    return 0;
}
```

Notice `i < n`: with indices 0 to n-1 this visits every element exactly once (the off-by-one trap from the loops lesson is waiting here). Notice also `max = temps[0]`: start with the first element as the best so far, then compare all the others.

You can fill an array from input in the same way:

```c run
#include <stdio.h>

int main(void) {
    int data[3];
    for (int i = 0; i < 3; i++) {
        scanf("%d", &data[i]);
    }
    printf("%d %d %d\n", data[2], data[1], data[0]);
    return 0;
}
```

```stdin
1 2 3
```

`&data[i]` is the address of box number `i`, just like `&x` was the address of a variable.

:::exercise fill "Array basics"
Fill in the blanks. The program should declare an array of 5 ints, set the last element to 99 and print the number of elements.

```c code
#include <stdio.h>

int main(void) {
    int a[[[5]]] = {1, 2, 3, 4, 5};
    a[[[4]]] = 99;
    printf("%d\n", a[4]);
    printf("%zu\n", sizeof(a) / sizeof([[a[0]]]));
    return 0;
}
```

```explain
The size goes in brackets in the declaration. The last of 5 elements has index 4 (not 5). Dividing the size of the whole array by the size of one element gives the element count, 5.
```
:::

:::exercise code "Largest and sum"
Read `n` (1 to 20), then `n` integers. Print the largest one and the sum, in this format:

```text
max = 9
sum = 20
```

Store the numbers in an array.

```c starter
#include <stdio.h>

int main(void) {
    int n;
    int a[20];
    scanf("%d", &n);
    // read n numbers into a, then find the max and the sum

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int n;
    int a[20];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    int max = a[0];
    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum += a[i];
        if (a[i] > max) {
            max = a[i];
        }
    }
    printf("max = %d\n", max);
    printf("sum = %d\n", sum);
    return 0;
}
```

```test
name: five numbers
stdin: 5 3 9 1 4 3
expect:
max = 9
sum = 20
```

```test
name: all negative
stdin: 3 -5 -2 -9
expect:
max = -2
sum = -16
```

```test
name: single number
stdin: 1 42
expect:
max = 42
sum = 42
```

```test
name: uses an array
stdin: 2 7 8
source-has: a[
expect:
max = 8
sum = 15
```

```hint
First loop: `scanf("%d", &a[i]);` for `i` from 0 to `n - 1`.
```

```hint
Start with `max = a[0]` (not 0! all numbers could be negative) and `sum = 0`. Second loop: add to `sum`, and update `max` when `a[i] > max`.
```
:::

## How an array sits in memory

All the boxes of an array are **consecutive**: the elements follow each other with no gaps. Each `int` takes 4 bytes, so each address is 4 more than the one before:

```c run
#include <stdio.h>

int main(void) {
    int arr[4] = {10, 20, 30, 40};
    for (int i = 0; i < 4; i++) {
        printf("arr[%d] = %2d at %p\n", i, arr[i], (void *)&arr[i]);
    }
    printf("size of arr: %zu bytes\n", sizeof(arr));
    return 0;
}
```

Look at the addresses: they differ by `sizeof(int)`, 4 bytes. This is also why indexing starts at 0: `arr[i]` lives at *start address + i x 4*. The first element is zero boxes away from the start.

Here is the same thing as a diagram (addresses made up to be easy to read). Note that the first element has the **lowest** address:

```memory
caption: int arr[4] = {10, 20, 30, 40}
0x1000* | arr[0] | int | 10
0x1004  | arr[1] | int | 20
0x1008  | arr[2] | int | 30
0x100c  | arr[3] | int | 40
```

:::exercise fill "Addresses in a row"
An `int` array `n` starts at address `0x2000`. Fill in the missing addresses (remember: `sizeof(int)` is 4, and addresses here are in hexadecimal).

```memory
caption: int n[4] starting at 0x2000
0x2000* | n[0] | int | 5
[[0x2004]]  | n[1] | int | 6
[[0x2008]]  | n[2] | int | 7
[[0x200c|0x200C]]  | n[3] | int | 8
```

```explain
Each element is 4 bytes after the previous one: 0x2000, 0x2004, 0x2008, 0x200c (hex digits go 0-9 then a-f, so 8 + 4 = 12 = `c`).
```
:::

## Going out of bounds

C does **not** check the index. If you write `arr[10]` on a 4-element array, the compiler usually lets it through (sometimes with a warning) and the program just reads whatever lies in memory at that position, which is some *other* variable or garbage.

```c run warn
#include <stdio.h>

int main(void) {
    int a[3] = {1, 2, 3};
    int b = 777;
    printf("a[3] = %d\n", a[3]);     // one past the end!
    printf("b    = %d\n", b);
    return 0;
}
```

Clang warns about the array index being past the end. On this machine the program still runs, and `a[3]` reads some neighbouring memory (it might even be `b`, but the compiler decides the layout, so you can't count on it). Writing out of bounds is worse: it silently overwrites other variables.

> [!WARN]
> Reading or writing outside an array is **undefined behaviour**: anything may happen. It might seem to work today and break tomorrow, or crash on a real PC. Many serious security bugs are exactly this. *You* are responsible for keeping every index within `0` to `n - 1`.

:::exercise quiz "Valid indices"
For `int data[6];`, which indices are valid?

```options
- [x] 0
- [x] 5
- [ ] 6
- [ ] -1 is fine, it counts from the end
```

```explain
An array of 6 elements has indices 0 to 5. `data[6]` is one past the end, and C has no "counting from the end": `data[-1]` reads the memory just *before* the array. Neither is checked by the compiler.
```
:::

## Arrays and functions

To process an array in a function you pass it as a parameter. Two rules:

1. The function does not know the array's length, so you pass the length as a second parameter.
2. The array is **not copied**. The function works on the caller's original elements, so changes made in the function are visible afterwards. (This is the opposite of ordinary `int` parameters from the functions lesson.)

```c run
#include <stdio.h>

void fill_squares(int a[], int n) {
    for (int i = 0; i < n; i++) {
        a[i] = i * i;
    }
}

int sum(int a[], int n) {
    int total = 0;
    for (int i = 0; i < n; i++) {
        total += a[i];
    }
    return total;
}

int main(void) {
    int sq[5];
    fill_squares(sq, 5);
    printf("%d %d %d %d %d\n", sq[0], sq[1], sq[2], sq[3], sq[4]);
    printf("sum = %d\n", sum(sq, 5));
    return 0;
}
```

`fill_squares` really changed `sq`. How can that work if C copies arguments? Because what gets passed is not the whole array but only the address of its first element. A copy of the *address* is made, and it still leads to the original boxes. You will understand this fully in the pointers lessons.

### Two-dimensional arrays

An array of arrays is a grid. `int grid[2][3]` has 2 rows and 3 columns, and `grid[row][col]` picks a cell. In memory the rows lie one after another.

```c run
#include <stdio.h>

int main(void) {
    int grid[2][3] = {
        {1, 2, 3},
        {4, 5, 6}
    };
    for (int r = 0; r < 2; r++) {
        for (int c = 0; c < 3; c++) {
            printf("%d ", grid[r][c]);
        }
        printf("\n");
    }
    return 0;
}
```

:::exercise code "Reverse"
Read `n` (1 to 10) and then `n` integers. Print them in **reverse order**, separated by single spaces, ending with a newline. Example for the input `4 1 2 3 4`:

```text
4 3 2 1
```

```c starter
#include <stdio.h>

int main(void) {
    int n;
    int a[10];
    scanf("%d", &n);
    // read the numbers, then print them backwards

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int n;
    int a[10];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    for (int i = n - 1; i >= 0; i--) {
        printf("%d", a[i]);
        if (i > 0) {
            printf(" ");
        }
    }
    printf("\n");
    return 0;
}
```

```test
name: four numbers
stdin: 4 1 2 3 4
expect:
4 3 2 1
```

```test
name: one number
stdin: 1 8
expect:
8
```

```test
name: five numbers
stdin: 5 10 -3 7 0 2
expect:
2 0 7 -3 10
```

```hint
Read all numbers into the array first. Then use a second loop that counts down: `for (int i = n - 1; i >= 0; i--)`.
```

```hint
Print a space only between numbers: print `" "` when `i > 0`, and the newline after the loop.
```
:::

:::exercise code "Count occurrences"
Write a function `int count(int a[], int n, int target)` that returns how many elements of `a` equal `target`. In `main`, read `n` (1 to 20), then `n` integers, then the `target`, and print:

```text
found 3 times
```

```c starter
#include <stdio.h>

int count(int a[], int n, int target) {
    // your code here
    (void)a; (void)n; (void)target;
    return 0;
}

int main(void) {
    int n, target;
    int a[20];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    scanf("%d", &target);
    printf("found %d times\n", count(a, n, target));
    return 0;
}
```

```c solution
#include <stdio.h>

int count(int a[], int n, int target) {
    int c = 0;
    for (int i = 0; i < n; i++) {
        if (a[i] == target) {
            c++;
        }
    }
    return c;
}

int main(void) {
    int n, target;
    int a[20];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }
    scanf("%d", &target);
    printf("found %d times\n", count(a, n, target));
    return 0;
}
```

```test
name: three hits
stdin: 6 1 2 1 3 1 4 1
expect:
found 3 times
```

```test
name: no hit
stdin: 3 5 6 7 9
expect:
found 0 times
```

```test
name: all equal
stdin: 4 2 2 2 2 2
expect:
found 4 times
```

```hint
Make a counter `c = 0`, loop over `i` from 0 to `n - 1`, and increase `c` whenever `a[i] == target`.
```

```hint
After the loop, `return c;`.
```
:::
