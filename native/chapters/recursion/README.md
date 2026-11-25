# Recursion and dynamic programming

Define base cases, progress measures, and reusable subproblems.

## A recursive call needs a smaller problem

Before this chapter: [Insertion sort maintains a sorted prefix](../sorting-strategies/README.md)

New terms and notation:

Recursion is a function solving a problem by calling itself on a smaller or simpler problem. A base case stops the calls, and a progress measure explains why repeated calls reach it.

A subproblem is a smaller instance of a problem. Recursive code solves one by calling itself; a base case stops that process. Memoization stores completed answers for reuse, while tabulation builds a table of answers in a chosen order.

A recursive definition needs a base case and a progress measure that reaches it. Summing the first n positive integers reduces n by one until zero. The return combines the solved smaller problem with the current contribution.

Stack usage grows with recursion depth. Keep this teaching input small and do not generalize it into a safe interface for arbitrary unsigned values.

```cpp
#include <iostream>

unsigned sum(unsigned n) {
    return n == 0 ? 0 : n + sum(n - 1);
}

int main() {
    std::cout << sum(4) << "\n";
}

```

Original program output:

```text
10
```

The calls reach sum(0), then combine 1, 2, 3, and 4 while returning.

Pitfall: A missing base case or a call that does not decrease the measure can recurse until stack exhaustion.

Question: Which measure decreases?

1. n
2. The final sum
3. The return address

Answer: 1. Each non-base call uses n-1.

### Run the starter, then try a change

Open `native/examples/recursive-progress.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/recursive-progress.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
sum(4)
```

With

```cpp
sum(0)
```

Rerun the terminal command. Compare the numeric results. Which branch supplies the new result without making another call?

## Split a range and combine subproblem results

Before this chapter: [Insertion sort maintains a sorted prefix](../sorting-strategies/README.md)

Divide-and-conquer separates a problem into smaller ranges, solves them, and combines the answers. A span can express each borrowed subrange without copying its elements.

The recursion must handle an empty range and a single element before splitting. Ownership stays in the caller’s array throughout the computation.

```cpp
#include <array>
#include <iostream>
#include <span>

int total(std::span<const int> values) {
    if (values.empty())
        return 0;
    if (values.size() == 1)
        return values.front();
    auto middle = values.size() / 2;
    return total(values.first(middle)) + total(values.subspan(middle));
}

int main() {
    const std::array<int, 5> values{2, 3, 4, 5, 6};
    std::cout << total(values) << "\n";
}

```

Original program output:

```text
20
```

The five-element span splits into disjoint prefixes and suffixes whose sums combine to twenty.

Pitfall: Overlapping slices can double-count elements; a gap can silently omit them.

Question: Do these spans own copied elements?

1. Yes
2. Only the right span owns data
3. No, they borrow disjoint ranges

Answer: 3. The original array owns all elements until the calls finish.

### Run the starter, then try a change

Open `native/examples/divide-conquer.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/divide-conquer.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
values{2, 3, 4, 5, 6}
```

With

```cpp
values{2, 3, 4, 5, 0}
```

Rerun the terminal command. Compare the totals. Does replacing the final element’s value change the collection size or its contribution?

## Cache results for repeated subproblems

Before this chapter: [Insertion sort maintains a sorted prefix](../sorting-strategies/README.md)

Naive Fibonacci recursion revisits the same subproblems. Memoization stores each computed result so later calls reuse it. The cache changes work from an exponential recursion tree to a linear number of distinct states.

Cache size and arithmetic range are separate limits. This example uses a fixed small state space with optional entries to distinguish uncomputed from a real zero.

[Open figure: Two callers can need the same subproblem](../../diagrams/memoization.html)

Why should the second request reuse fib(2)?

Why should the second request reuse fib(2)? Nodes: fib(4), fib(3), fib(2), fib(1). Connections: fib(4) leads to fib(3); fib(4) leads to fib(2); fib(3) leads to fib(2) (reuse); fib(3) leads to fib(1). A small dependency excerpt from fib(10), whose result is 55. Completed answers are cached by their n value.. This is not the complete call tree. Memoization requires all answer-affecting inputs in the key; caching alone does not make cyclic dependencies terminate.

