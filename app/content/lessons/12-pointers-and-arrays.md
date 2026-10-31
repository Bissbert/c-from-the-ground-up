---
id: pointers-and-arrays
title: Pointers and arrays
subtitle: Why an array name is almost a pointer, and how to walk through memory with one.
minutes: 40
goals: Explain that an array name becomes a pointer to its first element
goals: Use pointer arithmetic and see that arr[i] is *(arr + i)
goals: Write functions taking int *a and a length, and understand sizeof inside them
goals: Return several results through pointer parameters and protect inputs with const
docs: Pointer arithmetic | https://en.cppreference.com/w/c/language/operator_arithmetic
docs: Pointer declaration | https://en.cppreference.com/w/c/language/pointer
docs: Arrays | https://en.cppreference.com/w/c/language/array
docs: size_t | https://en.cppreference.com/w/c/types/size_t
---

## An array name is an address

You know two things by now: an array is a row of boxes in memory, and a pointer is a variable holding an address. They are closely related. In almost every expression, the name of an array turns into **a pointer to its first element**. This is called **decay**.

```c run
#include <stdio.h>

int main(void) {
    int arr[3] = {10, 20, 30};
    int *p = arr;                       // no & needed

    printf("arr     = %p\n", (void *)arr);
    printf("&arr[0] = %p\n", (void *)&arr[0]);
    printf("p       = %p\n", (void *)p);
    printf("*p      = %d\n", *p);
    return 0;
}
```

All three addresses are the same: `arr` decays to `&arr[0]`, the address of the first box. So `*p` is `arr[0]`.

```memory
caption: p points to the first element of arr
0xfff8  | arr[2] | int   | 30
0xfff4  | arr[1] | int   | 20
0xfff0  | arr[0] | int   | 10
0xffec* | p      | int * | 0xfff0 | same as &arr[0]
```

> [!NOTE]
> An array and a pointer are **not** the same thing: the array *is* the row of boxes (3 ints = 12 bytes), the pointer is one 4-byte box holding an address. But whenever you use the array's name in an expression, you get its first element's address.

## Pointer arithmetic

You can add an integer to a pointer. `p + 1` does **not** mean "one byte further"; it means "one *element* further", that is `sizeof(*p)` bytes. For an `int *`, adding 1 moves 4 bytes.

```c run
#include <stdio.h>

int main(void) {
    int arr[4] = {10, 20, 30, 40};
    int *p = arr;

    for (int i = 0; i < 4; i++) {
        printf("p + %d = %p  holds %d\n", i, (void *)(p + i), *(p + i));
    }
    return 0;
}
```

The addresses go up by 4 each step, and `*(p + i)` reaches the i-th element. The compiler multiplies by the element size for you, so the same code works for `char` (1 byte), `int` (4 bytes) or `double` (8 bytes).

This gives the central rule of this lesson:

```text
arr[i]   is exactly the same as   *(arr + i)
```

The square brackets are just a convenient way to write "step i elements from the start, then dereference". (That is also why indexing starts at 0: zero steps from the start is the first element.)

:::exercise fill "Addresses by arithmetic"
`int *p` points to the array element at `0x3000`. Fill in the addresses and the value. The array is `{5, 6, 7, 8}`.

```memory
caption: p = 0x3000 points to the first element of an int array
0x3000* | a[0] | int | 5 | p
[[0x3004]]  | a[1] | int | 6 | p + 1
[[0x3008]]  | a[2] | int | [[7]] | p + 2, and *(p + 2) is this value
[[0x300c|0x300C]]  | a[3] | int | 8 | p + 3
```

```explain
Each `p + k` is 4 bytes per step further, because an int is 4 bytes here. `*(p + 2)` is the third element, 7.
```
:::

:::exercise predict "Arithmetic and dereference"
What does this print?

```c code
#include <stdio.h>

int main(void) {
    int v[5] = {2, 4, 6, 8, 10};
    int *p = v + 1;

    printf("%d\n", *p);
    printf("%d\n", *(p + 2));
    printf("%d\n", p[1]);
    printf("%d\n", *p + 2);
    return 0;
}
```

