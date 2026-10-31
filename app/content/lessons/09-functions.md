---
id: functions
title: Functions
subtitle: Give a piece of code a name, hand it values, and get a result back.
minutes: 40
goals: Define and call functions with parameters and return values
goals: Use prototypes and understand local variables and scope
goals: Explain pass by value using memory addresses
goals: Read a simple recursive function
docs: Functions | https://en.cppreference.com/w/c/language/functions
docs: Function declarations | https://en.cppreference.com/w/c/language/function_declaration
docs: Scope | https://en.cppreference.com/w/c/language/scope
docs: return statement | https://en.cppreference.com/w/c/language/return
---

## Why functions?

You have already used functions: `printf`, `scanf` and `main`. A **function** is a named piece of code that you can run (**call**) whenever you like, as often as you like.

Functions give you three things:

- **No repetition.** Write the code once, use it ten times.
- **Names that explain.** `is_prime(n)` is easier to read than eight lines of loop.
- **Small pieces.** You can test and understand one piece at a time.

Here is the smallest function with a job:

```c run
#include <stdio.h>

void greet(void) {
    printf("Hello from greet!\n");
}

int main(void) {
    greet();
    greet();
    return 0;
}
```

The first line of a function is its **signature**: the **return type** (`void` means "returns nothing"), the **name**, and the **parameter list** in parentheses (`void` means "takes nothing"). The block in `{ }` is the **body**. Calling `greet()` makes the computer jump into the body, run it, and jump back to where it came from.

## Parameters and return values

Most functions get input and give back a result. Input goes in through **parameters**, the result comes out through `return`.

```c run
#include <stdio.h>

int square(int x) {
    return x * x;
}

int main(void) {
    int a = square(5);
    printf("%d\n", a);
    printf("%d\n", square(a + 1));
    return 0;
}
```

- `int square(int x)`: takes one `int` (called `x` inside the function) and returns an `int`.
- `return x * x;` ends the function and hands the value back. The call `square(5)` then *is* the value 25 in the expression around it.
- The values you pass in the call (`5`, `a + 1`) are the **arguments**. The names in the definition (`x`) are the **parameters**.

A function can have several parameters, separated by commas, each with its own type:

```c run
#include <stdio.h>

int max_of(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}

int main(void) {
    printf("%d\n", max_of(3, 9));
    printf("%d\n", max_of(-4, -8));
    return 0;
}
```

> [!NOTE]
> `return` leaves the function immediately. In `max_of`, if `a > b` the first `return` ends the function and the second line never runs.

:::exercise code "Cube it"
Write a function `int cube(int x)` that returns `x * x * x`. In `main`, read an integer and print its cube, in this format:

```text
cube = 27
```

```c starter
#include <stdio.h>

// write cube here

int main(void) {
    int n;
    scanf("%d", &n);
    // print the cube of n using your function

    return 0;
}
```

```c solution
#include <stdio.h>

int cube(int x) {
    return x * x * x;
}

int main(void) {
    int n;
    scanf("%d", &n);
    printf("cube = %d\n", cube(n));
    return 0;
}
```

```test
name: cube of 3
stdin: 3
source-has: cube(
expect:
cube = 27
```

```test
name: cube of -2
stdin: -2
source-has: int cube(int
expect:
cube = -8
```

```test
name: cube of 0
stdin: 0
expect:
cube = 0
```

```hint
The function goes above `main`. Its signature is `int cube(int x)`.
```

```hint
Inside: `return x * x * x;`. In `main`, call it as `cube(n)` inside `printf`.
```
:::

## Declaring before use: prototypes

The compiler reads your file from top to bottom. A function must be **known** before you call it. This is why we put helper functions above `main`. What if you prefer `main` first? Then you add a **prototype**, a signature followed by a semicolon and no body:

```c run
#include <stdio.h>

int triple(int x);          // prototype: "triple exists, trust me"

int main(void) {
    printf("%d\n", triple(7));
    return 0;
}

int triple(int x) {         // the real definition
    return 3 * x;
}
```

A prototype is a promise: "somewhere there is a function with this name, these parameters and this return type". Without it, Clang reports an error because it meets `triple` before knowing what it is. Try deleting the prototype line and running again to see.

:::exercise fill "Prototype first"
Complete the prototype and the call so the program prints `12`.

```c code
#include <stdio.h>

int twice(int x)[[;]]

int main(void) {
    printf("%d\n", [[twice]](6));
    return 0;
}

int twice(int x) {
    return 2 * x;
}
```

```explain
The prototype is the signature ended with a semicolon. The call uses the function's name followed by the arguments in parentheses.
```
:::

## Local variables and scope

A variable declared inside a function is **local**: it exists only while that function runs, and only that function can see it. This region where a name is visible is its **scope**.

```c run error
#include <stdio.h>

void set_it(void) {
    int secret = 42;
}

int main(void) {
    set_it();
    printf("%d\n", secret);
    return 0;
}
```

`secret` lives and dies inside `set_it`. `main` cannot see it, so the compiler reports an error: the name is unknown there. Two different functions can therefore use the same variable name without any conflict: they are two separate boxes.

Variables declared inside a `{ }` block (a loop body, an `if` branch) are only visible in that block.

## Pass by value: the function gets a copy

