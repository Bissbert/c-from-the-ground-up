---
id: linked-lists
title: Linked lists
subtitle: Chain heap-allocated nodes together with pointers, and pull everything you have learned into one project.
minutes: 50
goals: Define a self-referential struct and link nodes with next pointers
goals: Traverse a list to print, count, sum and search it
goals: Insert at the front with malloc and free a whole list without leaks
goals: Combine structs, pointers and dynamic memory in a small complete program
docs: malloc | https://en.cppreference.com/w/c/memory/malloc
docs: free | https://en.cppreference.com/w/c/memory/free
docs: struct declaration | https://en.cppreference.com/w/c/language/struct
docs: Member access operators | https://en.cppreference.com/w/c/language/operator_member_access
---

## Nodes that point to nodes

An array keeps its items in one solid block, and growing it means copying everything (`realloc`). A **linked list** takes a different approach: every item lives in its own small heap block called a **node**, and each node stores the address of the next one. Adding an item never moves the others.

A node needs two things: the data, and a pointer to the next node. So the struct contains a pointer to *its own type*:

```c
struct node {
    int value;
    struct node *next;
};
```

The last node has nothing after it, so its `next` is `NULL`. The list as a whole is represented by a single pointer to the first node, called the **head**. An empty list is simply `head == NULL`.

> [!NOTE]
> Why `struct node *next` and not `struct node next`? A struct cannot contain a complete copy of itself: that copy would contain another copy, and so on forever, and the size would be infinite. A *pointer* is always 4 bytes here, so it is fine.

:::exercise quiz "A struct that refers to itself"
Why does `struct node` hold a `struct node *next` instead of a `struct node next`?

```options
- [ ] Pointers are faster than structs
- [x] A struct containing itself would need infinite size; a pointer has a fixed size
- [ ] Because `next` must always be `NULL`
- [ ] The compiler requires every struct member to be a pointer
```

```explain
Each node would have to contain a node, which contains a node, and so on. A pointer to a node needs only 4 bytes, no matter how long the chain behind it is.
```
:::

## Building a list by hand

Let us create three nodes on the heap and connect them: 10, then 20, then 30.

```c run
#include <stdio.h>
#include <stdlib.h>

struct node {
    int value;
    struct node *next;
};

int main(void) {
    struct node *a = malloc(sizeof *a);
    struct node *b = malloc(sizeof *b);
    struct node *c = malloc(sizeof *c);
    if (a == NULL || b == NULL || c == NULL) {
        return 1;
    }

    a->value = 10;
    a->next = b;
    b->value = 20;
    b->next = c;
    c->value = 30;
    c->next = NULL;

    struct node *head = a;
    printf("first: %d\n", head->value);
    printf("second: %d\n", head->next->value);
    printf("third: %d\n", head->next->next->value);

    free(a);
    free(b);
    free(c);
    return 0;
}
```

In memory the nodes sit anywhere in the heap, and the `next` pointers are what ties them together (heap addresses made up but realistic):

```memory
caption: head -> 10 -> 20 -> 30 -> NULL
0xfff8*  | head | struct node * | 0x111e0 | on the stack: the only way in
0x111e0* | a->value | int | 10 | node 1
0x111e4  | a->next | struct node * | 0x111f0 | points to node 2
0x111f0* | b->value | int | 20 | node 2
0x111f4  | b->next | struct node * | 0x11200 | points to node 3
0x11200* | c->value | int | 30 | node 3
0x11204  | c->next | struct node * | NULL | end of the list
```

Note `head->next->next->value`: follow a pointer, then another, then pick a member. Writing this chain by hand is silly for long lists, so we use a loop.

:::exercise fill "Follow the pointers"
Fill in the `next` pointers of this list. The nodes are at `0x111e0`, `0x111f0` and `0x11200`, in the order 5, 6, 7. For the end of the list write `NULL`.

