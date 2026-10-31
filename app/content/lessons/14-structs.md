---
id: structs
title: Structs
subtitle: Bundle related values into one type of your own.
minutes: 40
goals: Define a struct, create variables of it and access members with the dot
goals: Use typedef, designated initialisers, arrays of structs and structs that contain arrays
goals: Explain that structs are copied on assignment and when passed to functions
goals: Read a struct's memory layout, including padding, with sizeof and offsetof
docs: struct declaration | https://en.cppreference.com/w/c/language/struct
docs: typedef | https://en.cppreference.com/w/c/language/typedef
docs: offsetof | https://en.cppreference.com/w/c/types/offsetof
docs: Member access operators | https://en.cppreference.com/w/c/language/operator_member_access
---

## Why group values?

A point on a screen has an x and a y. A student has a name and a score. With what you know so far you would need separate variables (`int x; int y;`) and carry them around together by hand. A function that takes a point would need two parameters, and one that returns a point would be impossible.

A **struct** (short for *structure*) lets you glue several variables into one new type. Each variable inside is called a **member** (or *field*).

```c run
#include <stdio.h>

struct point {
    int x;
    int y;
};

int main(void) {
    struct point p;
    p.x = 3;
    p.y = 4;
    printf("p = (%d, %d)\n", p.x, p.y);
    return 0;
}
```

Reading it from the top:

- `struct point { int x; int y; };` defines a new type called `struct point`. Note the semicolon after the closing brace, it is required. This only describes the shape; it creates no variable.
- `struct point p;` creates a variable `p` of that type.
- `p.x` means "the member `x` of `p`". The dot is the **member access operator** ([docs](https://en.cppreference.com/w/c/language/operator_member_access)).

In memory, the members sit next to each other, in the order you declared them:

```memory
caption: struct point p = {3, 4}; (addresses made up)
0x1000* | p.x | int | 3
0x1004* | p.y | int | 4
```

## Initialising structs

Typing three lines to fill a struct is tedious. Use braces to give all members in order, or **designated initialisers** to name them (the order then does not matter, and anything you leave out becomes 0).

```c run
#include <stdio.h>

struct point {
    int x;
    int y;
};

int main(void) {
    struct point a = {3, 4};
    struct point b = {.y = 9, .x = 1};
    struct point origin = {0};

    printf("a = (%d, %d)\n", a.x, a.y);
    printf("b = (%d, %d)\n", b.x, b.y);
    printf("origin = (%d, %d)\n", origin.x, origin.y);
    return 0;
}
```

Writing `struct point` everywhere gets long. A **typedef** gives a type a shorter name ([docs](https://en.cppreference.com/w/c/language/typedef)). The usual style is to define and name the struct at once:

```c run
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

int main(void) {
    Point p = {.x = 5, .y = 6};
    printf("(%d, %d)\n", p.x, p.y);
    return 0;
}
```

From now on `Point` means exactly what `struct point` meant. Both styles are common; you will meet both in real code.

:::exercise code "Rectangle area"
Define a struct `Rect` with two `int` members, `width` and `height`. Read two numbers (width, then height) into a `Rect` variable and print its area.

```text
area: 12
```

```c starter
#include <stdio.h>

// define Rect here

int main(void) {
    // declare a Rect, read width and height with scanf, print the area

    return 0;
}
```

```c solution
#include <stdio.h>

typedef struct {
    int width;
    int height;
} Rect;

int main(void) {
    Rect r;
    scanf("%d %d", &r.width, &r.height);
    printf("area: %d\n", r.width * r.height);
    return 0;
}
```

```test
name: 3 by 4
stdin: 3 4
expect:
area: 12
```

```test
name: 10 by 7
stdin: 10 7
expect:
area: 70
```

```test
name: zero
stdin: 0 5
expect:
area: 0
```

```hint
Define it with `typedef struct { int width; int height; } Rect;` before `main`.
```

```hint
`scanf` needs the address of each member: `&r.width`. The dot binds tighter than `&`, so this means "the address of `r.width`".
```
:::

## Structs are copied

A struct variable behaves like an `int`: assigning one to another **copies every member**. The two are then independent. The same is true when you pass a struct to a function: the function gets its own copy (pass by value, just like in the functions lesson), and a function can also return a struct.

```c run
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

void move_right(Point p) {
    p.x = p.x + 10;
    printf("inside:  (%d, %d)\n", p.x, p.y);
}

Point moved_right(Point p) {
    p.x = p.x + 10;
    return p;
}

int main(void) {
    Point a = {1, 2};
    Point b = a;          // copy
    b.x = 100;
    printf("a = (%d, %d)\n", a.x, a.y);
    printf("b = (%d, %d)\n", b.x, b.y);

    move_right(a);
    printf("after move_right: (%d, %d)\n", a.x, a.y);

    a = moved_right(a);
    printf("after moved_right: (%d, %d)\n", a.x, a.y);
    return 0;
}
```

:::exercise predict "Copy or original?"
What does this program print?

```c code
#include <stdio.h>

typedef struct {
    int hp;
    int level;
} Hero;

void level_up(Hero h) {
    h.level++;
    h.hp += 5;
}

Hero healed(Hero h) {
    h.hp += 20;
    return h;
}

int main(void) {
    Hero a = {50, 1};
    Hero b = a;
    level_up(b);
    b = healed(b);
    printf("%d %d\n", a.hp, a.level);
    printf("%d %d\n", b.hp, b.level);
    return 0;
}
```

```explain
`b = a` copies the struct, so `a` stays `50 1` forever. `level_up(b)` changes only its own copy, so `b` is still `50 1` afterwards. `healed` changes its copy too, but returns it and the assignment stores it back: `b` becomes `70 1`.
```
:::

:::exercise code "Add two points"
Write a function `Point add(Point a, Point b)` that returns the point whose coordinates are the sums of the two arguments. In `main`, read `x1 y1 x2 y2`, call `add` and print the result in the format `(x, y)`.

```c starter
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

// write add here

int main(void) {
    Point a, b;
    scanf("%d %d %d %d", &a.x, &a.y, &b.x, &b.y);

    // call add and print

    return 0;
}
```

```c solution
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

Point add(Point a, Point b) {
    Point r;
    r.x = a.x + b.x;
    r.y = a.y + b.y;
    return r;
}

int main(void) {
    Point a, b;
    scanf("%d %d %d %d", &a.x, &a.y, &b.x, &b.y);

    Point s = add(a, b);
    printf("(%d, %d)\n", s.x, s.y);
    return 0;
}
```

```test
name: simple
stdin: 1 2 3 4
expect:
(4, 6)
```

```test
name: negatives
stdin: -5 10 2 -20
expect:
(-3, -10)
```

```test
name: with function
stdin: 0 0 7 7
source-has: add(
expect:
(7, 7)
```

```hint
Inside `add`, create a local `Point r;`, fill `r.x` and `r.y`, and `return r;`.
```

```hint
In `main`: `Point s = add(a, b);` then print `s.x` and `s.y` with `printf("(%d, %d)\n", ...)`.
```
:::

## Arrays inside and arrays of structs

A member can be anything, including an array. A very common one is a text field:

```c
typedef struct {
    char name[20];
    int score;
} Student;
```

Because the array is *inside* the struct, copying a `Student` copies all 20 characters too. (Earlier, an array alone could not be assigned. Inside a struct it can, since the whole struct is copied.)

You can also make an array **of** structs, and combine both ideas: each element is a complete `Student`.

```c run
#include <stdio.h>
#include <string.h>

typedef struct {
    char name[20];
    int score;
} Student;

int main(void) {
    Student class[3] = {
        {"Ada", 95},
        {"Linus", 80},
        {.name = "Grace", .score = 99}
    };

    Student copy = class[1];
    strcpy(class[1].name, "Dennis");

    for (int i = 0; i < 3; i++) {
        printf("%s: %d\n", class[i].name, class[i].score);
    }
    printf("copy still says %s\n", copy.name);
    return 0;
}
```

Notice `class[i].name`: first pick the array element, then the member. Text members are filled with `strcpy`, not `=`, as in the strings lesson.

:::exercise code "Best student"
Read a number `n`, then `n` lines, each with a name (one word, at most 19 letters) and a score. Store them in an array of `Student` (at most 10) and print the name and score of the student with the highest score. If scores tie, the first one wins.

```text
best: Ada (95)
```

```c starter
#include <stdio.h>

typedef struct {
    char name[20];
    int score;
} Student;

int main(void) {
    Student s[10];
    int n;
    scanf("%d", &n);

    // read n students, find the best, print

    return 0;
}
```

```c solution
#include <stdio.h>

typedef struct {
    char name[20];
    int score;
} Student;

int main(void) {
    Student s[10];
    int n;
    scanf("%d", &n);

    for (int i = 0; i < n; i++) {
        scanf("%19s %d", s[i].name, &s[i].score);
    }

    int best = 0;
    for (int i = 1; i < n; i++) {
        if (s[i].score > s[best].score) {
            best = i;
        }
    }
    printf("best: %s (%d)\n", s[best].name, s[best].score);
    return 0;
}
```

```test
name: three students
stdin: 3\nAda 95\nLinus 80\nGrace 99
expect:
best: Grace (99)
```

```test
name: single
stdin: 1\nSolo 7
expect:
best: Solo (7)
```

```test
name: tie, first wins
stdin: 4\nAnn 50\nBob 70\nCid 70\nDee 10
expect:
best: Bob (70)
```

```hint
Read in a loop: `scanf("%19s %d", s[i].name, &s[i].score);`. The name is an array, so it needs no `&`.
```

```hint
Remember the index of the best student so far (`best`), starting at 0. Update it when `s[i].score > s[best].score`.
```
:::

## Memory layout and padding

Members are stored in the order you wrote them, but the compiler may leave small gaps called **padding**. Many processors read memory fastest (or only) when a 4-byte `int` starts at an address divisible by 4, and an 8-byte `double` at an address divisible by 8. So the compiler inserts empty bytes to keep each member aligned.

The macro `offsetof(type, member)` from `<stddef.h>` ([docs](https://en.cppreference.com/w/c/types/offsetof)) tells you how many bytes from the start of the struct a member begins.

```c run
#include <stdio.h>
#include <stddef.h>

struct mixed {
    char c;
    int i;
    double d;
};

int main(void) {
    printf("offset of c: %zu\n", offsetof(struct mixed, c));
    printf("offset of i: %zu\n", offsetof(struct mixed, i));
    printf("offset of d: %zu\n", offsetof(struct mixed, d));
    printf("sizeof: %zu\n", sizeof(struct mixed));
    return 0;
}
```

The members add up to 1 + 4 + 8 = 13 bytes, yet the struct takes 16:

```memory
caption: struct mixed starting at a made-up address 0x1000
0x1000* | c | char | 'x' | 1 byte
0x1001  | (padding) |  |  | 3 unused bytes
0x1004* | i | int | 42 | starts at a multiple of 4
0x1008* | d | double | 3.14 | starts at a multiple of 8 (8 bytes)
0x1010  | (next thing) |  |  | the struct ended at offset 16
```

Order matters: the same three members declared as `double d; int i; char c;` need only 8 + 4 + 1 = 13 bytes plus 3 bytes of padding at the end, so the size is also 16 here, but a struct with several small members benefits a lot from being sorted largest to smallest. Never assume `sizeof(struct)` is the sum of its members; always ask `sizeof`.

:::exercise fill "Where does each member start?"
This struct is laid out on this machine (`int` is 4 bytes and must start at a multiple of 4):

```c
struct pair {
    char tag;
    int number;
};
```

Fill in the addresses, assuming the struct starts at `0x1000`.

```memory
caption: struct pair at 0x1000
0x1000 | tag | char | 'a'
0x1001 | (padding) |  |  | 3 bytes
[[0x1004]] | number | int | 7
[[0x1008]] | (end) |  |  | the next free address
```

```explain
`tag` takes 1 byte at `0x1000`. The `int` must start at a multiple of 4, so 3 bytes of padding follow and `number` starts at `0x1004`. It occupies 4 bytes, so the struct ends at `0x1008` and `sizeof(struct pair)` is 8.
```
:::

:::exercise quiz "Size of a struct"
On this platform, what is `sizeof(struct { int a; char b; })`?

```options
- [ ] 5
- [ ] 4
- [x] 8
- [ ] 6
```

```explain
The struct as a whole must also be aligned for its `int` member, so its size is rounded up to a multiple of 4. `a` takes 4 bytes, `b` 1 byte, and 3 padding bytes are added at the end: 8. This matters in arrays of structs: the next element must start with its `int` correctly aligned too.
```
:::
