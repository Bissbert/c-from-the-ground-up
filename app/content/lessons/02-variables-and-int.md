---
id: variables-and-int
title: Variables and int
subtitle: Named boxes in memory that hold whole numbers.
minutes: 25
goals: Explain a variable as a named box in memory
goals: Declare, initialise, reassign and print an int
goals: Tell assignment (=) apart from equality in maths
goals: Recognise why an uninitialised variable holds garbage
docs: Integer types | https://en.cppreference.com/w/c/language/arithmetic_types
docs: Assignment operators | https://en.cppreference.com/w/c/language/operator_assignment
docs: printf | https://en.cppreference.com/w/c/io/fprintf
docs: Identifiers | https://en.cppreference.com/w/c/language/identifier
---

## A variable is a named box

A program needs to remember things: a score, an age, a temperature. The computer remembers things in its **memory**, which you can picture as a huge shelf of tiny boxes. Each box holds a value.

A **variable** is one of those boxes with a *name* stuck on it, so that you can say "the box called `age`" instead of pointing at a position on the shelf.

In C every variable also has a **type**, which says what kind of value fits in the box. The type we start with is `int`, short for *integer*: a whole number such as `7`, `0` or `-42`.

```memory
caption: One variable, drawn as a box (the address is made up for this picture)
0x1000* | age | int | 25
```

Read the row from left to right: the box lives at address `0x1000` (we will explain addresses properly in lesson 5), it is called `age`, its type is `int`, and it currently holds `25`.

## Declaring and initialising

Before you can use a variable you must **declare** it: tell the compiler its type and its name.

```c
int age;
```

That creates the box, but nothing useful is inside yet. To put a value in, you **assign** it with `=`:

```c
age = 25;
```

You can do both at once. Giving a variable its very first value at the moment it is created is called **initialisation**:

```c
int age = 25;
```

> [!WARN]
> In C, `=` does **not** mean "is equal to" like in maths. It means **store**: evaluate the right-hand side, then put the result into the box on the left. Read `age = 25;` as "age *becomes* 25".

To print an int with `printf` we use a **format specifier**. The text `%d` inside the string is a placeholder that gets replaced by the next argument, printed as a decimal integer.

```c run
#include <stdio.h>

int main(void) {
    int age = 25;
    printf("I am %d years old.\n", age);
    return 0;
}
```

:::exercise predict "Follow the box"
What does this program print?

```c code
#include <stdio.h>

int main(void) {
    int lives = 3;
    printf("%d\n", lives);
    lives = 2;
    printf("%d\n", lives);
    return 0;
}
```

```explain
First the box `lives` holds 3, so 3 is printed. Then `lives = 2;` throws the old value away and stores 2. The box can only hold one value at a time.
```
:::

## Reassigning and the memory picture

A variable is called *variable* because its value can **vary**. Assign again and the old value is overwritten. The type and the name never change, only the contents.

```c run
#include <stdio.h>

int main(void) {
    int a = 5;
    int b = 7;
    printf("a=%d b=%d\n", a, b);
    a = 9;
    b = a;
    printf("a=%d b=%d\n", a, b);
    return 0;
}
```

Notice `b = a;`. The right-hand side is evaluated first (it is the value `9` currently in `a`) and a **copy** of that value goes into `b`. The box `a` is not touched.

Here is the memory after `int a = 5; int b = 7;`:

```memory
caption: After the two declarations (addresses are made up)
0x1004* | b | int | 7
0x1000  | a | int | 5
```

:::exercise fill "Fill the boxes"
Here is the program:

```c
int a = 5;
int b = 7;
a = 9;
b = a;
```

Fill in what each box holds after the last line has run.

```memory
caption: Memory after b = a;
0x1004 | b | int | [[9]]
0x1000 | a | int | [[9]]
```

```explain
`a = 9;` overwrote 5 with 9. Then `b = a;` copied the 9 into `b`, replacing 7. Both boxes now hold 9, but they are still two separate boxes: changing `a` later would not change `b`.
```
:::

## Printing several values

You can use as many `%d` placeholders as you like. Each one is filled by the next argument, in order.

```c run
#include <stdio.h>

int main(void) {
    int width = 4;
    int height = 3;
    printf("%d by %d\n", width, height);
    printf("width is %d, height is %d\n", width, height);
    return 0;
}
```