```explain
`p = v + 1` points at `v[1]` (4). `*(p + 2)` is `v[3]` = 8. Brackets work on pointers too: `p[1]` is `*(p + 1)` = `v[2]` = 6. The last line is different: `*p + 2` first dereferences (4), then adds 2.
```
:::

## Walking through an array with a pointer

Since a pointer can be moved, you can iterate with it instead of an index. `p++` moves the pointer to the next element:

```c run
#include <stdio.h>

int main(void) {
    int arr[] = {3, 1, 4, 1, 5};
    int n = sizeof(arr) / sizeof(arr[0]);

    int *p = arr;
    int *end = arr + n;         // one past the last element
    while (p < end) {
        printf("%d ", *p);
        p++;
    }
    printf("\n");
    return 0;
}
```

`end` points just *past* the last element. C allows you to form that address (but never to dereference it). Comparing pointers with `<` asks "is this address lower?", which works when both point into the same array. You can also subtract two such pointers to get the number of elements between them: `end - arr` is 5.

Both styles are equally good. The index version is usually easier to read; the pointer version is common in C library code.

:::exercise fill "Loop with a pointer"
Complete the program so it prints `10 20 30 40` using a pointer.

```c code
#include <stdio.h>

int main(void) {
    int a[4] = {10, 20, 30, 40};
    int *p = [[a]];
    for (int i = 0; i < 4; i++) {
        printf("%d ", [[*p]]);
        [[p++|++p|p = p + 1|p += 1]];
    }
    printf("\n");
    return 0;
}
```

```explain
`a` decays to the address of the first element. Each iteration prints the value `*p` and then advances `p` to the next element.
```
:::

## Arrays in functions are pointers

Now we can finally explain what happens when you pass an array to a function. The parameter `int a[]` is really just another way to write `int *a`. The function receives **the address of the first element** and nothing else:

```c run
#include <stdio.h>

void show(int *a, size_t n) {
    printf("in function: sizeof(a) = %zu\n", sizeof(a));
    for (size_t i = 0; i < n; i++) {
        printf("%d ", a[i]);
    }
    printf("\n");
}

int main(void) {
    int arr[5] = {1, 2, 3, 4, 5};
    printf("in main:     sizeof(arr) = %zu\n", sizeof(arr));
    show(arr, 5);
    return 0;
}
```

Two important consequences:

1. **No copy** is made of the array (that would be slow for big arrays). The function works on the original elements, and `a[i] = ...` changes them for the caller.
2. **The length is lost.** In `main`, `sizeof(arr)` is 20 (the whole array). Inside `show`, `a` is only a pointer, so `sizeof(a)` is 4, the size of a pointer. That's why `sizeof(a) / sizeof(a[0])` inside a function would be wrong, and why you always pass the length as an extra parameter. Use `size_t` (the unsigned type that `sizeof` produces) for sizes and counts.

### const: promise not to change

If a function only reads the array, say so with `const`:

```c
int sum(const int *a, size_t n);
```

`const int *a` means "a pointer to ints that I will not modify through this pointer". The compiler enforces it: writing `a[0] = 1;` inside such a function is an error. This documents your intent and catches bugs. Functions that modify the array (like a sort or a reverse) take plain `int *a`.

```c run error
#include <stdio.h>

void clear_first(const int *a) {
    a[0] = 0;               // error: the data is read-only here
}

int main(void) {
    int arr[2] = {1, 2};
    clear_first(arr);
    printf("%d\n", arr[0]);
    return 0;
}
```

:::exercise quiz "sizeof in a function"
On this machine, `int` is 4 bytes and pointers are 4 bytes. In `main`, `int data[10];` is declared and passed to `void f(int *a)`. What do `sizeof(data)` in `main` and `sizeof(a)` in `f` give?

```options
- [ ] 40 and 40
- [ ] 4 and 4
- [x] 40 and 4
- [ ] 10 and 4
```

```explain
`data` is a real array of 10 ints: 40 bytes. Inside `f`, `a` is just a pointer: 4 bytes on this 32-bit platform (8 on most laptops). It carries no information about how many elements there are.
```
:::

