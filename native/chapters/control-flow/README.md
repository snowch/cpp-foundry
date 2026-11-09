# Decisions and loops

Make branch conditions, loop invariants, and termination visible.

## Branch on a domain condition

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

A loop invariant describes the state at a chosen point in each iteration. For a prefix sum, the accumulator contains exactly the elements before the current index. Initialization, preservation, and termination connect that statement to the final result.

Keep the arithmetic domain bounded while studying the proof; a mathematically correct recurrence does not excuse overflowing the accumulator.

```cpp
#include <array>
#include <iostream>

int main() {
    const std::array<int, 3> values{3, 1, 4};
    int sum = 0;
    for (std::size_t i = 0; i < values.size(); ++i) {
        std::cout << i << ":" << sum << "\n";
        sum += values[i];
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

Experiment: Change the array to include a negative value. Write the invariant independently of the actual numbers, then check the trace.

## Dispatch a closed set of commands

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
