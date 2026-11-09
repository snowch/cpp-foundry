# Searching and partition points

Implement scans, binary search, bounds, and indexed access.

## Represent a missing search result explicitly

A search result must distinguish a found position from absence. optional<size_t> avoids assigning a negative sentinel to an unsigned index or confusing position zero with failure.

The scan works on unsorted input and returns the first match. Those behaviors belong to its contract independently of how it counts or stores candidates.

```cpp
#include <array>
#include <iostream>
#include <optional>
#include <span>

std::optional<std::size_t> find(std::span<const int> values, int key) {
    for (std::size_t i = 0; i < values.size(); ++i)
        if (values[i] == key)
            return i;
    return std::nullopt;
}

int main() {
    const std::array<int, 4> values{8, 3, 8, 1};
    auto found = find(values, 8);
    if (found)
        std::cout << "first=" << *found << "\n";
    std::cout << "missing=" << !find(values, 9) << "\n";
}

```

Expected output:

```text
first=0
missing=1
```

The first match is a present optional containing zero. The absent key produces no position.

Pitfall: Testing the contained index as a Boolean would treat the first element as a failure.

Question: Is a found position of zero a success?

1. No
2. Yes
3. Only in sorted arrays

Answer: 2. Presence and numeric index value are different concepts.

Experiment: Test empty input, duplicates, and a last-position hit. State whether a future index implementation must preserve first-match behavior.

## Maintain a half-open candidate interval

Binary search maintains a half-open interval of possible answers. lower_bound searches for the first position whose value is not less than the key, so its answer can equal size when every element is smaller.

Compute the midpoint as first+(last-first)/2 to avoid adding two potentially large indices. The proof depends on the input’s ordering.

```cpp
#include <array>
#include <iostream>
#include <span>

std::size_t lower(std::span<const int> values, int key) {
    std::size_t first = 0, last = values.size();
    while (first < last) {
        auto middle = first + (last - first) / 2;
        if (values[middle] < key)
            first = middle + 1;
        else
            last = middle;
    }
    return first;
}

int main() {
    const std::array<int, 5> values{1, 3, 3, 5, 9};
    std::cout << lower(values, 3) << " " << lower(values, 4) << " " << lower(values, 10)
              << "\n";
}

```

Expected output:

```text
1 3 5
```

The first 3 is at position one, 4 would be inserted at position three, and 10 belongs at the end.

Pitfall: A valid insertion position is not proof that the key is present; compare the element only when the position is in range.

Question: Can lower return values.size()?

1. Yes, for an insertion at the end
2. No, it always finds an element
3. Only for invalid input

Answer: 1. The boundary position is a valid search answer.

Experiment: Trace first and last for empty input and for a key below every element. Explain why the interval shrinks each iteration.

## Find the full range of equal keys

lower_bound and upper_bound bracket equal keys in a sorted range. Their difference counts matches without scanning every equal element. A closed equality query can therefore be expressed using two half-open boundary searches.

Both operations must use ordering compatible with the data. A search by a different projected field needs a separately appropriate index.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{1, 3, 3, 3, 8};
    auto first = std::lower_bound(values.begin(), values.end(), 3);
    auto last = std::upper_bound(values.begin(), values.end(), 3);
    std::cout << "matches=" << last - first << "\n";
}

```

Expected output:

```text
matches=3
```

The lower iterator points to the first 3 and the upper iterator points to 8, excluding that element from the equal range.

Pitfall: Treating upper_bound as another pointer to the final equal element introduces an off-by-one error.

Question: Is the upper boundary included in the equal range?

1. Yes
2. No
3. Only if it equals end

Answer: 2. The result is the half-open interval [first,last).

Experiment: Test a missing key, all-equal input, and a key at the final position. Check the count against a linear reference.

## Search a monotone predicate

Binary search generalizes to a range partitioned by a predicate: all true results precede all false results. partition_point locates that boundary without requiring the predicate to be equality with a key.

The monotonicity condition is essential. An arbitrary filter predicate scattered through the range does not satisfy the search contract.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{2, 4, 6, 9, 11};
    auto boundary = std::partition_point(values.begin(), values.end(),
                                         [](int value) { return value < 8; });
    std::cout << "prefix=" << boundary - values.begin() << " next=" << *boundary
              << "\n";
}

```

Expected output:

```text
prefix=3 next=9
```

Exactly three elements satisfy the predicate before the first false result.

Pitfall: A predicate that alternates true and false violates partition_point’s precondition even if the input happens to be sorted for another purpose.

Question: What ordering of predicate results is required?

1. Alternating true and false
2. A true prefix followed by a false suffix
3. All results must be false

Answer: 2. The algorithm searches one monotone boundary.

Experiment: Create an all-true and an all-false fixture. Handle boundary==end before dereferencing it.

## Account for building and maintaining an index

An index accelerates some lookups by storing additional structure that must be built and maintained. A sorted vector permits binary search but insertion may shift a suffix. A hash index has different ordering and worst-case guarantees.

This fixture shows a sorted insertion position and the resulting sequence. It does not claim that every indexed workload is faster than scanning.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> index{1, 4, 9};
    auto position = std::lower_bound(index.begin(), index.end(), 5);
    auto shifted = index.end() - position;
    index.insert(position, 5);
    std::cout << "shifted=" << shifted << "\n";
    for (int key : index)
        std::cout << key;
    std::cout << "\n";
}

```

Expected output:

```text
shifted=1
1459
```

Only the old final element lies after the insertion position. The vector retains sorted order after insertion.

Pitfall: Quoting only lookup complexity hides index build costs, updates, memory, and workload selectivity.

Question: Which additional cost matters for a sorted vector?

1. Shifting elements during insertion
2. Every search sorts the entire vector
3. The key must be dynamically allocated

Answer: 1. Maintaining order has a mutation cost.

Experiment: Compare batches of many lookups with batches of many insertions. State which costs belong in the workload model.

## Chapter project

Build a duplicate-aware sorted lookup API.
