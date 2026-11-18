# Complexity and correctness

Count operations, state assumptions, and prove loop invariants.

## Choose an input size and a unit of work

Before this chapter: [Algorithms separate intent from iteration](../algorithms/README.md)

Complexity describes how counted work grows with input size. An amortized bound averages work across an operation sequence, including occasional expensive steps; it is not a claim that each individual step costs the same amount.

A complexity statement begins with a problem size and a measured operation. For a linear scan, let n be the number of live candidate elements and count comparisons with the key. Compiler startup and printing are separate costs.

An absent key forces this implementation to inspect the whole range. A first-position hit answers a different case and should not be substituted into a worst-case claim.

```cpp
#include <array>
#include <iostream>
#include <span>

std::size_t inspections(std::span<const int> values, int key) {
    std::size_t count = 0;
    for (int value : values) {
        ++count;
        if (value == key)
            break;
    }
    return count;
}

int main() {
    const std::array<int, 4> values{2, 4, 6, 8};
    std::cout << "absent=" << inspections(values, 7)
              << " first=" << inspections(values, 2) << "\n";
}

```

Original program output:

```text
absent=4 first=1
```

The same four-element range produces four comparisons for absence and one for the first-position hit.

Pitfall: Elapsed compilation time does not measure the algorithm’s comparison count.

Question: What is n in this model?

1. The executable byte size
2. The number of printed characters
3. The number of candidate elements

Answer: 3. The search problem grows with the number of candidate elements.

### Run the starter, then try a change

Open `native/examples/count-work.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/count-work.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
inspections(values, 7)
```

With

```cpp
inspections(values, 8)
```

Rerun the terminal command. Compare both counts. Why does a last-position hit inspect as many elements as the absent key?

## Distinguish upper bounds from tight bounds

Before this chapter: [Algorithms separate intent from iteration](../algorithms/README.md)

Big O gives an asymptotic upper bound; Big Omega gives a lower bound; Big Theta gives both up to constant factors. Name the counted function before giving its growth class.

For f(n)=3n+2 and n at least one, 3n <= f(n) <= 5n. The algebra proves a tight linear bound; a printed table only illustrates it.

```cpp
#include <iostream>

int main() {
    for (unsigned n : {1u, 2u, 4u})
        std::cout << n << ":" << 3 * n + 2 << " <= " << 5 * n << "\n";
}

```

Original program output:

```text
1:5 <= 5
2:8 <= 10
4:14 <= 20
```

All printed values satisfy the stated upper bound. The inequality, rather than the finite sample, covers arbitrary n in the mathematical model.

Pitfall: O(n) does not mean exactly n operations, and Big O is not itself a synonym for worst case.

Question: What is the tight growth class of 3n+2?

1. Theta(n squared)
2. Theta(n)
3. Theta(1)

Answer: 2. Both linear upper and lower bounds hold beyond a fixed threshold.

### Run the starter, then try a change

Open `native/examples/growth-bounds.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/growth-bounds.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
{1u, 2u, 4u}
```

With

```cpp
{1u, 2u, 4u, 8u}
```

Rerun the terminal command. Find the new inequality at 8. Which side is the model’s actual count and which is its bound?

## Compare doubling behavior

Before this chapter: [Algorithms separate intent from iteration](../algorithms/README.md)

Repeated halving yields logarithmic growth. A pairwise nested traversal yields quadratic work. Combining linear work across logarithmically many levels gives a common n log n model.

These expressions can count different kinds of work, so compare growth behavior rather than treating all model values as interchangeable elapsed times.

```cpp
#include <iostream>

int main() {
    for (unsigned n : {4u, 8u}) {
        unsigned levels = 0;
        for (unsigned m = n; m > 1; m /= 2)
            ++levels;
        std::cout << n << " log=" << levels << " linear=" << n << " square=" << n * n
                  << "\n";
    }
}

```

Original program output:

```text
4 log=2 linear=4 square=16
8 log=3 linear=8 square=64
```

Doubling n adds one halving level, doubles the linear count, and quadruples the square.

Pitfall: A logarithmic search still needs its ordering and access preconditions.

Question: How does n squared change when n doubles?

1. It doubles
2. It quadruples
3. It adds one

Answer: 2. The square of 2n is 4n squared.

### Run the starter, then try a change

Open `native/examples/growth-comparison.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/growth-comparison.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
{4u, 8u}
```

With

```cpp
{16u, 32u}
```

Rerun the terminal command. Compare log=, linear= and square=. Which quantity increases by one each time n doubles?

## Amortized cost describes an operation sequence

Before this chapter: [Algorithms separate intent from iteration](../algorithms/README.md)

An abstract growing buffer that doubles capacity copies 1+2+4+... elements at growth points. Across N appends that total is linear even though a particular append can copy every existing element.

This is amortized analysis over a sequence, not an average over randomly distributed inputs. The example models a chosen doubling policy; std::vector need not use exactly that factor.

```cpp
#include <iostream>

int main() {
    unsigned capacity = 0, copied = 0;
    for (unsigned length = 0; length < 9; ++length)
        if (length == capacity) {
            copied += length;
            capacity = capacity ? capacity * 2 : 1;
        }
    std::cout << "appends=9 copied=" << copied << " capacity=" << capacity << "\n";
}

```

Original program output:

```text
appends=9 copied=15 capacity=16
```

The ninth append triggers copying eight elements, bringing the sequence total to fifteen.

Pitfall: Amortized constant time does not make every individual append constant time.

Question: Can one append still cost linear work?

1. No, amortized forbids it
2. Only for random inputs
3. Yes, at a growth boundary

Answer: 3. The sequence bound permits occasional expensive operations.

### Run the starter, then try a change

Open `native/examples/amortized-append.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/amortized-append.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
length < 9
```

With

```cpp
length < 8
```

Rerun the terminal command. Compare copied= and capacity=. The literal appends=9 label is unchanged by this edit; which loop bound provides the actual number of appends?

## Make a prediction before collecting observations

Before this chapter: [Algorithms separate intent from iteration](../algorithms/README.md)

A benchmark should answer a specified workload question after correctness checks pass. For absent-key linear scans, doubling the candidate range predicts twice as many key comparisons.

Operation counts isolate the algorithm from timing noise. Later timing should keep parsing, allocation, output, and compiler startup outside the measured region and retain raw observations.

```cpp
#include <array>
#include <iostream>
#include <span>

std::size_t inspections(std::span<const int> values, int key) {
    std::size_t count = 0;
    for (int value : values) {
        ++count;
        if (value == key)
            break;
    }
    return count;
}

int main() {
    const std::array<int, 8> values{1, 2, 3, 4, 5, 6, 7, 8};
    auto small = inspections(std::span(values).first(4), 99);
    auto large = inspections(values, 99);
    std::cout << small << " " << large << " ratio=" << large / small << "\n";
}

```

Original program output:

```text
4 8 ratio=2
```

The instrumented implementation matches the stated absent-key prediction on these two inputs; the samples are checks rather than an asymptotic proof.

Pitfall: Changing target distribution changes the benchmark’s question.

Question: What should precede timing?

1. Choosing the fastest-looking sample
2. Correctness checks and a specified workload
3. Removing all boundary cases

Answer: 2. Measurement is interpretable only when the workload and result contract are clear.

### Run the starter, then try a change

Open `native/examples/benchmark-contract.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/benchmark-contract.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
.first(4), 99
```

With

```cpp
.first(4), 1
```

Rerun the terminal command. Compare small and large work counts and ratio=. Why does comparing a first-position hit with an absent key change what this ratio measures?

## Chapter project

Predict and check growth on absent-key search workloads.