This is not the complete call tree. Memoization requires all answer-affecting inputs in the key; caching alone does not make cyclic dependencies terminate.

```cpp
#include <array>
#include <iostream>
#include <optional>

unsigned fib(unsigned n, std::array<std::optional<unsigned>, 11> &memo) {
    if (n < 2)
        return n;
    if (memo.at(n))
        return *memo[n];
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
    return *memo[n];
}

int main() {
    std::array<std::optional<unsigned>, 11> memo{};
    std::cout << fib(10, memo) << "\n";
}

```

Original program output:

```text
55
```

Every non-base state through ten is computed once and then reused. The optional remains engaged even when a cached value could be zero.

Pitfall: A cache indexed by unvalidated external n can exceed its supported state space.

Question: What is being cached?

1. Every stack frame forever
2. Only the final printed string
3. Results of distinct subproblems

Answer: 3. Repeated calls reuse the stored result for a state.

### Run the starter, then try a change

Open `native/examples/memoization.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/memoization.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
fib(10, memo)
```

With

```cpp
fib(0, memo)
```

Rerun the terminal command. Compare the returned values. Which argument permits returning from the base case without finding an earlier result?

## Choose an order that makes dependencies available

Before this chapter: [Insertion sort maintains a sorted prefix](../sorting-strategies/README.md)

Bottom-up dynamic programming fills states in an order where prerequisites are already computed. For Fibonacci, state n depends only on the previous two states, allowing constant auxiliary storage.

Reducing storage does not remove the need for a bounded numeric domain. Checked arithmetic is still required when the requested state can exceed the result type.

```cpp
#include <iostream>

int main() {
    unsigned previous = 0, current = 1;
    for (unsigned n = 0; n < 10; ++n) {
        auto next = previous + current;
        previous = current;
        current = next;
    }
    std::cout << previous << "\n";
}

```

Original program output:

```text
55
```

After ten updates, previous holds F(10). Only two preceding values are retained.

Pitfall: Updating previous before computing next from both old values can destroy a dependency.

Question: Why compute next first?

1. It allocates the full table
2. Both old state values are still needed
3. It prevents all overflow

Answer: 2. The temporary preserves the recurrence’s inputs until the new state is known.

### Run the starter, then try a change

Open `native/examples/tabulation.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/tabulation.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
n < 10
```

With

```cpp
n < 5
```

Rerun the terminal command. Compare the returned values. How many updates advance the pair for the shortened loop?

## Undo tentative state before exploring a sibling

Before this chapter: [Insertion sort maintains a sorted prefix](../sorting-strategies/README.md)

Backtracking explores a choice, recursively explores its consequences, and restores the state before trying another choice. Ownership of the mutable path should be clear so sibling branches do not inherit one another’s tentative additions.

A small subset enumeration makes the restore step visible. More complex solvers also need pruning rules and a documented output order.

```cpp
#include <iostream>
#include <vector>

void subsets(int next, int limit, std::vector<int> &path) {
    if (next > limit) {
        for (int value : path)
            std::cout << value;
        std::cout << ".\n";
        return;
    }
    subsets(next + 1, limit, path);
    path.push_back(next);
    subsets(next + 1, limit, path);
    path.pop_back();
}

int main() {
    std::vector<int> path;
    subsets(1, 2, path);
}

```

Original program output:

```text
.
2.
1.
12.
```

The exclude branch runs before the include branch. pop_back restores the caller’s path after exploring each included choice.

Pitfall: Forgetting the undo step makes later branches observe stale choices.

Question: What must hold when a recursive call returns?

1. The caller’s path is restored
2. The path contains every explored element
3. The path is permanently sorted

Answer: 1. Each call restores the mutation it introduced before returning.

### Run the starter, then try a change

Open `native/examples/backtracking-state.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/backtracking-state.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
subsets(1, 2, path)
```

With

```cpp
subsets(1, 1, path)
```

Rerun the terminal command. Compare the listed paths. Which branches remain after removing item 2 from the choice set?

## Chapter project

Compare recursive, memoized, and iterative implementations.
