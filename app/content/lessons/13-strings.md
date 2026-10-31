---
id: strings
title: Strings
subtitle: Text in C is just an array of small numbers that ends with a zero.
minutes: 40
goals: Explain that a char is a small number and that a string is a char array ending in '\0'
goals: Walk through a string with a loop and write your own length function
goals: Use strlen, strcpy, strcmp and strcat safely, and explain why == does not compare text
goals: Read a word with scanf and transform it with the ctype functions
docs: String handling (<string.h>) | https://en.cppreference.com/w/c/string/byte
docs: strlen | https://en.cppreference.com/w/c/string/byte/strlen
docs: strcpy | https://en.cppreference.com/w/c/string/byte/strcpy
docs: strcmp | https://en.cppreference.com/w/c/string/byte/strcmp
docs: strcat | https://en.cppreference.com/w/c/string/byte/strcat
docs: toupper | https://en.cppreference.com/w/c/string/byte/toupper
---

## Characters are numbers

C has no special "letter" type. A single character such as `'A'` is stored in a `char`, which is a tiny integer (1 byte). Every character has a number, defined by a table called **ASCII**. A few values to remember:

| Character | Number |
|---|---|
| `'0'` … `'9'` | 48 … 57 |
| `'A'` … `'Z'` | 65 … 90 |
| `'a'` … `'z'` | 97 … 122 |
| `' '` (space) | 32 |
| `'\0'` (the "null character") | 0 |

Single quotes mean *one character*: `'A'`. Double quotes mean *a string*: `"A"`. They are different things, as you will see in a moment.

Because a character is a number, you can do arithmetic with it. `printf` decides how to show it: `%c` prints the character, `%d` prints the number.

```c run
#include <stdio.h>

int main(void) {
    char letter = 'A';
    printf("%c is %d\n", letter, letter);
    printf("next letter: %c\n", letter + 1);
    printf("digit 7 has code %d\n", '7');
    printf("'7' - '0' = %d\n", '7' - '0');
    return 0;
}
```

The last line is a classic trick: the digits are in order, so `'7' - '0'` turns the character `'7'` into the number 7.

:::exercise predict "Letters and numbers"
What does this program print?

```c code
#include <stdio.h>

int main(void) {
    char c = 'a';
    printf("%d %c\n", c, c + 2);
    printf("%d\n", 'a' - 'A');
    printf("%c\n", 'A' + 25);
    return 0;
}
```

```explain
`'a'` is 97, and `c + 2` is 99, which `%c` shows as `c`. Lower-case letters are exactly 32 above the upper-case ones (`'a' - 'A'` is 32). `'A' + 25` is 90, the letter `Z`.
```
:::

## A string is a char array ending in zero

C has no "string" type either. A **string** is simply an array of `char` whose last element is the special value `'\0'` (the number 0), called the **terminator**. It tells every function "the text stops here".

```c run
#include <stdio.h>

int main(void) {
    char word[] = "Hi!";
    printf("%s\n", word);
    printf("sizeof word = %zu\n", sizeof word);
    printf("the bytes: %d %d %d %d\n", word[0], word[1], word[2], word[3]);
    return 0;
}
```

`"Hi!"` has three visible characters, but the array has **4** bytes: the terminator takes one. In memory it looks like this (the addresses are made up but realistic):

```memory
caption: char word[] = "Hi!"; — four bytes, index 0 at the lowest address
0xfff0* | word[0] | char | 72 | 'H'
0xfff1  | word[1] | char | 105 | 'i'
0xfff2  | word[2] | char | 33 | '!'
0xfff3* | word[3] | char | 0 | '\0' — the terminator
```

A text written in double quotes in your code is a **string literal**. The compiler places it in memory (with its terminator) and gives you its address. `printf("%s", ...)` takes the address of the first character and prints characters until it meets a `0`.

> [!WARN]
> The terminator is not optional. If an array of characters has no `'\0'`, functions like `printf("%s")` keep reading past the end into whatever memory comes next. Always leave room for one extra byte.

:::exercise fill "Bytes of a string"
Fill in the memory contents of `char s[] = "Hey";`. Write the numbers (ASCII: `'H'` is 72, `'e'` is 101, `'y'` is 121).

```memory
caption: char s[] = "Hey";
0xfff0 | s[0] | char | [[72]] | 'H'
0xfff1 | s[1] | char | [[101]] | 'e'
0xfff2 | s[2] | char | [[121]] | 'y'
0xfff3 | s[3] | char | [[0]] | the terminator
```

```explain
A string of three characters needs four bytes. The last one is the number 0, written `'\0'` in code, so `sizeof s` is 4 while the text length is 3.
```
:::

## Walking through a string

Since a string ends with `'\0'`, we do not need to know its length in advance. We loop until we meet the terminator.

```c run
#include <stdio.h>

int main(void) {
    char text[] = "pointer";
    int i = 0;
    while (text[i] != '\0') {
        printf("text[%d] = %c\n", i, text[i]);
        i++;
    }
    return 0;
}
```