```memory
caption: head -> 5 -> 6 -> 7
0x111e0 | n1.value | int | 5
0x111e4 | n1.next | struct node * | [[0x111f0]]
0x111f0 | n2.value | int | 6
0x111f4 | n2.next | struct node * | [[0x11200]]
0x11200 | n3.value | int | 7
0x11204 | n3.next | struct node * | [[NULL]]
```

```explain
Each `next` holds the address of the following node: node 1 points to `0x111f0`, node 2 to `0x11200`. The last node has nothing after it, so its `next` is `NULL`.
```
:::

## Walking along the list

To visit every node, keep a pointer `p` that starts at the head and moves with `p = p->next` until it becomes `NULL`. This is the single most important loop for linked lists:

```c
for (struct node *p = head; p != NULL; p = p->next) {
    /* use p->value */
}
```

The next program uses it for four jobs: print, count, sum and search. (The nodes here are ordinary variables, so no `malloc` is needed for this demonstration.)

```c run
#include <stdio.h>

struct node {
    int value;
    struct node *next;
};

void print_list(const struct node *head) {
    for (const struct node *p = head; p != NULL; p = p->next) {
        printf("%d ", p->value);
    }
    printf("\n");
}

int count(const struct node *head) {
    int n = 0;
    for (const struct node *p = head; p != NULL; p = p->next) {
        n++;
    }
    return n;
}

int sum(const struct node *head) {
    int total = 0;
    for (const struct node *p = head; p != NULL; p = p->next) {
        total += p->value;
    }
    return total;
}

int contains(const struct node *head, int target) {
    for (const struct node *p = head; p != NULL; p = p->next) {
        if (p->value == target) {
            return 1;
        }
    }
    return 0;
}

int main(void) {
    struct node c = {30, NULL};
    struct node b = {20, &c};
    struct node a = {10, &b};

    print_list(&a);
    printf("count %d, sum %d\n", count(&a), sum(&a));
    printf("contains 20: %d, contains 99: %d\n", contains(&a, 20), contains(&a, 99));
    return 0;
}
```

An empty list works with no special code: the loop body never runs, so `count` returns 0 and `sum` returns 0.

:::exercise predict "Chasing next"
What does this program print?

```c code
#include <stdio.h>

struct node {
    int value;
    struct node *next;
};

int main(void) {
    struct node c = {30, NULL};
    struct node b = {20, &c};
    struct node a = {10, &b};

    struct node *p = &a;
    printf("%d\n", p->value);
    p = p->next;
    printf("%d\n", p->value);
    printf("%d\n", p->next->value);
    p = p->next->next;
    printf("%d\n", p == NULL);
    return 0;
}
```

```explain
`p` starts at `a` (10). After `p = p->next` it is at `b` (20), and `p->next->value` is the value of `c`, which is 30. Then `p->next->next` is `c.next`, which is `NULL`, so `p == NULL` is true and prints 1.
```
:::

## Inserting at the front

Adding a node at the **front** is the easy case, and fast no matter how long the list is (O(1), as computer scientists say):

1. allocate a new node and fill in its value,
2. make its `next` point at the old head,
3. the new node is now the head.

```c
struct node *push_front(struct node *head, int value) {
    struct node *n = malloc(sizeof *n);
    if (n == NULL) {
        exit(1);
    }
    n->value = value;
    n->next = head;     // link to the old list
    return n;           // the new head
}
```

The function **returns the new head**, and the caller stores it: `head = push_front(head, 5);`. (Why not just change `head` inside the function? Because the function receives a *copy* of the pointer, just as with any pass by value. Returning the new head sidesteps that.)

```c run
#include <stdio.h>
#include <stdlib.h>

struct node {
    int value;
    struct node *next;
};

struct node *push_front(struct node *head, int value) {
    struct node *n = malloc(sizeof *n);
    if (n == NULL) {
        exit(1);
    }
    n->value = value;
    n->next = head;
    return n;
}

int main(void) {
    struct node *head = NULL;
    head = push_front(head, 1);
    head = push_front(head, 2);
    head = push_front(head, 3);

    for (struct node *p = head; p != NULL; p = p->next) {
        printf("%d ", p->value);
    }
    printf("\n");
    return 0;     /* we leak the nodes here; the next section fixes that */
}
```

