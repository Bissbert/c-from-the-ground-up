---
id: pointers-to-structs
title: Pointers to structs
subtitle: Let functions change a struct, and avoid copying big ones, with the arrow operator.
minutes: 30
goals: Declare a pointer to a struct and reach its members with -> (and the long form (*p).x)
goals: Write functions that modify a struct through a pointer
goals: Use const struct pointers for read-only access
goals: Walk through an array of structs with a pointer, and choose between returning a struct and filling one
docs: Member access operators | https://en.cppreference.com/w/c/language/operator_member_access
docs: struct declaration | https://en.cppreference.com/w/c/language/struct
docs: const qualifier | https://en.cppreference.com/w/c/language/const
---

## A pointer that points at a struct

Pointers work with every type, structs included. `Point *p` is "a pointer to a `Point`". Take the address with `&`, as always.

To reach a member through the pointer you must first follow it (`*p`) and then pick the member. The dot binds tighter than `*`, so the parentheses are needed:

```c run
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

int main(void) {
    Point a = {3, 4};
    Point *p = &a;

    printf("(*p).x = %d\n", (*p).x);
    (*p).y = 40;
    printf("a.y is now %d\n", a.y);
    return 0;
}
```

Without parentheses, `*p.x` would mean `*(p.x)`, which is a compile error because `p` is a pointer and has no member `x`.

Because `(*p).x` is so common, C has a shorthand: the **arrow operator**. `p->x` means exactly `(*p).x`. Read it as "the `x` of the thing `p` points to".

```c run
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

int main(void) {
    Point a = {3, 4};
    Point *p = &a;

    p->x = 30;
    printf("a = (%d, %d)\n", a.x, a.y);
    printf("p->y = %d\n", p->y);
    return 0;
}
```

```memory
caption: p holds the address of a (addresses as the real compiler might show them)
0xfff0* | a.x | int | 30
0xfff4  | a.y | int | 4
0xffe8* | p | Point * | 0xfff0 | points at a
```

> [!TIP]
> Rule of thumb: use `.` when you have the struct itself, use `->` when you have a pointer to it.

:::exercise fill "Dot or arrow?"
Complete the program so it prints `10` and then `2`.

```c code
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

int main(void) {
    Point p = {1, 2};
    Point *ptr = [[&p]];
    ptr[[->]]x = 10;
    printf("%d\n", p.x);
    printf("%d\n", (*ptr).[[y]]);
    return 0;
}
```

```explain
`ptr` must hold the address of `p`, so `&p`. `ptr->x = 10` changes `p.x` itself. `(*ptr).y` is the long way of writing `ptr->y`, which is 2.
```
:::

## Modifying a struct through a pointer

Remember: passing a struct to a function hands over a **copy**, so the function cannot change your original. Pass a **pointer** instead and the function can reach the original.

```c run
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

void shift_copy(Point p) {
    p.x += 100;
}

void shift(Point *p) {
    p->x += 100;
}

int main(void) {
    Point a = {1, 2};
    shift_copy(a);
    printf("after shift_copy: x = %d\n", a.x);
    shift(&a);
    printf("after shift:      x = %d\n", a.x);
    return 0;
}
```

The call site changes too: `shift(&a)` passes the address. A pointer is only 4 bytes on this machine, no matter how big the struct is.

:::exercise predict "Copy versus pointer"
What does this print?

```c code
#include <stdio.h>

typedef struct {
    int lives;
    int coins;
} Game;

void a_func(Game g) {
    g.lives--;
    g.coins += 10;
}

void b_func(Game *g) {
    g->lives--;
    g->coins += 10;
}

int main(void) {
    Game game = {3, 0};
    a_func(game);
    b_func(&game);
    b_func(&game);
    printf("%d %d\n", game.lives, game.coins);
    return 0;
}
```

```explain
`a_func` works on a copy, so it changes nothing. `b_func` runs twice on the real struct: lives 3 becomes 1, coins 0 becomes 20.
```
:::

:::exercise code "Translate a point"
Write `void translate(Point *p, int dx, int dy)` that adds `dx` to `p->x` and `dy` to `p->y`. In `main` read `x y dx dy`, call `translate` on the point and print it as `(x, y)`.

```c starter
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

// write translate here

int main(void) {
    Point p;
    int dx, dy;
    scanf("%d %d %d %d", &p.x, &p.y, &dx, &dy);

    // call translate and print

    return 0;
}
```

```c solution
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

void translate(Point *p, int dx, int dy) {
    p->x += dx;
    p->y += dy;
}

int main(void) {
    Point p;
    int dx, dy;
    scanf("%d %d %d %d", &p.x, &p.y, &dx, &dy);

    translate(&p, dx, dy);
    printf("(%d, %d)\n", p.x, p.y);
    return 0;
}
```

```test
name: move right and up
stdin: 1 2 10 20
source-has: ->
expect:
(11, 22)
```

```test
name: negative move
stdin: 5 5 -7 3
source-has: ->
expect:
(-2, 8)
```

```test
name: no move
stdin: 0 0 0 0
source-has: ->
expect:
(0, 0)
```

```hint
The function returns nothing (`void`); it changes the struct that `p` points to.
```

```hint
Inside: `p->x += dx;` and `p->y += dy;`. In `main`, call it with `translate(&p, dx, dy);`.
```
:::

## const: look but don't touch

Passing a pointer avoids copying a big struct, but it also lets the function change the original, even when it only wants to read. Mark the pointer's target `const` to forbid that. The compiler then rejects any write.