Now the most important idea of this lesson. When you call a function, C **copies** each argument into the parameter. The function works on its own copy. Whatever it does to the copy, the original does not change.

```c run
#include <stdio.h>

void add_ten(int n) {
    n = n + 10;
    printf("inside:  n = %d  (address %p)\n", n, (void *)&n);
}

int main(void) {
    int n = 5;
    printf("before:  n = %d  (address %p)\n", n, (void *)&n);
    add_ten(n);
    printf("after:   n = %d  (address %p)\n", n, (void *)&n);
    return 0;
}
```

Look at the output: both variables are called `n`, but they have **different addresses**. They are two separate boxes in memory. The call copied the value 5 into the new box; `add_ten` changed that box to 15; the original is untouched and still holds 5.

Every function call gets its own area of the stack, called a **stack frame**. It holds the function's parameters and local variables, and it disappears when the function returns. Frames of newer calls sit at *lower* addresses. Right in the middle of `add_ten`, memory looks like this (these are the addresses printed above):

```memory
caption: Two stack frames while add_ten is running
0xfff8  | n | int | 5  | main's variable: unchanged
0xffdc* | n | int | 15 | add_ten's parameter: a COPY
```

The two rows are neighbouring areas of memory, but different boxes with different contents.

:::exercise predict "Does it change?"
What does this program print?

```c code
#include <stdio.h>

void reset(int value) {
    value = 0;
}

int main(void) {
    int score = 99;
    reset(score);
    printf("%d\n", score);
    return 0;
}
```

```explain
`reset` receives a copy of 99 and sets its copy to 0. `score` in `main` is a different box and keeps 99. To change a caller's variable a function needs the variable's *address*, which is the topic of the pointer lessons.
```
:::

:::exercise fill "Two boxes"
`main` calls `double_it(x)`. The memory diagram shows both frames at the moment just before `double_it` returns. Fill in the values of the two boxes.

```memory
caption: Both frames just before double_it returns (addresses are made up)
0x1010  | x | int | [[7]]  | main's original
0x1000* | n | int | [[14]] | double_it's copy, after n = n * 2
```

```c
void double_it(int n) {
    n = n * 2;
}
// in main: int x = 7;  double_it(x);
```

```explain
The parameter `n` started as a copy of 7 and was doubled to 14. The original `x` is still 7: pass by value never touches it.
```
:::

## Getting results out, and a taste of recursion

Since a function cannot change the caller's variables, the normal way to get a result back is `return`. The caller stores it:

```c run
#include <stdio.h>

int add_ten(int n) {
    return n + 10;
}

int main(void) {
    int n = 5;
    n = add_ten(n);         // store the returned value
    printf("%d\n", n);
    return 0;
}
```

A function can even call **itself**. This is called **recursion**. The classic example is the factorial: `5! = 5 * 4 * 3 * 2 * 1`. Notice that `5! = 5 * 4!`, so factorial is defined with a smaller factorial:

```c run
#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;                    // stop: the base case
    }
    return n * factorial(n - 1);     // smaller problem
}

int main(void) {
    printf("%d\n", factorial(5));
    return 0;
}
```

Every recursive function needs a **base case** that stops the recursion, and every recursive call must move toward it. Each call gets its own stack frame with its own copy of `n`, which is why this works.

> [!DEEP]
> Each pending call to `factorial` occupies a frame until it returns, so `factorial(5)` stacks five frames. Recursion that never reaches its base case fills the stack and crashes the program ("stack overflow"). Also, `int` overflows around `factorial(13)`.

:::exercise code "Factorial with a loop or recursion"
Read `n` (between 0 and 10) and print its factorial, using a function `int factorial(int n)` that you write. `0!` is `1`. Output format:

```text
5! = 120
```

```c starter
#include <stdio.h>

int factorial(int n) {
    // write your code here
    return 0;
}

int main(void) {
    int n;
    scanf("%d", &n);
    printf("%d! = %d\n", n, factorial(n));
    return 0;
}
```

```c solution
#include <stdio.h>

int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

int main(void) {
    int n;
    scanf("%d", &n);
    printf("%d! = %d\n", n, factorial(n));
    return 0;
}
```

```test
name: 5!
stdin: 5
expect:
5! = 120
```

```test
name: 0!
stdin: 0
expect:
0! = 1
```

```test
name: 1!
stdin: 1
expect:
1! = 1
```

```test
name: 10!
stdin: 10
source-has: int factorial(int
expect:
10! = 3628800
```

```hint
Either a loop (`result` starts at 1 and is multiplied by every number up to `n`) or recursion (`n * factorial(n - 1)` with the base case `n <= 1`).
```

```hint
Loop version: `int result = 1; for (int i = 2; i <= n; i++) result *= i; return result;`
```
:::

:::exercise quiz "Scope and copies"
Which statements about this code are true?

```c
int f(int a) {
    a = a + 1;
    return a;
}

int main(void) {
    int a = 1;
    f(a);
    printf("%d", a);
    return 0;
}
```

```options
- [x] It prints 1
- [ ] It prints 2
- [x] The `a` in `f` and the `a` in `main` are different variables
- [ ] Both `a` variables share the same address
```

```explain
The return value of `f(a)` is thrown away and `main`'s `a` was never changed (pass by value), so 1 is printed. Parameters and locals with the same name in different functions are unrelated boxes at different addresses.
```
:::
