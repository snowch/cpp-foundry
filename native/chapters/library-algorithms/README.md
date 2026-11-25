# Algorithm contracts and numeric operations

Apply predicates, ordering, removal, folds, scans, and bounds correctly.

## Separate logical removal from physical erasure

Before this chapter: [Treat stream iteration as single pass](../library-iterators/README.md)

A comparator answers whether one value comes before another; a strict ordering must not put a value before itself. A fold combines inputs into one result, while a scan produces intermediate accumulated results. Each operation has requirements about its input order and destination storage.

The remove algorithm compacts retained values into a prefix and returns its logical end. It cannot change a container’s size through iterators. Erasing the remaining suffix performs physical removal; C++20 std::erase combines these steps for supported containers.

[Open figure: Logical end and vector size are different boundaries](../../diagrams/lib-remove-erase.html)

Why does the program print 4, then 2, then 2?

Why does the program print 4, then 2, then 2? Original vector: index 0 = 1, index 1 = 2, index 2 = 2, index 3 = 3. size=4.. After std::remove(...,2): index 0 = 1, index 1 = 3, index 2 = ?, index 3 = ?. Logical end is index 2; size is still 4. The trailing values are unspecified.. After erase(end,v.end()): index 0 = 1, index 1 = 3, index 2 = not live, index 3 = not live. size=2. Capacity need not shrink.. Question marks mean unspecified trailing values, not uninitialized storage or reliably removed 2s. The last two displayed positions are boundary markers after erase, not two remaining live elements.

Question marks mean unspecified trailing values, not uninitialized storage or reliably removed 2s. The last two displayed positions are boundary markers after erase, not two remaining live elements.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/lib-remove-erase.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lib-remove-erase.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
v.end(), 2)
```

With

```cpp
v.end(), 9)
```

Rerun the terminal command. Compare the size before erase, the distance to the logical end and the final size. What does remove return when nothing matches?

## Supply a strict weak ordering

Before this chapter: [Treat stream iteration as single pass](../library-iterators/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/lib-strict-order.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lib-strict-order.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::binary_search(v.begin(), v.end(), 3)
```

With

```cpp
std::binary_search(v.begin(), v.end(), 4)
```

Rerun the terminal command. Compare the two flags. Can the range be sorted correctly while a requested key is absent?

## Choose fold types and distinguish scans

Before this chapter: [Treat stream iteration as single pass](../library-iterators/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/lib-fold-scan.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lib-fold-scan.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::inclusive_scan(v.begin(), v.end(), prefix.begin());
```

With

```cpp
std::exclusive_scan(v.begin(), v.end(), prefix.begin(), 0);
```

Rerun the terminal command. Compare the three prefix values with the unchanged sum. Which values exclude their own element?

## Find a duplicate interval with equal_range

Before this chapter: [Treat stream iteration as single pass](../library-iterators/README.md)

lower_bound identifies the first element not less than a key, while upper_bound identifies the first element greater than it. equal_range returns their half-open interval. The range must satisfy the algorithm’s partitioning requirements under the same comparison relation.

[Open figure: Two bounds enclose every equal key](../../diagrams/lib-bounds-duplicates.html)

Why does equal_range return first position 1 and count 3?

Why does equal_range return first position 1 and count 3? Search key 2: index 0 = 1, index 1 = 2, index 2 = 2, index 3 = 2, index 4 = 4. The duplicate interval is [1,4); its length is 4−1=3.. The sorted/partitioned input contract is required. The upper bound is the first greater element, not the last equal element.

The sorted/partitioned input contract is required. The upper bound is the first greater element, not the last equal element.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/lib-bounds-duplicates.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lib-bounds-duplicates.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
v.end(), 2)
```

With

```cpp
v.end(), 3)
```

Rerun the terminal command. Compare the starting index and match count. What does the starting index describe when the match interval is empty?

## Chapter project

Build a checked batch report with explicit empty and duplicate behavior.
