# Decisions and loops

Make branch conditions, loop invariants, and termination visible.

## Branch on a domain condition

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

An invariant is a statement that must remain true at a specified point, such as “this stored ID is positive” or “these keys are sorted.” State the exact condition and where it must hold before using it to justify an operation.

Control flow means the order in which instructions run. A guard is a check made before a potentially invalid operation. A loop invariant is a fact you check at the same point on every repetition; a termination measure is a quantity that moves toward a stopping point.

A Boolean condition should answer a domain question: is this score passing, is this command recognized, or is this collection empty? Put the rule in one place so boundary cases can be named and tested.

An if/else chain selects the first matching branch. Overlapping conditions therefore make order part of the contract.

```cpp
#include <iostream>

int main() {
    for (int score : {59, 60, 100}) {
        if (score >= 60)
            std::cout << "pass\n";
        else
            std::cout << "retry\n";
    }
}

```

Expected output:

```text
retry
pass
pass
```

The boundary is inclusive: 59 fails, while 60 and 100 pass. The loop supplies three independent inputs to the same decision.

Pitfall: Testing only a value far from the boundary can miss an incorrect > in place of >=.

Question: Which score first passes this rule?

1. 60
2. 59
3. 61

Answer: 1. The comparison includes equality at 60.

Experiment: Add 0 and 101. Decide whether invalid scores need a separate rejection branch before the pass/fail decision.

## Use short-circuiting to establish a precondition

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

For true/false conditions, ! means not, && means both conditions must be true, and || means at least one must be true. Built-in && and || evaluate left to right and can skip the right-hand check when the answer is already determined. When std::cout prints an ordinary bool without special formatting, false appears as 0 and true as 1.

empty() asks whether a collection currently has no elements. It produces true for no elements and false otherwise; checking this before accessing a first element prevents an invalid access.

A precondition is something that must already be true before an operation is used, such as “the sequence is not empty.” A postcondition describes what the operation promises afterward if its requirements were met.

Built-in && evaluates its left operand first and evaluates the right operand only when the left is true. This lets a guard establish a precondition for a later expression.

The order is a language guarantee for built-in logical operators. Keep the expression readable; complicated side effects make a compact guard harder to audit.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values;
    bool starts_with_seven = !values.empty() && values.front() == 7;
    std::cout << starts_with_seven << "\n";
    values.push_back(7);
    std::cout << (!values.empty() && values.front() == 7) << "\n";
}

```

Expected output:

```text
0
1
```

The first check never calls front because the vector is empty. The second check reaches front after a valid element exists.

Pitfall: Bitwise & does not provide the same short-circuit guarantee as &&.

Question: Why is front safe in this condition?

1. front returns zero for an empty vector
2. The empty check is evaluated first and gates the call
3. Both operands are always evaluated

Answer: 2. The right operand runs only after the guard succeeds.

Experiment: Reverse the operands on paper and explain the failed precondition. Add a helper that counts how often the right operand runs.

## State what a loop has already processed

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

An index is a whole-number position in a sequence. C++ sequences count their first element as position zero; a sequence of size n has valid positions from 0 through n - 1.

The expression sequence[i] selects the element at index i. For the ordinary arrays and vectors here, the program must check that i is within the existing elements; the square brackets do not perform that check for you.

A loop invariant describes the state at a chosen point in each iteration. For a prefix sum, the accumulator contains exactly the elements before the current index. Initialization, preservation, and termination connect that statement to the final result.

Keep the arithmetic domain bounded while studying the proof; a mathematically correct recurrence does not excuse overflowing the accumulator.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{3, 1, 4};
    int sum = 0;
    int i = 0;
    while (i < 3) {
        std::cout << i << ":" << sum << "\n";
        sum = sum + values[i];
        i = i + 1;
    }
    std::cout << "total=" << sum << "\n";
}

```

Expected output:

```text
0:0
1:3
2:4
total=8
```

Each trace line is printed before adding values[i]. At termination the processed prefix is the complete array.

Pitfall: A final expected total is a postcondition; it does not by itself explain why each iteration preserves correctness.

Question: Before iteration i, which elements are included?

1. All elements including i
2. Only the last element
3. Exactly the prefix [0,i)

Answer: 3. The current element is added after the trace.

Experiment: Change the vector to include a negative value. Write the invariant independently of the actual numbers, then check the trace.

## Dispatch a closed set of commands

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

class defines a user-written type containing data members and member functions. A member function acts on a particular object. public marks the interface callers may use; private hides implementation members from ordinary callers.

enum class defines a type whose alternatives have names, such as Command::save. The double colon selects a name belonging to that type; an external number or text still needs validation before being treated as an alternative.

switch chooses a case from one controlling value. A case label names a matching value; break exits the switch so execution does not continue into the next case. default handles values without another matching case.

An enum class names a closed set of alternatives without implicitly converting every enumerator to an integer. A switch can expose the behavior for each recognized command.

Keep parsing separate from dispatch: this example starts with already classified commands. Unknown external text needs its own parser result rather than an invented enum value.

```cpp
#include <iostream>

enum class Command { list, save };

int main() {
    for (Command command : {Command::list, Command::save}) {
        switch (command) {
        case Command::list:
            std::cout << "scan rows\n";
            break;
        case Command::save:
            std::cout << "publish snapshot\n";
            break;
        }
    }
}

```

Expected output:

```text
scan rows
publish snapshot
```

Each enumerator reaches one case, and break prevents execution from continuing into the following case.

Pitfall: Accidental fallthrough can perform two state changes for one command. Use an explicit annotation only when fallthrough is intended.

Question: What prevents the list case from also saving?

1. The enum automatically inserts a return
2. break
3. The order of enum declarations

Answer: 2. break exits the switch.

Experiment: Add a count command and handle it in the switch. Compile with warnings enabled and inspect what happens when its case is missing.

## Make a decreasing measure visible

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

An unsigned integer type represents nonnegative whole numbers. Its arithmetic wraps modulo the number of representable values; that defined wrapping can still be the wrong behavior for a count or size calculation.

A progress measure should move toward a bound on every repetition. Repeatedly halving a positive integer is a simple example: the value decreases until it reaches zero.

Unsigned arithmetic is defined modulo its range, so a loop condition such as i >= 0 cannot terminate an unsigned countdown. Choose a condition that reflects the remaining work.

```cpp
#include <iostream>

int main() {
    unsigned remaining = 13, steps = 0;
    while (remaining != 0) {
        std::cout << remaining << " ";
        remaining /= 2;
        ++steps;
    }
    std::cout << "steps=" << steps << "\n";
}

```

Expected output:

```text
13 6 3 1 steps=4
```

The sequence reaches zero after four divisions. The counter measures iterations rather than elapsed time.

Pitfall: An unsigned countdown that decrements zero wraps to a large value instead of becoming negative.

Question: Which quantity proves this loop progresses?

1. The positive remaining value decreases
2. The output stream gets larger
3. Unsigned values eventually become negative

Answer: 1. Integer halving strictly reduces every positive value.

Experiment: Try 0, 1, and a power of two. Predict the step count and document how the empty-work case behaves.

## Chapter project

Build a bounded command dispatcher and check all exit paths.
