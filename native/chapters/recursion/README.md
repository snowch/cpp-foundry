# Recursion and dynamic programming

Define base cases, progress measures, and reusable subproblems.

## A recursive call needs a smaller problem

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

Expected output:

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

Experiment: Trace the calls for zero and one. Add a documented input bound that keeps both arithmetic and stack use acceptable.

## Split a range and combine subproblem results

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

Expected output:

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

Experiment: Instrument visits and confirm each element contributes once. Compare recursion depth with a linear recursive summation.

## Cache results for repeated subproblems

Naive Fibonacci recursion revisits the same subproblems. Memoization stores each computed result so later calls reuse it. The cache changes work from an exponential recursion tree to a linear number of distinct states.

Cache size and arithmetic range are separate limits. This example uses a fixed small state space with optional entries to distinguish uncomputed from a real zero.

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

Expected output:

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

Experiment: Count newly computed states and cache hits separately. Reject n beyond the declared table size before recursion.

## Choose an order that makes dependencies available

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

Expected output:

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

Experiment: Compare against the memoized implementation for every n from zero to ten. Add a checked-addition failure path.

## Undo tentative state before exploring a sibling

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

Expected output:

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

Experiment: Record the path size on entry and verify it is unchanged on return. Add a pruning rule for a bounded subset sum.

## Chapter project

Compare recursive, memoized, and iterative implementations.
