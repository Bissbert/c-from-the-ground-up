---
id: constants-enums
title: Constants, enums and the preprocessor
subtitle: Give names to magic numbers and states, and see what happens before the compiler starts.
minutes: 35
goals: Use const and #define to name fixed values, and explain how they differ
goals: Describe the preprocessor as text substitution and avoid the classic macro pitfalls
goals: Model a set of states with enum and handle them with switch
goals: Explain what header files and #include do, and use bool from stdbool.h
docs: const qualifier | https://en.cppreference.com/w/c/language/const
docs: Preprocessor replacing text (#define) | https://en.cppreference.com/w/c/preprocessor/replace
docs: Source file inclusion (#include) | https://en.cppreference.com/w/c/preprocessor/include
docs: Enumerations | https://en.cppreference.com/w/c/language/enum
docs: Boolean type (stdbool.h) | https://en.cppreference.com/w/c/types/boolean
---

## Magic numbers and const

Look at this line: `if (age >= 18)`. What is 18? The legal age? A limit in a game? A number that appears in code without explanation is called a **magic number**. If it appears in ten places and the rule changes, you must find and fix all ten.

The cure is to give the value a name. The first tool is `const`, which turns a variable into a read-only one ([docs](https://en.cppreference.com/w/c/language/const)):

```c run
#include <stdio.h>

int main(void) {
    const int ADULT_AGE = 18;
    int age = 20;

    if (age >= ADULT_AGE) {
        printf("adult\n");
    }
    return 0;
}
```

Trying to change a `const` variable is a compile error, which is exactly the point: the compiler guards your intention.

```c run error
#include <stdio.h>

int main(void) {
    const int MAX = 10;
    MAX = 20;
    printf("%d\n", MAX);
    return 0;
}
```

## The preprocessor and #define

Before the compiler even looks at your program, a first tool called the **preprocessor** reads it. It handles every line starting with `#`. Its job is plain **text substitution**: it knows nothing about C types or meaning, it just copies and replaces text.

`#define NAME replacement` tells it: "wherever you see the word `NAME`, put `replacement` instead" ([docs](https://en.cppreference.com/w/c/preprocessor/replace)).

```c run
#include <stdio.h>

#define MAX_PLAYERS 4
#define GREETING "Welcome!"

int main(void) {
    int scores[MAX_PLAYERS];
    for (int i = 0; i < MAX_PLAYERS; i++) {
        scores[i] = i * 10;
    }
    printf("%s We have %d players.\n", GREETING, MAX_PLAYERS);
    printf("last score: %d\n", scores[MAX_PLAYERS - 1]);
    return 0;
}
```

What the compiler really receives is the program with the names replaced:

```c
int scores[4];
for (int i = 0; i < 4; i++) { ... }
printf("%s We have %d players.\n", "Welcome!", 4);
```

There is no `=` and no `;` in a `#define` line. By convention the names are written in **ALL_CAPS**, so that when you read code you can instantly tell "this is a constant or a macro, not a variable".

> [!TIP]
> `#define` (or an `enum`, below) is the usual way to give the size of an array: `int a[MAX_PLAYERS];`. In C a `const int` is *not* a true constant expression, so `const int N = 4; int a[N];` makes a variable-length array, which you should avoid.

### Macros with parameters, and their traps

A `#define` can take parameters and then looks like a function, called a **macro**. But it is still only text replacement, which causes a famous trap:

```c run
#include <stdio.h>

#define SQUARE_BAD(x) x * x
#define SQUARE(x) ((x) * (x))

int main(void) {
    printf("bad:  %d\n", SQUARE_BAD(2 + 3));
    printf("good: %d\n", SQUARE(2 + 3));
    return 0;
}
```

`SQUARE_BAD(2 + 3)` becomes `2 + 3 * 2 + 3`, which is 11, not 25. The cure: put parentheses around every parameter and around the whole body. Another trap is that an argument is pasted as many times as it appears, so `SQUARE(i++)` would increment `i` twice. For anything beyond a constant, prefer a real function.

:::exercise predict "Text, not values"
What does this print?

```c code
#include <stdio.h>

#define DOUBLE(x) x * 2
#define TRIPLE(x) ((x) * 3)

int main(void) {
    printf("%d\n", DOUBLE(1 + 4));
    printf("%d\n", TRIPLE(1 + 4));
    return 0;
}
```

```explain
`DOUBLE(1 + 4)` is replaced by the text `1 + 4 * 2`, and multiplication comes first: 1 + 8 = 9. `TRIPLE(1 + 4)` becomes `((1 + 4) * 3)` = 15. The preprocessor does not calculate; it pastes.
```
:::

:::exercise fill "Safe macro"
Complete the macro so that `HALF(10 + 2)` gives 6. Remember the parentheses.

```c code
#include <stdio.h>

#define HALF(x) [[((x) / 2)|(x) / 2]]

int main(void) {
    printf("%d\n", HALF(10 + 2));
    return 0;
}
```

```explain
Without parentheses `10 + 2 / 2` would be 11. With `(x)` wrapped, the argument is evaluated as a whole first: `(10 + 2) / 2` = 6. Wrapping the entire body as well protects the macro when it sits inside a bigger expression.
```
:::

:::exercise quiz "const or #define?"
Which statements are true?

```options
- [x] `#define` is handled by the preprocessor before compilation as text replacement
- [x] A `const` variable has a type and the compiler checks it
- [ ] A `#define` constant is stored in memory and has an address you can print with `&`
- [ ] You write `#define MAX = 10;` with an equals sign and a semicolon
```

```explain
A macro name is replaced by text and no longer exists when compilation starts, so it has no address. A `const` is a real, typed variable. The `#define` syntax has neither `=` nor `;`; if you add them they become part of the replacement text, usually causing confusing errors.
```
:::

## Enums: named states

Suppose a traffic light can be red, green or yellow. You could encode that as `0`, `1`, `2`, but then `if (light == 2)` is unreadable. An **enum** ([docs](https://en.cppreference.com/w/c/language/enum)) defines a type whose values have names. Behind the scenes they are ordinary integers, numbered from 0 unless you say otherwise.

```c run
#include <stdio.h>

enum light { RED, GREEN, YELLOW };

int main(void) {
    enum light now = GREEN;
    printf("GREEN is %d\n", now);
    printf("YELLOW is %d\n", YELLOW);

    if (now == GREEN) {
        printf("go!\n");
    }
    return 0;
}
```

You may set values yourself; the following names then continue counting from there:

```c
enum level { LOW = 1, MEDIUM = 5, HIGH };   // HIGH is 6
```

Enums and `switch` are a perfect pair: each `case` handles one named state, and clang can warn you when you forget one.

```c run
#include <stdio.h>

enum light { RED, GREEN, YELLOW };

const char *describe(enum light l) {
    switch (l) {
    case RED:
        return "stop";
    case GREEN:
        return "go";
    case YELLOW:
        return "get ready";
    }
    return "unknown";
}

int main(void) {
    printf("%s\n", describe(RED));
    printf("%s\n", describe(YELLOW));
    return 0;
}
```

Like macros, enum constants are written in ALL_CAPS. They are real compile-time constants, so `enum { SIZE = 10 };` is another good way to name an array size.

:::exercise quiz "Enum values"
Given `enum level { LOW = 1, MEDIUM = 5, HIGH };`, what is the value of `HIGH`?

```options
- [ ] 2
- [ ] 5
- [x] 6
- [ ] 10
```

```explain
A constant without an explicit value is one more than the previous constant. `MEDIUM` is 5, so `HIGH` is 6.
```
:::

:::exercise code "Next light"
Define `enum light { RED, GREEN, YELLOW }`. Read one integer (0, 1 or 2) giving the current light, convert it to the enum, and with a `switch` print the name of the **next** light in the cycle RED, then GREEN, then YELLOW, then RED again. Print `RED`, `GREEN` or `YELLOW`.

```c starter
#include <stdio.h>

// define the enum here

int main(void) {
    int n;
    scanf("%d", &n);

    // convert n to the enum, switch on it, print the next state

    return 0;
}
```

```c solution
#include <stdio.h>

enum light { RED, GREEN, YELLOW };

int main(void) {
    int n;
    scanf("%d", &n);
    enum light now = (enum light)n;

    switch (now) {
    case RED:
        printf("GREEN\n");
        break;
    case GREEN:
        printf("YELLOW\n");
        break;
    case YELLOW:
        printf("RED\n");
        break;
    }
    return 0;
}
```

```test
name: after red
stdin: 0
source-has: enum
source-has: switch
expect:
GREEN
```

```test
name: after green
stdin: 1
source-has: enum
expect:
YELLOW
```

```test
name: after yellow
stdin: 2
source-has: switch
expect:
RED
```

```hint
Declare `enum light { RED, GREEN, YELLOW };` above `main`, then `enum light now = (enum light)n;`.
```

```hint
Write `switch (now)` with one `case` per light; each case prints the next name and ends with `break;`.
```
:::

## Headers, #include and several files

You already know `#include <stdio.h>`. It is a preprocessor command too: it **pastes the contents of another file** at that spot. That file, ending in `.h`, is a **header**. A header mostly holds *declarations*: the names and types of functions, structs, enums and macros, so that the compiler knows how to call `printf` before it sees its real code ([docs](https://en.cppreference.com/w/c/preprocessor/include)).

There are two spellings:

- `#include <stdio.h>` with angle brackets: look in the **system** directories, where the standard library headers live.
- `#include "mytools.h"` with double quotes: look first next to **your own** source file, then in the system directories.

Real programs are split over several files. A typical small project:

```text
geometry.h    declarations:  int area(int w, int h);
geometry.c    the code of area(), starts with #include "geometry.h"
main.c        #include "geometry.h", then calls area(3, 4)
```

Each `.c` file is compiled separately and a tool called the **linker** joins the pieces into one program. Header files protect themselves against being pasted twice with an **include guard**:

```c
#ifndef GEOMETRY_H
#define GEOMETRY_H

int area(int w, int h);

#endif
```

`#ifndef` means "if this name is not defined yet": the first time, the block is kept and `GEOMETRY_H` gets defined, the second time the whole block is skipped.

> [!NOTE]
> This course's editor compiles a single file, so you cannot try multiple files here. Everything works the same way on a real machine, where you would build with a command such as `clang main.c geometry.c -o program`.

## bool from stdbool.h

Old C had no true/false type; zero meant false and anything else meant true, which is how you used `int` flags so far. The header `<stdbool.h>` ([docs](https://en.cppreference.com/w/c/types/boolean)) adds the readable names `bool`, `true` and `false` (they are just macros for 1, 0 and a small integer type).

```c run
#include <stdio.h>
#include <stdbool.h>

bool is_even(int n) {
    return n % 2 == 0;
}

int main(void) {
    bool found = false;
    for (int i = 1; i <= 5; i++) {
        if (is_even(i) && i > 2) {
            found = true;
        }
    }
    printf("found: %d\n", found);
    printf("is_even(7): %s\n", is_even(7) ? "true" : "false");
    return 0;
}
```

`printf` has no special format for `bool`; it is promoted to an `int`, so `%d` prints 0 or 1.

:::exercise code "Is it prime?"
A prime number is greater than 1 and divisible only by 1 and itself. Write `bool is_prime(int n)` (include `<stdbool.h>`), read one integer and print `prime` or `not prime`. Use `bool`, a loop and early returns.

```c starter
#include <stdio.h>
#include <stdbool.h>

bool is_prime(int n) {
    // your code
    return false;
}

int main(void) {
    int n;
    scanf("%d", &n);
    printf("%s\n", is_prime(n) ? "prime" : "not prime");
    return 0;
}
```

```c solution
#include <stdio.h>
#include <stdbool.h>

bool is_prime(int n) {
    if (n < 2) {
        return false;
    }
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) {
            return false;
        }
    }
    return true;
}

int main(void) {
    int n;
    scanf("%d", &n);
    printf("%s\n", is_prime(n) ? "prime" : "not prime");
    return 0;
}
```

```test
name: 2 is prime
stdin: 2
source-has: bool
expect:
prime
```

```test
name: 1 is not
stdin: 1
expect:
not prime
```

```test
name: 21
stdin: 21
expect:
not prime
```

```test
name: 97
stdin: 97
expect:
prime
```

```test
name: 100
stdin: 100
expect:
not prime
```

```hint
Numbers below 2 are not prime. Otherwise try dividing by `d = 2, 3, 4, ...`: if `n % d == 0` for any of them, return `false`.
```

```hint
You only need to test divisors while `d * d <= n`. If the loop finishes without finding a divisor, `return true;`.
```
:::
