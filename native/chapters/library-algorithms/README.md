# Algorithm contracts and numeric operations

Apply predicates, ordering, removal, folds, scans, and bounds correctly.

## Separate logical removal from physical erasure

The remove algorithm compacts retained values into a prefix and returns its logical end. It cannot change a container’s size through iterators. Erasing the remaining suffix performs physical removal; C++20 std::erase combines these steps for supported containers.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 2, 3};
  auto end = std::remove(v.begin(), v.end(), 2);
  std::cout << v.size() << " " << (end - v.begin()) << " ";
  v.erase(end, v.end());
  std::cout << v.size();
}

```

Expected output:

```text
4 2 2
```

Size remains four after remove, while the retained prefix has length two. Erasing the suffix leaves two elements.

Pitfall: The suffix after remove contains valid but unspecified values; do not interpret it as a reliable collection of removed items.

Question: Which statement correctly describes this example’s contract?

1. remove always shrinks the container
2. The suffix lists all removed values
3. remove returns a logical end without shrinking the vector

Answer: 3. remove returns a logical end without shrinking the vector. Size remains four after remove, while the retained prefix has length two. Erasing the suffix leaves two elements.

Experiment: Compare remove, remove_if, std::erase, and std::erase_if on duplicates and empty input. Check both the returned count and final sequence.

## Supply a strict weak ordering

Sorting requires a strict weak ordering. In particular, comp(x,x) must be false; using <= violates the contract. Search algorithms require a compatible partitioning or ordering, and stable_sort additionally preserves relative order among equivalent elements.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{3, 1, 3, 2};
  std::stable_sort(v.begin(), v.end(), [](int a, int b) { return a < b; });
  std::cout << std::is_sorted(v.begin(), v.end()) << " "
            << std::binary_search(v.begin(), v.end(), 3);
}

```

Expected output:

```text
1 1
```

The strict comparator produces ascending order, which is also the ordering used by binary_search.

Pitfall: A comparator depending on changing external state can break ordering even when each individual comparison looks plausible.

Question: Which statement correctly describes this example’s contract?

1. Using <= is a valid sorting comparator
2. A strict comparator returns false for equal arguments
3. binary_search works on any unsorted range

Answer: 2. A strict comparator returns false for equal arguments. The strict comparator produces ascending order, which is also the ordering used by binary_search.

Experiment: Sort records by score and attach original positions to show stability. Test irreflexivity and transitivity over a small finite domain.

## Choose fold types and distinguish scans

accumulate performs an ordered left fold whose accumulator type comes from the initial value. Scans produce intermediate prefixes rather than a single total. reduce may regroup operations, so it has different requirements when operations are not associative or floating-point rounding matters.

```cpp
#include <iostream>
#include <numeric>
#include <vector>

int main() {
  std::vector<int> v{2, 3, 4}, prefix(3);
  auto sum = std::accumulate(v.begin(), v.end(), 0LL);
  std::inclusive_scan(v.begin(), v.end(), prefix.begin());
  std::cout << sum << " " << prefix[0] << " " << prefix[1] << " " << prefix[2];
}

```

Expected output:

```text
9 2 5 9
```

The long long seed chooses a wider sum type. The inclusive scan includes the current input in each prefix.

Pitfall: A wider result variable does not widen a fold whose initial value is int. Signed overflow remains invalid.

Question: Which statement correctly describes this example’s contract?

1. The assignment target determines the accumulator type
2. The initial value determines accumulate’s accumulator type
3. reduce always preserves left-to-right grouping

Answer: 2. The initial value determines accumulate’s accumulator type. The long long seed chooses a wider sum type. The inclusive scan includes the current input in each prefix.

Experiment: Compare exclusive_scan with an initial zero. Use subtraction to explain why arbitrary regrouping differs from an ordered left fold.

## Find a duplicate interval with equal_range

lower_bound identifies the first element not less than a key, while upper_bound identifies the first element greater than it. equal_range returns their half-open interval. The range must satisfy the algorithm’s partitioning requirements under the same comparison relation.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 2, 2, 4};
  auto [first, last] = std::equal_range(v.begin(), v.end(), 2);
  std::cout << (first - v.begin()) << " " << (last - first);
}

```

Expected output:

```text
1 3
```

The three copies of 2 occupy indices one through three; their interval starts at one and has length three.

Pitfall: A logarithmic comparison count does not imply logarithmic iterator movement on a linked list.

Question: Which statement correctly describes this example’s contract?

1. The upper bound points to the last equal element
2. The equal range is half-open
3. Bounds algorithms sort their input

Answer: 2. The equal range is half-open. The three copies of 2 occupy indices one through three; their interval starts at one and has length three.

Experiment: Search for keys before, between, and after the stored values. Repeat with a descending comparator and preserve the matching ordering contract.

## Chapter project

Build a checked batch report with explicit empty and duplicate behavior.