:::exercise code "Sum with a pointer parameter"
Write `int sum(const int *a, size_t n)` that returns the sum of the `n` integers starting at `a`. In `main`, read `n` (1 to 20) and `n` integers, and print:

```text
sum = 15
```

```c starter
#include <stdio.h>

int sum(const int *a, size_t n) {
    // add up the n elements
    (void)a; (void)n;
    return 0;
}

int main(void) {
    int n;
    int data[20];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &data[i]);
    }
    printf("sum = %d\n", sum(data, n));
    return 0;
}
```

```c solution
#include <stdio.h>

int sum(const int *a, size_t n) {
    int total = 0;
    for (size_t i = 0; i < n; i++) {
        total += a[i];
    }
    return total;
}

int main(void) {
    int n;
    int data[20];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &data[i]);
    }
    printf("sum = %d\n", sum(data, n));
    return 0;
}
```

```test
name: five numbers
stdin: 5 1 2 3 4 5
source-has: const int *
expect:
sum = 15
```

```test
name: with negatives
stdin: 3 -4 10 -1
expect:
sum = 5
```

```test
name: one number
stdin: 1 7
expect:
sum = 7
```

```hint
Start `int total = 0;` and loop `i` from 0 to `n - 1`. Inside the function `a[i]` works just like with an array.
```

```hint
`for (size_t i = 0; i < n; i++) { total += a[i]; }` then `return total;`.
```
:::

## Returning several values

A function can return only one value with `return`. But with pointer parameters it can hand back as many results as you like: the caller passes the **addresses** of variables to fill in. These are called **output parameters**.

```c run
#include <stdio.h>

void divide(int a, int b, int *quotient, int *remainder) {
    *quotient = a / b;
    *remainder = a % b;
}

int main(void) {
    int q, r;
    divide(17, 5, &q, &r);
    printf("17 / 5 = %d remainder %d\n", q, r);
    return 0;
}
```

`q` and `r` were not even initialised: `divide` writes to them through the pointers. Compare with `scanf("%d", &x)`, which works the same way.

Finding both the smallest and the largest element of an array is a perfect case: one pass, two results.

:::exercise code "Minimum and maximum"
Write `void min_max(const int *a, size_t n, int *min, int *max)` which stores the smallest and largest element of the `n` numbers (n at least 1) in `*min` and `*max`. In `main`, read `n` (1 to 20) and the `n` integers, call your function, and print:

```text
min = 1
max = 9
```

```c starter
#include <stdio.h>

void min_max(const int *a, size_t n, int *min, int *max) {
    // set *min and *max
    (void)a; (void)n; (void)min; (void)max;
}

int main(void) {
    int n;
    int data[20];
    int lo, hi;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &data[i]);
    }
    // call min_max, then print

    return 0;
}
```

```c solution
#include <stdio.h>

void min_max(const int *a, size_t n, int *min, int *max) {
    *min = a[0];
    *max = a[0];
    for (size_t i = 1; i < n; i++) {
        if (a[i] < *min) {
            *min = a[i];
        }
        if (a[i] > *max) {
            *max = a[i];
        }
    }
}

int main(void) {
    int n;
    int data[20];
    int lo, hi;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &data[i]);
    }
    min_max(data, n, &lo, &hi);
    printf("min = %d\n", lo);
    printf("max = %d\n", hi);
    return 0;
}
```

```test
name: mixed
stdin: 5 4 9 1 7 3
source-has: min_max(data, n, &
expect:
min = 1
max = 9
```

```test
name: negatives
stdin: 4 -3 -8 -1 -2
expect:
min = -8
max = -1
```

```test
name: single element
stdin: 1 5
expect:
min = 5
max = 5
```

```hint
Start by setting both `*min` and `*max` to `a[0]`, then look at the remaining elements.
```

```hint
Loop from `i = 1`: `if (a[i] < *min) *min = a[i];` and the same for the maximum. In `main` pass `&lo` and `&hi`.
```
:::