You can also declare several variables of the same type in one line:

```c
int x = 1, y = 2, z;
```

Here `x` and `y` are initialised and `z` is not. Many programmers prefer one declaration per line because it is easier to read.

You can even print the result of a little calculation, such as `printf("%d\n", width + height);`. We will explore arithmetic in the next lesson.

:::exercise code "Two numbers"
Declare two `int` variables, `a` initialised to `12` and `b` initialised to `30`. Then print them in exactly this format:

```text
a=12 b=30
```

Then change `a` to `b`'s value (using `a = b;`) and print again:

```text
a=30 b=30
```

```c starter
#include <stdio.h>

int main(void) {
    // declare a and b here

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int a = 12;
    int b = 30;
    printf("a=%d b=%d\n", a, b);
    a = b;
    printf("a=%d b=%d\n", a, b);
    return 0;
}
```

```test
name: both lines
expect:
a=12 b=30
a=30 b=30
```

```test
name: uses variables, not hard-coded text
source-has: a = b
expect:
a=12 b=30
a=30 b=30
```

```hint
You need `int a = 12;` and `int b = 30;`, followed by a `printf` with two `%d` placeholders.
```

```hint
The format string is `"a=%d b=%d\n"` and the arguments are `a, b`. Use the same `printf` line twice, with `a = b;` between them.
```
:::

## Uninitialised variables hold garbage

What happens if you declare a variable but never give it a value?

```c run warn
#include <stdio.h>

int main(void) {
    int mystery;
    printf("%d\n", mystery);
    return 0;
}
```

The compiler warns you, and rightly so. Declaring `int mystery;` reserves a box, but C does **not** clear it. The box contains whatever bits were left there by earlier code: a **garbage** value. It might be `0`, it might be `-1347441`, and it may be different on each run or each computer.

> [!WARN]
> Reading an uninitialised variable is a bug. Your program may appear to work today and fail tomorrow. Always give a variable a value before you read it. When in doubt, initialise at the declaration.

:::exercise quiz "Garbage or not?"
Which of these programs reads a variable that has no meaningful value yet?

```options
- [ ] `int a = 4; printf("%d\n", a);`
- [x] `int a; printf("%d\n", a);`
- [ ] `int a; a = 4; printf("%d\n", a);`
- [ ] `int a = 1; a = 2; printf("%d\n", a);`
```

```explain
Only the second one prints a box that was never filled. In the third program `a` is declared first but assigned before it is read, which is fine.
```
:::

## Naming rules

You choose variable names, within these rules:

- Use letters, digits and underscores `_`.
- The name must **not start with a digit**: `score2` is fine, `2score` is not.
- No spaces or other symbols: `high_score` works, `high-score` means "high minus score".
- C is **case sensitive**: `Age`, `age` and `AGE` are three different variables.
- You cannot use **keywords** that C reserves, such as `int`, `return` or `if`.

Pick names that explain themselves: `temperature` is better than `t`, and much better than `x7`. Many C programmers write multi-word names with underscores, like `max_speed`.

:::exercise quiz "Legal names"
Which of these are valid variable names in C? Pick all that apply.

```options
- [x] `total_2`
- [x] `_hidden`
- [ ] `2nd_place`
- [ ] `my-score`
- [ ] `int`
- [x] `Count`
```

```explain
`total_2`, `_hidden` and `Count` follow the rules. `2nd_place` starts with a digit, `my-score` contains a minus sign (which would be read as subtraction) and `int` is a reserved keyword.
```
:::

:::exercise code "Fix the garbage"
This program should print `Score: 10`, but `score` is read before it has a value, which causes a warning and unpredictable output. Fix it.

```c starter
#include <stdio.h>

int main(void) {
    int score;
    printf("Score: %d\n", score);
    score = 10;
    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    int score = 10;
    printf("Score: %d\n", score);
    return 0;
}
```

```test
name: prints the score
expect:
Score: 10
```

```hint
The value has to be in the box *before* `printf` reads it. Statements run from top to bottom.
```

```hint
Move the assignment above the `printf`, or better, initialise at the declaration: `int score = 10;`.
```
:::