It prints `3 2 1`: the newest item is always at the front, so inserting 1, 2, 3 yields the list in reverse. Remember this, it will be useful in a moment.

:::exercise code "Count and sum"
The starter already contains the node type, `push_front`, and a `main` that reads integers until `0` into a list. Implement `count` (how many nodes) and `sum` (total of all values). The program prints `count: C` and `sum: S`.

```c starter
#include <stdio.h>
#include <stdlib.h>

struct node {
    int value;
    struct node *next;
};

struct node *push_front(struct node *head, int value) {
    struct node *n = malloc(sizeof *n);
    if (n == NULL) {
        exit(1);
    }
    n->value = value;
    n->next = head;
    return n;
}

int count(const struct node *head) {
    // walk the list
    return 0;
}

int sum(const struct node *head) {
    // walk the list
    return 0;
}

int main(void) {
    struct node *head = NULL;
    int v;
    while (scanf("%d", &v) == 1 && v != 0) {
        head = push_front(head, v);
    }
    printf("count: %d\n", count(head));
    printf("sum: %d\n", sum(head));
    return 0;
}
```

```c solution
#include <stdio.h>
#include <stdlib.h>

struct node {
    int value;
    struct node *next;
};

struct node *push_front(struct node *head, int value) {
    struct node *n = malloc(sizeof *n);
    if (n == NULL) {
        exit(1);
    }
    n->value = value;
    n->next = head;
    return n;
}

int count(const struct node *head) {
    int n = 0;
    for (const struct node *p = head; p != NULL; p = p->next) {
        n++;
    }
    return n;
}

int sum(const struct node *head) {
    int total = 0;
    for (const struct node *p = head; p != NULL; p = p->next) {
        total += p->value;
    }
    return total;
}

int main(void) {
    struct node *head = NULL;
    int v;
    while (scanf("%d", &v) == 1 && v != 0) {
        head = push_front(head, v);
    }
    printf("count: %d\n", count(head));
    printf("sum: %d\n", sum(head));
    return 0;
}
```

```test
name: four numbers
stdin: 5 10 -3 8 0
source-has: ->next
expect:
count: 4
sum: 20
```

```test
name: empty list
stdin: 0
expect:
count: 0
sum: 0
```

```test
name: one number
stdin: 42 0
expect:
count: 1
sum: 42
```

```hint
Use the walking loop: `for (const struct node *p = head; p != NULL; p = p->next)`.
```

```hint
In `count`, add 1 per node. In `sum`, add `p->value` per node. Return the total after the loop.
```
:::

:::exercise code "Find a value"
Write `struct node *find(struct node *head, int target)` that returns a pointer to the first node whose value equals `target`, or `NULL` if there is none. `main` is given: it reads numbers until `0`, then reads a target and prints `found` or `not found`. If found, it also doubles that node's value through the pointer and prints the whole list.

```text
found
10 14 6 2
```

```c starter
#include <stdio.h>
#include <stdlib.h>

struct node {
    int value;
    struct node *next;
};

struct node *push_front(struct node *head, int value) {
    struct node *n = malloc(sizeof *n);
    if (n == NULL) {
        exit(1);
    }
    n->value = value;
    n->next = head;
    return n;
}

struct node *find(struct node *head, int target) {
    // return the matching node or NULL
    return NULL;
}

int main(void) {
    struct node *head = NULL;
    int v;
    while (scanf("%d", &v) == 1 && v != 0) {
        head = push_front(head, v);
    }
    int target;
    scanf("%d", &target);

    struct node *hit = find(head, target);
    if (hit == NULL) {
        printf("not found\n");
    } else {
        printf("found\n");
        hit->value *= 2;
        for (struct node *p = head; p != NULL; p = p->next) {
            printf("%d ", p->value);
        }
        printf("\n");
    }
    return 0;
}
```

