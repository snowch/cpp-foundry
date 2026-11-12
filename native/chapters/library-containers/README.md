# Container contracts in practice

Choose sequence, ordered, and unordered containers by stability and complexity.

## Reserve capacity without creating elements

A vector owns a contiguous sequence. reserve changes capacity, while resize changes the number of live elements. Reallocation invalidates pointers, references, and iterators into its old storage; an index can be retained only when intervening edits preserve positions.

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v;
  v.reserve(8);
  v.push_back(3);
  auto index = v.size() - 1;
  v.reserve(32);
  std::cout << v.size() << " " << v.at(index);
}

```

Expected output:

```text
1 3
```

The code retains an index rather than an address across a capacity increase. It reacquires access through at after reallocation.

Pitfall: Do not dereference a saved pointer after a reserve call that reallocates, even when the old bytes appear unchanged.

Question: Which statement correctly describes this example’s contract?

1. reserve constructs every reserved element
2. All vector iterators survive reallocation
3. reserve does not increase size

Answer: 3. reserve does not increase size. The code retains an index rather than an address across a capacity increase. It reacquires access through at after reallocation.

Experiment: Save capacity before each push, identify which pushes reallocate, and compare with resize. Add an insertion before the saved index and explain why that index now needs adjustment.

## Compare end growth and stable list nodes

deque supports constant-time end insertion without promising contiguous storage. list owns separate nodes and supports splicing existing nodes between compatible lists without copying their values. Iterator validity and the container to which an iterator belongs are separate questions.

```cpp
#include <deque>
#include <iostream>
#include <list>

int main() {
  std::deque<int> d{2};
  d.push_front(1);
  d.push_back(3);
  std::list<int> a{4, 5}, b{6};
  auto it = a.begin();
  b.splice(b.end(), a, it);
  std::cout << d.front() << " " << d.back() << " " << *it << " " << a.size();
}

```

Expected output:

```text
1 3 4 1
```

The list iterator still denotes 4 after its node moves into b. The deque demonstrates both ends without storing an invalidated deque iterator.

Pitfall: Deque end insertion invalidates its iterators even though references to existing elements remain valid. Cross-list splice requires compatible allocators.

Question: Which statement correctly describes this example’s contract?

1. A spliced list iterator still denotes its moved element
2. A deque is contiguous like vector
3. Splicing always copies the value

Answer: 1. A spliced list iterator still denotes its moved element. The list iterator still denotes 4 after its node moves into b. The deque demonstrates both ends without storing an invalidated deque iterator.

Experiment: Record the full contents of both lists after splicing. Compare a vector implementation and identify which operation becomes linear.

## Distinguish lookup, insertion, and replacement

Ordered maps keep unique keys in comparator order. find and contains observe the map; operator[] inserts a default mapped value when the key is missing. try_emplace expresses insert-if-absent, while insert_or_assign explicitly permits replacement.

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
  std::map<std::string, int> m;
  auto [it, added] = m.try_emplace("Ada", 2);
  auto again = m.try_emplace("Ada", 9);
  std::cout << added << " " << again.second << " " << it->second << " "
            << m.contains("Grace");
}

```

Expected output:

```text
1 0 2 0
```

The second insertion reports false and preserves the original mapped value. contains checks another key without inserting it.

Pitfall: Using operator[] merely to check for absence mutates the map and can silently create a record.

Question: Which statement correctly describes this example’s contract?

1. contains inserts a default value
2. Every map lookup is constant time
3. try_emplace preserves an existing mapped value

Answer: 3. try_emplace preserves an existing mapped value. The second insertion reports false and preserves the original mapped value. contains checks another key without inserting it.

Experiment: Add insert_or_assign and inspect its insertion flag. Then compare find with operator[] for a missing name and check the map size.

## Hash equality and rehash contracts

Unordered containers provide average constant-time lookup, with linear worst cases. Equivalent keys must produce equal hashes; different keys may collide. reserve plans for a number of elements under the current maximum load factor, while rehash requests bucket capacity.

```cpp
#include <iostream>
#include <string>
#include <unordered_map>

int main() {
  std::unordered_map<std::string, int> counts;
  counts.max_load_factor(0.7f);
  counts.reserve(20);
  ++counts["Ada"];
  ++counts["Ada"];
  counts.rehash(100);
  std::cout << counts.at("Ada") << " " << counts.contains("Grace");
}

```

Expected output:

```text
2 0
```

The example checks values by key after rehash instead of assuming an iteration order. The count survives the bucket reorganization.

Pitfall: Rehash invalidates iterators, though references and pointers to surviving elements remain valid. Never persist an unordered iteration order as a file format.

Question: Which statement correctly describes this example’s contract?

1. Equal keys must have equal hashes
2. Distinct keys must have distinct hashes
3. Hash lookup has guaranteed constant worst-case time

Answer: 1. Equal keys must have equal hashes. The example checks values by key after rehash instead of assuming an iteration order. The count survives the bucket reorganization.

Experiment: Introduce a constant hash functor, insert many distinct keys, and verify correctness while discussing worst-case lookup. Reacquire iterators after rehash.

## Chapter project

Build a frequency index and document invalidation for each update.
