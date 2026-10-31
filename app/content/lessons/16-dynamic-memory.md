---
id: dynamic-memory
title: Dynamic memory
subtitle: Ask the system for memory while the program runs, and give it back when you are done.
minutes: 45
goals: Explain the difference between the stack and the heap
goals: Allocate, check and free memory with malloc, calloc, realloc and free
goals: Build arrays whose size is only known at run time, and grow them
goals: Recognise leaks, use-after-free, double free and dangling pointers
docs: malloc | https://en.cppreference.com/w/c/memory/malloc
docs: free | https://en.cppreference.com/w/c/memory/free
docs: calloc | https://en.cppreference.com/w/c/memory/calloc
docs: realloc | https://en.cppreference.com/w/c/memory/realloc
---

## Stack and heap

So far every variable you made lived on the **stack**. The stack is the memory a function uses for its local variables. It is automatic: when a function is called its variables appear, and when it returns they vanish. That is fast and convenient, but it has two limits:

1. The size of an array must be written in the code (`int a[100]`), but sometimes you only learn how many items you need while the program runs (for example, the user types `n`).
2. Data on the stack dies when the function returns, so a function cannot hand a new object to its caller and have it survive.

The **heap** solves both. It is a large pool of memory that you request explicitly, of any size, at any time. It stays yours until you hand it back.

```memory
caption: A pointer on the stack refers to memory on the heap (made-up but realistic addresses)
0xfff8  | n | int | 3 | stack
0xfff4* | a | int * | 0x111e0 | stack: the pointer variable
0x111e0* | a[0] | int | 10 | heap
0x111e4* | a[1] | int | 20 | heap
0x111e8* | a[2] | int | 30 | heap
```

Heap memory has no name. The only way to reach it is through a pointer, so the pointer is precious: lose it and the memory is lost too.

:::exercise quiz "Stack or heap?"
Which statements are true?

```options
- [x] Local variables of a function live on the stack and disappear when it returns
- [x] Heap memory stays valid until you explicitly free it
- [ ] The heap is faster and managed automatically, so you never need to free it
- [ ] The size of a stack array can be decided while the program runs
```

```explain
The stack is automatic and tied to function calls; the heap is manual: you allocate and you free. Array sizes on the stack are fixed in the code (variable-length arrays exist but are best avoided in this course). Choosing the size at run time is the main reason to use the heap.
```
:::

## malloc, NULL and free