```c run
#include <stdio.h>

typedef struct {
    char name[20];
    int numbers[100];
} Report;

int total(const Report *r) {
    int sum = 0;
    for (int i = 0; i < 100; i++) {
        sum += r->numbers[i];
    }
    // r->numbers[0] = 0;   // would not compile: r points to const data
    return sum;
}

int main(void) {
    Report rep = {.name = "Q1", .numbers = {5, 10, 15}};
    printf("sizeof Report = %zu\n", sizeof rep);
    printf("sizeof pointer = %zu\n", sizeof(&rep));
    printf("total = %d\n", total(&rep));
    return 0;
}
```

Copying `Report` into every call would move 420 bytes; passing the pointer moves 4. The rule: **pass a `const T *` when the function only reads a struct**; pass a plain `T *` when it must modify it; pass by value only for small structs where a copy is harmless (like `Point`).

:::exercise quiz "What may a const pointer do?"
Given `void f(const Point *p)` and a second variable `Point other;`, which statements compile without error?

```options
- [x] `int a = p->x;`
- [ ] `p->x = 5;`
- [x] `p = &other;`
- [ ] `(*p).y = 1;`
```

```explain
`const Point *p` means "a pointer to a constant Point": the **target** is read-only, so `p->x = 5` and `(*p).y = 1` are errors. The pointer variable itself is not const, so it may be re-pointed at another variable. (To forbid that too you would write `const Point *const p`.)
```
:::

## Arrays of structs and pointers

An array of structs is a row of structs in memory, and a pointer to the first element can walk along it with `p++`, which moves by one whole struct (pointer arithmetic, as in the arrays lesson).

```c run
#include <stdio.h>

typedef struct {
    char name[10];
    int price;
} Item;

void print_items(const Item *items, int n) {
    const Item *end = items + n;
    for (const Item *p = items; p < end; p++) {
        printf("%-6s %3d\n", p->name, p->price);
    }
}

int main(void) {
    Item shop[3] = {{"tea", 3}, {"cake", 5}, {"soup", 8}};
    print_items(shop, 3);
    return 0;
}
```

A function can also **return a pointer into the array** to say "this is the one you asked for", with no copying:

```c
Item *find_cheapest(Item *items, int n);
```

:::exercise code "Find the cheapest"
Complete `Item *cheapest(Item *items, int n)` that returns a pointer to the item with the lowest price (the first one if prices tie). `main` reads `n` (at most 10) and then `n` lines `name price`, and prints `cheapest: name price`.

```c starter
#include <stdio.h>

typedef struct {
    char name[20];
    int price;
} Item;

Item *cheapest(Item *items, int n) {
    // return a pointer to the cheapest item
    return items;
}

int main(void) {
    Item items[10];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%19s %d", items[i].name, &items[i].price);
    }

    Item *best = cheapest(items, n);
    printf("cheapest: %s %d\n", best->name, best->price);
    return 0;
}
```

```c solution
#include <stdio.h>

typedef struct {
    char name[20];
    int price;
} Item;

Item *cheapest(Item *items, int n) {
    Item *best = &items[0];
    for (int i = 1; i < n; i++) {
        if (items[i].price < best->price) {
            best = &items[i];
        }
    }
    return best;
}

int main(void) {
    Item items[10];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%19s %d", items[i].name, &items[i].price);
    }

    Item *best = cheapest(items, n);
    printf("cheapest: %s %d\n", best->name, best->price);
    return 0;
}
```

```test
name: three items
stdin: 3\ntea 3\ncake 5\nsoup 8
expect:
cheapest: tea 3
```

```test
name: cheapest last
stdin: 4\ngold 900\nsilver 50\ncopper 5\ntin 2
expect:
cheapest: tin 2
```

```test
name: tie keeps first
stdin: 3\nbread 4\nmilk 4\negg 6
expect:
cheapest: bread 4
```

```hint
Start with `Item *best = &items[0];` and look at the other items in a loop.
```

```hint
When `items[i].price < best->price`, set `best = &items[i];`. Finally `return best;`.
```
:::

## Return a struct or fill one?

There are two ways for a function to give you a struct:

```c
Point make_point(int x, int y) {      // 1. return a copy
    Point p = {x, y};
    return p;
}

void init_point(Point *p, int x, int y) {   // 2. fill the caller's struct
    p->x = x;
    p->y = y;
}
```

Returning is easy to read, and fine for small structs. Filling through a pointer avoids copying large structs and lets a function fill several structs, or report success in its return value (as `scanf` does). Many C libraries use the second style.

> [!WARN]
> Never return a pointer to a *local* struct from a function. The local variable disappears when the function ends. The next lesson explains why, and how to create data that survives.

:::exercise code "Read a student through a pointer"
Write `void read_student(Student *s)` that reads a name (one word) and a score with `scanf` straight into the struct the pointer refers to. Then `main` should call it and print `name: score`.

```c starter
#include <stdio.h>

typedef struct {
    char name[20];
    int score;
} Student;

// write read_student here

int main(void) {
    Student s;
    // call read_student, then print
    return 0;
}
```

```c solution
#include <stdio.h>

typedef struct {
    char name[20];
    int score;
} Student;

void read_student(Student *s) {
    scanf("%19s %d", s->name, &s->score);
}

int main(void) {
    Student s;
    read_student(&s);
    printf("%s: %d\n", s.name, s.score);
    return 0;
}
```

```test
name: Ada
stdin: Ada 95
source-has: ->
expect:
Ada: 95
```

```test
name: Linus
stdin: Linus 7
source-has: ->
expect:
Linus: 7
```

```hint
Inside the function, `s->name` is the array (no `&` needed) and `&s->score` is the address of the score member.
```

```hint
`scanf("%19s %d", s->name, &s->score);` does it all in one line.
```
:::
