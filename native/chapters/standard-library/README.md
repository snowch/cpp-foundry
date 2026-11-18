# Use the standard library

Choose algorithms, containers, and result types by their contracts.

## Use half-open iterator ranges

Before this chapter: [Express required operations without claiming semantic proof](../generic-contracts/README.md)

New terms and notation:

A half-open interval [a, b) includes a and excludes b. It describes an empty interval when a equals b and lets the end position be a stopping marker without referring to an element there.

The standard library supplies reusable types and functions in the std namespace. A container stores elements; an algorithm performs an operation over elements; a predicate is a function that answers true or false about an element.

Standard algorithms commonly use a half-open range [first,last): first names an element and last marks the position just past the range. An empty range has first==last and requires no special element sentinel.

The past-the-end iterator is a boundary marker and must not be dereferenced. It remains useful as the not-found result of search algorithms.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{2, 4, 6};
    auto found = std::find(values.begin(), values.end(), 4);
    if (found != values.end())
        std::cout << *found << "\n";
    std::cout << "absent="
              << (std::find(values.begin(), values.end(), 9) == values.end()) << "\n";
}

```

Original program output:

```text
4
absent=1
```

The first search returns an element iterator; the second returns the boundary marker and is compared without dereferencing it.

Pitfall: Dereferencing end is invalid even when the container has allocated spare capacity.

Question: What does end identify?

1. The last element
2. An element containing zero
3. A past-the-end position

Answer: 3. The algorithm excludes that boundary from its inspected elements.

### Run the starter, then try a change

Open `native/examples/iterator-ranges.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/iterator-ranges.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
values.end(), 4)
```

With

```cpp
values.end(), 9)
```

Rerun the terminal command. Compare the first output and absent=. Why can a missing result be tested without reading through the end iterator?

## Make the destination of a transformation explicit

Before this chapter: [Express required operations without claiming semantic proof](../generic-contracts/README.md)

A transformation applies a mapping to each input element. The output range must have valid writable positions or use an insertion iterator that grows the destination.

Writing through begin on an empty vector does not create elements. back_inserter expresses the desired append behavior and delegates ownership to the output vector.

```cpp
#include <algorithm>
#include <iostream>
#include <iterator>
#include <vector>

int main() {
    std::vector<int> input{1, 2, 3}, output;
    std::transform(input.begin(), input.end(), std::back_inserter(output),
                   [](int value) { return value * value; });
    for (int value : output)
        std::cout << value << " ";
    std::cout << "size=" << output.size() << "\n";
}

```

Original program output:

```text
1 4 9 size=3
```

Each mapped value is appended to output. Its final size equals the number of input elements.

Pitfall: reserve alone does not make output.begin dereferenceable when size is zero.

Question: Why is back_inserter used?

1. It appends new elements
2. It sorts the input
3. It prevents all allocations

Answer: 1. The insertion iterator calls push_back on the destination.

### Run the starter, then try a change

Open `native/examples/transform-output.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/transform-output.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
input{1, 2, 3}
```

With

```cpp
input{}
```

Rerun the terminal command. Compare the printed values and size=. How many times does the output adapter append for an empty input?

## Distinguish absence from a present zero

Before this chapter: [Express required operations without claiming semantic proof](../generic-contracts/README.md)

optional represents either a live value or no value. A present numeric zero is still present, so the optional’s Boolean test describes engagement rather than the truth of the contained number.

Choose defaults deliberately: value_or can simplify presentation, but using a default internally can erase an important distinction between missing and present data.

```cpp
#include <iostream>
#include <optional>

int main() {
    std::optional<int> zero = 0, missing;
    std::cout << "present=" << bool(zero) << " value=" << *zero << "\n";
    std::cout << "missing=" << !missing << " fallback=" << missing.value_or(-1) << "\n";
}