```c solution
#include <stdio.h>
#include <stdlib.h>

struct node {
    int value;
    struct node *next;
};

struct node *push_front(struct node *head, int value) {
    struct node *n = malloc(sizeof *n);
    if (n == NULL) {
        exit(1);
    }
    n->value = value;
    n->next = head;
    return n;
}

struct node *find(struct node *head, int target) {
    for (struct node *p = head; p != NULL; p = p->next) {
        if (p->value == target) {
            return p;
        }
    }
    return NULL;
}

int main(void) {
    struct node *head = NULL;
    int v;
    while (scanf("%d", &v) == 1 && v != 0) {
        head = push_front(head, v);
    }
    int target;
    scanf("%d", &target);

    struct node *hit = find(head, target);
    if (hit == NULL) {
        printf("not found\n");
    } else {
        printf("found\n");
        hit->value *= 2;
        for (struct node *p = head; p != NULL; p = p->next) {
            printf("%d ", p->value);
        }
        printf("\n");
    }
    return 0;
}
```

```test
name: found in the middle
stdin: 1 3 7 5 0 7
source-has: ->next
expect:
found
5 14 3 1
```

```test
name: missing
stdin: 4 5 6 0 9
expect:
not found
```

```test
name: found last pushed
stdin: 2 4 0 4
expect:
found
8 2
```

```hint
Walk the list like before, and `return p;` as soon as `p->value == target`.
```

```hint
After the loop (nothing matched) return `NULL`.
```
:::

## Freeing the whole list

Every node came from its own `malloc`, so every node needs its own `free`. The loop has one trap: after `free(p)` you must not read `p->next`. So save the next pointer **before** freeing:

```c
void free_list(struct node *head) {
    while (head != NULL) {
        struct node *next = head->next;   // remember where to go
        free(head);                        // now the node is gone
        head = next;
    }
}
```

`head` here is a local copy of the pointer, so moving it does not hurt the caller. Afterwards the caller should treat its own `head` as invalid; setting `head = NULL;` is a good habit.

```c run
#include <stdio.h>
#include <stdlib.h>

struct node {
    int value;
    struct node *next;
};

struct node *push_front(struct node *head, int value) {
    struct node *n = malloc(sizeof *n);
    if (n == NULL) {
        exit(1);
    }
    n->value = value;
    n->next = head;
    return n;
}

void free_list(struct node *head) {
    while (head != NULL) {
        struct node *next = head->next;
        free(head);
        head = next;
    }
}

int main(void) {
    struct node *head = NULL;
    for (int i = 1; i <= 5; i++) {
        head = push_front(head, i * i);
    }
    for (struct node *p = head; p != NULL; p = p->next) {
        printf("%d ", p->value);
    }
    printf("\n");

    free_list(head);
    head = NULL;
    return 0;
}
```

> [!WARN]
> The tempting loop `for (p = head; p != NULL; p = p->next) free(p);` is a use-after-free: it reads `p->next` from a node that was just freed. On this machine it may even appear to work. Do not rely on that.

## Project: reverse and sum

Time to combine everything: structs, pointers, `malloc`, a loop over a list and `free`. The final task:

> Read integers from the input until a `0` is read. Keep them in a linked list. Then print the numbers in **reverse order of input**, and their sum.

You already have the pieces: `push_front` produces the reverse order for free, a walking loop prints it, and `free_list` cleans up.

:::exercise code "Project: reversed list"
Read integers until `0` (the `0` itself is not stored). Store them in a linked list built with `malloc`, then print

```text
reversed: 3 2 1
sum: 6
```

For an input with no numbers before the `0`, print `reversed:` (nothing after it) and `sum: 0`. Free every node before the program ends. Use `struct node { int value; struct node *next; };`.

