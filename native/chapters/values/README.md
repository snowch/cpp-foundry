# Values before pointers

Write useful programs with strings, vectors, and small functions.

## A first C++20 program

A program starts in main. Include the header that declares the library facilities you use; iostream provides the standard output stream. C++20 is the language version for this course, not a requirement to use every new feature at once.

Start by representing data as values. A std::string owns its characters and cleans them up at the end of its scope. You can concentrate on the result before studying the machinery that stores those characters.

```cpp
#include <iostream>
#include <string>
int main() {
    std::string name = "Ada";
    std::cout << "Hello, " << name << "!\n";
    return 0;
}
```

Expected output:

```text
Hello, Ada!
```

The string is constructed, the stream writes three pieces of text, and returning zero reports success to the caller. The newline ends a line; it does not request an immediate flush as std::endl does.

Pitfall: A successful compilation does not establish that the program produces the intended result. Read diagnostics and compare actual output with the contract.

Question: Who owns the characters in name?

1. The std::string value
2. The output stream
3. A caller that must call delete

Answer: 1. The string owns its storage. Its destructor releases that storage automatically.

Experiment: Change the name and greeting, then remove a semicolon. Compare a compiler diagnostic with an incorrect but compilable greeting.

## Types and numeric boundaries

A type specifies a set of values and operations. Use a type that expresses the domain: counts are nonnegative, temperatures may be negative, and fractional measurements need a floating representation. auto deduces a concrete type from an initializer; it does not make the variable dynamically typed.

Signed integer overflow is undefined behavior. Check the precondition before performing an addition. For floating point, a decimal value such as 0.1 need not have an exact binary representation.

```cpp
#include <iostream>
#include <limits>
#include <optional>
std::optional<int> add(int a, int b) {
    if (b > 0 && a > std::numeric_limits<int>::max() - b) return std::nullopt;
    if (b < 0 && a < std::numeric_limits<int>::min() - b) return std::nullopt;
    return a + b;
}
int main() {
    auto total = add(20, 22);
    if (total) std::cout << *total << '\n';
    std::cout << "overflow rejected="
              << !add(std::numeric_limits<int>::max(), 1) << '\n';
}
```

Expected output:

```text
42
overflow rejected=1
```

The two guards rearrange the mathematical boundary so that the check itself stays representable. An optional distinguishes a valid result, including zero, from a rejected operation.

Pitfall: Checking whether the result became negative after an overflowing signed addition is too late: the addition has already violated the language rules.

Question: When must the overflow check happen?

1. Before a + b
2. After computing a + b
3. Only in debug builds

Answer: 1. The operation is valid only after its precondition has been established.

Experiment: Try the minimum integer plus -1, minimum plus 1, and two negative operands. Explain why each guard remains representable.

## Strings and vectors own their elements

std::vector stores a sequence of elements and grows its storage as necessary. Its size is the number of live elements; capacity is the space currently available without reallocating. A std::string offers a similar owning model for text.

Use range-for when you need each value. operator[] requires a valid index; at() checks the index and throws std::out_of_range on failure. Never rely on capacity as though those extra elements already existed.

```cpp
#include <iostream>
#include <string>
#include <vector>
int main() {
    std::vector<std::string> names{"Ada", "Linus"};
    names.push_back("Grace");
    for (const auto& name : names) std::cout << name << '\n';
    std::cout << "count=" << names.size() << '\n';
}
```

Expected output:

```text
Ada
Linus
Grace
count=3
```

The vector owns three string objects. Each string owns its text. The const reference in the loop borrows each element without copying it or allowing the loop body to modify it.

Pitfall: push_back can reallocate the vector. References, pointers, and iterators to its old elements can then dangle.

Question: Does reserve(10) create ten elements?

1. No, it reserves storage
2. Yes, initialized to zero
3. Only for strings

Answer: 1. reserve changes capacity; resize changes the number of live elements.

Experiment: Print size before and after reserve(20), then after resize(5). Inspect the newly constructed strings.

## Small functions and explicit contracts

A function lets you name one operation and define its inputs and result. Pass small values by value. Borrow a read-only collection by const reference when copying it would add cost without helping the operation.

Define behavior for empty input. A score-summary function can return no result for an empty vector rather than dividing by zero or inventing an average. Const expresses what this function may do through its parameter; it does not guarantee that no other alias can change the object.

```cpp
#include <iostream>
#include <optional>
#include <vector>
std::optional<double> mean(const std::vector<int>& scores) {
    if (scores.empty()) return std::nullopt;
    double total = 0;
    for (int score : scores) total += score;
    return total / static_cast<double>(scores.size());
}
int main() {
    const std::vector<int> scores{70, 80, 90};
    std::cout << "mean=" << *mean(scores) << '\n';
    std::cout << "empty=" << !mean({}) << '\n';
}
```

Expected output:

```text
mean=80
empty=1
```

The early return handles the empty case. Accumulating into double avoids an overflowing int accumulator for this teaching example. Dereferencing the result is safe in main because that specific input is known to be nonempty.

Pitfall: Do not dereference an arbitrary optional without checking it. Optional makes the possibility visible; the caller still has to honor it.

Question: What does nullopt represent here?

1. No average exists for empty input
2. The average is zero
3. An exception was caught

Answer: 1. The absence of a result is distinct from a present numeric result of zero.

Experiment: Add negative scores and a single score. Change main to inspect the optional before printing it.

## Chapter project

Build a score summary that handles an empty collection.