```

Original program output:

```text
present=1 value=0
missing=1 fallback=-1
```

The first optional contains a constructed int equal to zero. The second is disengaged and uses the explicitly chosen fallback.

Pitfall: Dereferencing a disengaged optional violates its precondition; a default is not implicitly installed by operator*.

Question: Is optional<int>{0} engaged?

1. No
2. Only after value_or is called
3. Yes

Answer: 3. Engagement is independent of the integer’s value.

### Run the starter, then try a change

Open `native/examples/optional-observation.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/optional-observation.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
missing.value_or(-1)
```

With

```cpp
missing.value_or(0)
```

Rerun the terminal command. Compare present=, missing= and fallback=. Does supplying zero as a fallback make the optional hold a value?

## Choose ordering and lookup contracts deliberately

Before this chapter: [Express required operations without claiming semantic proof](../generic-contracts/README.md)

New terms and notation:

std::set<T> stores unique T values in comparison order. Inserting an already present equivalent value does not add another element. Equality for uniqueness is determined by the ordering relation, not necessarily by operator==.

A set maintains unique ordered keys. A vector preserves a sequence and allows duplicates. The correct representation depends on observable behavior, not just the name of a convenient method.

This example constructs a set from a sequence to produce a deterministic unique-key view. The original sequence remains available when duplicates or input order matter.

```cpp
#include <iostream>
#include <set>
#include <vector>

int main() {
    std::vector<int> input{3, 1, 3, 2};
    std::set<int> unique(input.begin(), input.end());
    for (int value : unique)
        std::cout << value;
    std::cout << " input=" << input.size() << " unique=" << unique.size() << "\n";
}

```

Original program output:

```text
123 input=4 unique=3
```

The set contains three ordered keys. Converting to it discards duplicate multiplicity, which would be incorrect for a query that needs duplicate rows.

Pitfall: A representation change can change semantics even when all distinct values are still present.

Question: What information is lost in the set?

1. Duplicate multiplicity and original order
2. All key values
3. The ability to search

Answer: 1. A set exposes unique sorted keys rather than the original sequence.

### Run the starter, then try a change

Open `native/examples/container-selection.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/container-selection.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
input{3, 1, 3, 2}
```

With

```cpp
input{3, 1, 4, 2}
```

Rerun the terminal command. Compare the ascending sequence and the two counts. Which counts stay equal when there is no duplicate?

## Predicates need coherent semantic rules

Before this chapter: [Express required operations without claiming semantic proof](../generic-contracts/README.md)

New terms and notation:

A strict weak ordering is a comparison relation suitable for sorting: no value comes before itself, ordering is transitive, and the induced equivalence groups are consistent. A comparator using <= breaks the first requirement.

An algorithm’s predicate determines which values match or how values are ordered. For sorting, a comparator must satisfy strict weak ordering; inconsistent answers invalidate the algorithm’s assumptions.

A projection can select a field while a standard comparator supplies the ordering. Keep a deterministic tie rule when observable output requires one.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> names{"Grace", "Ada", "Linus"};
    std::ranges::sort(names, [](const auto &a, const auto &b) {
        return a.size() == b.size() ? a < b : a.size() < b.size();
    });
    for (const auto &name : names)
        std::cout << name << "\n";
}

```

Original program output:

```text
Ada
Grace
Linus
```

Ada is the only three-byte name. The length comparison places Ada first; the alphabetical tie-breaker orders Grace before Linus.

Pitfall: An unstable sort does not promise to preserve input order among equivalent elements. Use a tie-breaker or stable_sort when needed.

Question: Does this comparator totally order equal-length names?

1. No, it ignores equal-length names
2. Yes, sort adds a name comparison
3. Yes, the comparator adds an alphabetical tie-breaker

Answer: 3. The alphabetical tie-breaker distinguishes the equal-length names.

### Run the starter, then try a change

Open `native/examples/algorithm-predicates.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/algorithm-predicates.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
names{"Grace", "Ada", "Linus"}
```

With

```cpp
names{"Linus", "Ada", "Grace"}
```

Rerun the terminal command. Compare the order of Grace and Linus across runs. What comparison decides which equal-length name comes first?

## Chapter project

Replace hand-written collection plumbing while preserving independent checks.