`malloc(size)` from `<stdlib.h>` ([docs](https://en.cppreference.com/w/c/memory/malloc)) asks for `size` bytes and returns a pointer to them. The memory is **uninitialised**: it holds garbage until you write to it. If the system is out of memory, `malloc` returns `NULL`, so always check. When you are finished, call `free` ([docs](https://en.cppreference.com/w/c/memory/free)) with the same pointer.

```c run
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *p = malloc(sizeof *p);
    if (p == NULL) {
        printf("out of memory\n");
        return 1;
    }
    *p = 42;
    printf("value %d at %p\n", *p, (void *)p);
    free(p);
    return 0;
}
```

Details worth knowing:

- `sizeof *p` is "the size of whatever `p` points to", so the line stays right even if you change the type. Writing `malloc(sizeof(int))` also works.
- `malloc` returns `void *`, a pointer to "anything". In C you can assign it to any pointer type directly, with no cast.
- The address printed is in the heap region (around `0x111e0` here), while stack variables are near `0xfff0`.
- After `free(p)` the pointer still holds the old address, but the memory is no longer yours. Never use it again.

:::exercise fill "The malloc recipe"
Complete the program. It should print `9`.

```c code
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *p = malloc([[sizeof *p]]);
    if (p == [[NULL]]) {
        return 1;
    }
    *p = 9;
    printf("%d\n", *p);
    [[free]](p);
    return 0;
}
```

```explain
Ask for `sizeof *p` bytes (4 for an int), compare the result with `NULL` to detect failure, use the memory, then release it with `free(p)`.
```
:::

## An array whose size is chosen at run time

Multiply the element size by the count: `malloc(n * sizeof *a)`. The result can be used exactly like an array, `a[i]`, because indexing is just pointer arithmetic.

```c run
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int *a = malloc(n * sizeof *a);
    if (a == NULL) {
        return 1;
    }
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }

    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum += a[i];
    }
    printf("sum of %d numbers: %d\n", n, sum);

    free(a);
    return 0;
}
```

```stdin
4
10 20 30 40
```

`calloc(count, size)` ([docs](https://en.cppreference.com/w/c/memory/calloc)) is a sibling that takes the count and size separately and **sets all bytes to zero**: ideal for counters.

```c
int *counts = calloc(10, sizeof *counts);   // ten ints, all 0
```

:::exercise code "Sum on the heap"
Read `n`, then `n` integers. Allocate an array of exactly `n` ints with `malloc`, store the numbers, and print their sum as `sum: S`. Free the memory.

```c starter
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    scanf("%d", &n);

    // allocate, read, add up, free

    return 0;
}
```

```c solution
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int *a = malloc(n * sizeof *a);
    if (a == NULL) {
        return 1;
    }
    int sum = 0;
    for (int i = 0; i < n; i++) {
        scanf("%d", &a[i]);
        sum += a[i];
    }
    printf("sum: %d\n", sum);
    free(a);
    return 0;
}
```

```test
name: four numbers
stdin: 4\n10 20 30 40
source-has: malloc
source-has: free(
expect:
sum: 100
```

```test
name: one number
stdin: 1\n-5
source-has: malloc
expect:
sum: -5
```

```test
name: many numbers
stdin: 8\n1 2 3 4 5 6 7 8
source-has: free(
expect:
sum: 36
```

```hint
`int *a = malloc(n * sizeof *a);` gives room for `n` ints. Do not forget to test for `NULL`.
```

```hint
Read with `scanf("%d", &a[i]);` in a loop, then call `free(a);` before `return 0;`.
```
:::

:::exercise code "Most common digit"
Read `n`, then `n` digits (each from 0 to 9). Use `calloc` to create an array of 10 counters (it starts zeroed), count how often each digit appears, and print the digit that appears most often as `most common: D`. If two digits tie, print the smaller one.

```c starter
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    scanf("%d", &n);

    // counters = calloc(10, ...), count, find the maximum, free

    return 0;
}
```

```c solution
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int *counts = calloc(10, sizeof *counts);
    if (counts == NULL) {
        return 1;
    }
    for (int i = 0; i < n; i++) {
        int d;
        scanf("%d", &d);
        counts[d]++;
    }
    int best = 0;
    for (int d = 1; d < 10; d++) {
        if (counts[d] > counts[best]) {
            best = d;
        }
    }
    printf("most common: %d\n", best);
    free(counts);
    return 0;
}
```

```test
name: clear winner
stdin: 6\n3 1 3 3 7 1
source-has: calloc
expect:
most common: 3
```

```test
name: tie picks smaller
stdin: 4\n8 2 8 2
source-has: calloc
source-has: free(
expect:
most common: 2
```

```test
name: single digit
stdin: 1\n9
source-has: calloc
expect:
most common: 9
```

```hint
`calloc(10, sizeof *counts)` gives ten zeroed ints. The digit itself is the index: `counts[d]++`.
```

```hint
Find the maximum with a loop from `d = 1`, updating `best` only when `counts[d] > counts[best]` (strictly greater keeps the smaller digit on ties).
```
:::

## Growing an array with realloc

What if you do not know the count even at the start? Begin small and **grow** when full. `realloc(ptr, new_size)` ([docs](https://en.cppreference.com/w/c/memory/realloc)) resizes a block, keeping the old contents; it may move the data to a new place and free the old block for you. Use the returned pointer from then on.

A safe pattern keeps the result in a temporary variable, so that if `realloc` fails (returns `NULL`) you still hold the old block and can free it:

```c run
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int capacity = 2;
    int count = 0;
    int *a = malloc(capacity * sizeof *a);
    if (a == NULL) {
        return 1;
    }

    for (int value = 1; value <= 10; value++) {
        if (count == capacity) {
            capacity *= 2;                       // double: 2, 4, 8, 16
            int *bigger = realloc(a, capacity * sizeof *a);
            if (bigger == NULL) {
                free(a);
                return 1;
            }
            a = bigger;
            printf("grew to %d\n", capacity);
        }
        a[count] = value * value;
        count++;
    }

    printf("last square: %d, count %d\n", a[count - 1], count);
    free(a);
    return 0;
}
```

Doubling the capacity each time means few `realloc` calls, even for large inputs. This is how the dynamic arrays and strings in other languages work internally.

:::exercise fill "Heap contents"
This program runs. Fill in what the heap holds at the end.

```c
int *a = malloc(3 * sizeof *a);
a[0] = 7;
a[1] = a[0] * 2;
a[2] = a[1] + 1;
```

```memory
caption: after the three assignments (addresses made up)
0xfff4  | a | int * | 0x111e0 | stack
0x111e0 | a[0] | int | [[7]] | heap
0x111e4 | a[1] | int | [[14]] | heap
0x111e8 | a[2] | int | [[15]] | heap
```

```explain
`a[0]` is 7, `a[1]` doubles it to 14, and `a[2]` is one more than that: 15. Each `int` takes 4 bytes, so the addresses go up by 4. The pointer `a` itself lives on the stack and stores the address of the first heap cell.
```
:::

:::exercise code "Numbers until zero"
Read integers until you read a `0` (or the input ends). Store all non-zero numbers in a heap array that starts with room for 2 and grows with `realloc` when full. Then print `count: C` and `max: M`, where `M` is the largest number. At least one number is always given before the 0.

```c starter
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int capacity = 2;
    int count = 0;
    int *a = malloc(capacity * sizeof *a);
    int value;

    // read until 0, grow with realloc, then print count and max

    return 0;
}
```

```c solution
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int capacity = 2;
    int count = 0;
    int *a = malloc(capacity * sizeof *a);
    if (a == NULL) {
        return 1;
    }
    int value;

    while (scanf("%d", &value) == 1 && value != 0) {
        if (count == capacity) {
            capacity *= 2;
            int *bigger = realloc(a, capacity * sizeof *a);
            if (bigger == NULL) {
                free(a);
                return 1;
            }
            a = bigger;
        }
        a[count] = value;
        count++;
    }

    int max = a[0];
    for (int i = 1; i < count; i++) {
        if (a[i] > max) {
            max = a[i];
        }
    }
    printf("count: %d\n", count);
    printf("max: %d\n", max);
    free(a);
    return 0;
}
```

```test
name: five numbers
stdin: 3 9 -2 7 4 0
source-has: realloc
source-has: free(
expect:
count: 5
max: 9
```

```test
name: many numbers
stdin: 1 2 3 4 5 6 7 8 9 10 11 12 13 0 99
source-has: realloc
expect:
count: 13
max: 13
```

```test
name: all negative
stdin: -8 -3 -5 0
source-has: realloc
expect:
count: 3
max: -3
```

```hint
Loop with `while (scanf("%d", &value) == 1 && value != 0)`. Before storing, check `if (count == capacity)`.
```

```hint
To grow: `capacity *= 2; int *bigger = realloc(a, capacity * sizeof *a);` then check for `NULL` and do `a = bigger;`.
```
:::

## Things that go wrong

Heap memory is powerful because C trusts you. These are the classic mistakes:

**Memory leak.** You forget to `free`. The memory stays reserved until the program ends. A small leak in a short program is harmless; in a server running for months it eats all memory.

```c
void leak(void) {
    int *p = malloc(1000 * sizeof *p);
    p[0] = 1;
}   // p disappears, the 4000 bytes are still reserved and nobody can reach them
```

**Use after free.** You use a pointer after calling `free` on it.

```c
int *p = malloc(sizeof *p);
*p = 5;
free(p);
printf("%d\n", *p);   // BUG: the memory is no longer yours
```

**Double free.** You call `free` twice on the same block. This corrupts the allocator's bookkeeping.

```c
free(p);
free(p);   // BUG
```

> [!WARN]
> In this browser environment these bugs often do **not** crash. A use-after-free may even print the old value, or garbage that changes with the allocator's mood. On a real PC they may crash, silently corrupt other data, or seem fine until the day they do not. "It ran fine" proves nothing. Real tools to catch them (Valgrind, AddressSanitizer) are mentioned at the end of the course.

A good habit: set a pointer to `NULL` right after freeing it. Then a mistaken `free(p)` is harmless (freeing `NULL` does nothing), and a mistaken use is easy to spot.

:::exercise quiz "Spot the bug"
What is wrong with this code?

```c
int *a = malloc(4 * sizeof *a);
a[0] = 1;
a = malloc(8 * sizeof *a);
free(a);
```

```options
- [ ] Nothing, it is correct
- [x] The first block is leaked: the only pointer to it was overwritten
- [ ] It frees the same block twice
- [ ] `a[0]` is used after free
```

```explain
After the second `malloc`, `a` points to a new block and the address of the first one is gone, so it can never be freed: a memory leak. Only the second block is freed. Overwriting your only pointer to heap memory is the most common way to leak.
```
:::

## Structs on the heap, and dangling pointers

`malloc` works for any type, including structs. Then you reach the members with `->`:

```c run
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[20];
    int score;
} Student;

int main(void) {
    Student *s = malloc(sizeof *s);
    if (s == NULL) {
        return 1;
    }
    strcpy(s->name, "Ada");
    s->score = 95;
    printf("%s: %d\n", s->name, s->score);
    free(s);
    return 0;
}
```

Now the problem promised in the previous lesson. Here is a function that tries to give back a pointer to a local variable:

```c
int *make_number(void) {
    int x = 42;
    return &x;      // WRONG: x lives on the stack and dies at the closing brace
}
```

When `make_number` returns, its stack space is reused by the next function call. The returned pointer is a **dangling pointer**: it still holds an address, but what lives there is no longer `x`. The compiler warns about this; heed the warning. The fix is to put the value on the heap, which outlives the function. The *caller* then becomes responsible for freeing it.

```c run
#include <stdio.h>
#include <stdlib.h>

int *make_number(int value) {
    int *p = malloc(sizeof *p);
    if (p != NULL) {
        *p = value;
    }
    return p;
}

int main(void) {
    int *n = make_number(42);
    if (n == NULL) {
        return 1;
    }
    printf("%d\n", *n);
    free(n);
    return 0;
}
```

> [!NOTE]
> Whoever ends up holding the pointer is responsible for calling `free` exactly once. Here that is `main`. Freeing inside `make_number` just before the `return` would hand back a dangling pointer, and there is no automatic cleanup in C.