```c starter
#include <stdio.h>
#include <stdlib.h>

struct node {
    int value;
    struct node *next;
};

int main(void) {
    struct node *head = NULL;
    int v;

    // 1. read numbers until 0 and push each one onto the front of the list
    // 2. walk the list: print "reversed:" and each value, and add up the sum
    // 3. print the sum
    // 4. free the whole list

    return 0;
}
```

```c solution
#include <stdio.h>
#include <stdlib.h>

struct node {
    int value;
    struct node *next;
};

int main(void) {
    struct node *head = NULL;
    int v;

    while (scanf("%d", &v) == 1 && v != 0) {
        struct node *n = malloc(sizeof *n);
        if (n == NULL) {
            return 1;
        }
        n->value = v;
        n->next = head;
        head = n;
    }

    int total = 0;
    printf("reversed:");
    for (struct node *p = head; p != NULL; p = p->next) {
        printf(" %d", p->value);
        total += p->value;
    }
    printf("\n");
    printf("sum: %d\n", total);

    while (head != NULL) {
        struct node *next = head->next;
        free(head);
        head = next;
    }
    return 0;
}
```

```test
name: three numbers
stdin: 1 2 3 0
source-has: malloc
source-has: free(
source-has: ->next
expect:
reversed: 3 2 1
sum: 6
```

```test
name: negative and zero ends it
stdin: 10 -4 7 0 55 66
source-has: malloc
expect:
reversed: 7 -4 10
sum: 13
```

```test
name: nothing before zero
stdin: 0
source-has: free(
expect:
reversed:
sum: 0
```

```test
name: a longer list
stdin: 5 4 3 2 1 6 7 8 9 10 0
source-has: malloc
expect:
reversed: 10 9 8 7 6 1 2 3 4 5
sum: 55
```

```hint
Start with `head = NULL`. For each number: `struct node *n = malloc(sizeof *n); n->value = v; n->next = head; head = n;`. Pushing onto the front already gives the reversed order.
```

```hint
Print with `printf("reversed:");` first, then in the walking loop `printf(" %d", p->value);` and `total += p->value;`. End the line with `printf("\n");`.
```

```hint
To free: `while (head != NULL) { struct node *next = head->next; free(head); head = next; }`.
```
:::

## Where to go next

You have come a long way: from `printf("Hello")` to pointers, heap memory and a data structure you built yourself. Almost everything in a large C program is a variation on these ideas. Here are good next steps.

**Books and references**

- *The C Programming Language* by Kernighan and Ritchie ("K&R"): short, precise, written by the people who created C. Work through the exercises.
- [cppreference.com, C section](https://en.cppreference.com/w/c): the reference you have used in this course. Learn to read the function pages, they answer most questions.

**More topics to explore**

- **File input/output**: `fopen`, `fgets`, `fprintf`, `fclose`. Reading and writing real files (not possible in this browser sandbox).
- **Multiple source files**: headers, include guards and the linker, as sketched in the previous lesson.
- **Makefiles** (or CMake): build a project of many files with one command.
- **More data structures**: doubly linked lists, stacks, queues, hash tables, binary trees. Each is "structs plus pointers" like the list you wrote.
- **Function pointers, `qsort`, bit operations, `union`**: the remaining corners of the language.

**Tools on a real machine**

Your own computer will show you things this browser cannot:

- Compile with warnings on: `clang -Wall -Wextra -std=c17 -g main.c -o main`.
- **gdb** or **lldb**: a debugger. Step line by line, print variables, find where a crash happens.
- **Valgrind** (Linux): detects memory leaks, use-after-free and invalid reads and writes.
- **AddressSanitizer and UndefinedBehaviorSanitizer**: add `-fsanitize=address,undefined` when compiling, and the program stops with a clear report when it makes a memory mistake. Those bugs which silently "worked" in this browser will be caught right away.

> [!TIP]
> The best way to learn now is to build small projects: a to-do list manager, a text-adventure, a simple calculator, a tiny database. When you get stuck, shrink the problem, print values, and read the compiler messages. Good luck!