That loop is exactly what a **length function** does: count the characters before `'\0'`. Here is our own version, using `size_t`, the unsigned type C uses for sizes and lengths.

```c run
#include <stdio.h>
#include <stddef.h>

size_t my_length(const char *s) {
    size_t n = 0;
    while (s[n] != '\0') {
        n++;
    }
    return n;
}

int main(void) {
    printf("%zu\n", my_length("hello"));
    printf("%zu\n", my_length(""));
    return 0;
}
```

An array passed to a function becomes a pointer to its first element (you learned that as *decay*), so the parameter is `const char *s`. `const` promises that the function will only read the text.

:::exercise code "Count the vowels"
Read one word (at most 19 letters, all lower case) with `scanf`, then print how many of the letters `a e i o u` it contains. Loop over the string until `'\0'`.

Output format:

```text
vowels: 3
```

```c starter
#include <stdio.h>

int main(void) {
    char word[20];
    scanf("%19s", word);

    // count vowels here

    return 0;
}
```

```c solution
#include <stdio.h>

int main(void) {
    char word[20];
    scanf("%19s", word);

    int count = 0;
    for (int i = 0; word[i] != '\0'; i++) {
        char c = word[i];
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            count++;
        }
    }
    printf("vowels: %d\n", count);
    return 0;
}
```

```test
name: education
stdin: education
expect:
vowels: 5
```

```test
name: no vowels
stdin: rhythm
expect:
vowels: 0
```

```test
name: queueing
stdin: queueing
expect:
vowels: 5
```

```hint
Use a loop that stops when `word[i]` is `'\0'`. Keep an `int count` that starts at 0.
```

```hint
Inside the loop: `if (c == 'a' || c == 'e' || ...) count++;`
```
:::

## The string library: string.h

Because strings are arrays, you cannot copy or compare them with `=` or `==`. The header `<string.h>` offers functions for the common jobs:

| Function | What it does |
|---|---|
| [`strlen(s)`](https://en.cppreference.com/w/c/string/byte/strlen) | number of characters before `'\0'` |
| [`strcpy(dest, src)`](https://en.cppreference.com/w/c/string/byte/strcpy) | copy `src` (with terminator) into `dest` |
| [`strcmp(a, b)`](https://en.cppreference.com/w/c/string/byte/strcmp) | 0 if equal, negative if `a` sorts first, positive otherwise |
| [`strcat(dest, src)`](https://en.cppreference.com/w/c/string/byte/strcat) | append `src` to the end of `dest` |

```c run
#include <stdio.h>
#include <string.h>

int main(void) {
    char first[20] = "Hello";
    char second[] = ", world";

    printf("length of first: %zu\n", strlen(first));

    strcat(first, second);            // first is now "Hello, world"
    printf("%s (%zu chars)\n", first, strlen(first));

    char copy[20];
    strcpy(copy, first);
    printf("copy: %s\n", copy);

    printf("strcmp(copy, first) = %d\n", strcmp(copy, first));
    return 0;
}
```

### Why `==` does not compare strings

`a == b` on two arrays compares their **addresses**, not their letters. Two different arrays with identical text still sit at different addresses, so the test is false. Use `strcmp(a, b) == 0` to ask "is the text equal?".

```c run warn
#include <stdio.h>
#include <string.h>

int main(void) {
    char a[] = "cat";
    char b[] = "cat";
    printf("a == b: %d\n", a == b);
    printf("strcmp == 0: %d\n", strcmp(a, b) == 0);
    return 0;
}
```

### The buffer-overflow danger

`strcpy` and `strcat` do **not** check whether the destination is big enough. They happily write past the end of the array and overwrite the neighbouring memory. This is the famous *buffer overflow*, the root of countless security holes. Before copying, make sure the destination has room for `strlen(src) + 1` bytes (the `+ 1` is for the terminator).

`strncpy(dest, src, n)` copies at most `n` characters, but it does **not** add a terminator if the source is `n` or longer. A safe pattern is:

```c
char small[8];
strncpy(small, "a much longer text", sizeof small - 1);
small[sizeof small - 1] = '\0';   // always terminate yourself
```

> [!NOTE]
> In this browser environment an overflow often does not crash; it silently damages a neighbouring variable. That is *worse* than a crash, because the bug stays hidden. Do not rely on "it seemed to work".

:::exercise quiz "Comparing text"
You have two arrays, `char a[] = "yes"; char b[] = "yes";`. Which expression is true (non-zero)?

```options
- [ ] `a == b`
- [x] `strcmp(a, b) == 0`
- [ ] `strcmp(a, b) == 1`
- [ ] `a = b`
```

```explain
`a == b` compares the two addresses, which are different. `strcmp` returns exactly 0 for equal text; for unequal text it returns a negative or positive number (not necessarily -1 or 1). `a = b` is not even legal for arrays.
```
:::

## Reading words and transforming characters

`scanf("%s", buf)` reads one **word**: it skips leading white space and stops at the next space or newline. It also adds the `'\0'` for you. You must tell it how many characters fit, otherwise a long word overflows the array. For `char buf[20]` the limit is 19 (one byte is for the terminator), written `%19s`. Note: no `&` is needed, because an array already *is* an address.

The header `<ctype.h>` has handy functions that work on single characters: `isdigit(c)`, `isalpha(c)`, `isupper(c)`, `islower(c)`, `toupper(c)` and `tolower(c)` ([docs](https://en.cppreference.com/w/c/string/byte/toupper)).

```c run
#include <stdio.h>
#include <ctype.h>

int main(void) {
    char buf[20];
    scanf("%19s", buf);

    int digits = 0;
    for (int i = 0; buf[i] != '\0'; i++) {
        if (isdigit(buf[i])) {
            digits++;
        }
        buf[i] = toupper(buf[i]);
    }
    printf("%s has %d digits\n", buf, digits);
    return 0;
}
```

```stdin
abc123xy
```

:::exercise code "Shout it"
Read a word (up to 19 characters) and print it in upper case, followed by a new line. Use `toupper` from `<ctype.h>`.

```c starter
#include <stdio.h>
#include <ctype.h>

int main(void) {
    char word[20];
    scanf("%19s", word);

    // convert every character, then print

    return 0;
}
```

```c solution
#include <stdio.h>
#include <ctype.h>

int main(void) {
    char word[20];
    scanf("%19s", word);

    for (int i = 0; word[i] != '\0'; i++) {
        word[i] = toupper(word[i]);
    }
    printf("%s\n", word);
    return 0;
}
```

```test
name: simple
stdin: hello
source-has: toupper
expect:
HELLO
```

```test
name: mixed
stdin: C4Ever
expect:
C4EVER
```

```hint
Loop over the characters until `'\0'` and assign `word[i] = toupper(word[i]);`.
```

```hint
After the loop, `printf("%s\n", word);` prints the whole string.
```
:::

## Changing a string in place

You can change the characters of a char *array* (it is your own copy). A classic exercise is reversing a string **in place**: swap the first and last characters, then the second and second-to-last, and stop in the middle.

```c run
#include <stdio.h>
#include <string.h>

int main(void) {
    char s[] = "stressed";
    size_t n = strlen(s);
    for (size_t i = 0; i < n / 2; i++) {
        char tmp = s[i];
        s[i] = s[n - 1 - i];
        s[n - 1 - i] = tmp;
    }
    printf("%s\n", s);
    return 0;
}
```

> [!WARN]
> `char *p = "text";` points at a string literal, which you must **not** modify. Always use `char s[] = "text";` (or `const char *p`) so the compiler can protect you.

:::exercise code "Reverse in place"
Read a word (up to 19 characters), reverse it **in place** using a swap loop, and print the result.

```c starter
#include <stdio.h>
#include <string.h>

int main(void) {
    char word[20];
    scanf("%19s", word);

    // reverse word, then print it

    return 0;
}
```

```c solution
#include <stdio.h>
#include <string.h>

int main(void) {
    char word[20];
    scanf("%19s", word);

    size_t n = strlen(word);
    for (size_t i = 0; i < n / 2; i++) {
        char tmp = word[i];
        word[i] = word[n - 1 - i];
        word[n - 1 - i] = tmp;
    }
    printf("%s\n", word);
    return 0;
}
```

```test
name: even length
stdin: abcd
expect:
dcba
```

```test
name: odd length
stdin: racecar1
expect:
1racecar
```

```test
name: single letter
stdin: x
expect:
x
```

```hint
Get the length with `strlen`. Loop `i` from 0 while `i < n / 2`.
```

```hint
Swap `word[i]` with `word[n - 1 - i]` using a temporary `char`.
```
:::

:::exercise code "Palindrome?"
A palindrome reads the same forwards and backwards. Read one word (up to 19 characters) and print `yes` if it is a palindrome or `no` if not.

```c starter
#include <stdio.h>
#include <string.h>

int main(void) {
    char word[20];
    scanf("%19s", word);

    // compare the first character with the last, and so on

    return 0;
}
```

```c solution
#include <stdio.h>
#include <string.h>

int main(void) {
    char word[20];
    scanf("%19s", word);

    size_t n = strlen(word);
    int same = 1;
    for (size_t i = 0; i < n / 2; i++) {
        if (word[i] != word[n - 1 - i]) {
            same = 0;
        }
    }
    printf("%s\n", same ? "yes" : "no");
    return 0;
}
```

```test
name: racecar
stdin: racecar
expect:
yes
```

```test
name: not one
stdin: banana
expect:
no
```

```test
name: even palindrome
stdin: abba
expect:
yes
```

```test
name: almost
stdin: abca
expect:
no
```

```hint
You do not need a second array: compare `word[i]` with `word[n - 1 - i]` for `i` from 0 up to `n / 2`.
```

```hint
Keep an `int same = 1;` and set it to 0 as soon as one pair differs. Print after the loop.
```
:::
