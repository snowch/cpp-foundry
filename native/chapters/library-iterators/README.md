# Iterator categories and invalidation

Use iterator capabilities, sentinels, adapters, and erase results safely.

## Match operations to iterator capabilities

Random-access iterators support constant-time differences and jumps. A list iterator is bidirectional: reaching a distant element requires repeated increments. Generic interfaces should constrain the operations they need rather than assuming every iterator behaves like a pointer.

```cpp
#include <iostream>
#include <iterator>
#include <list>
#include <vector>

int main() {
  std::vector<int> v{2, 4, 6};
  std::list<int> l{2, 4, 6};
  auto it = l.begin();
  std::advance(it, 2);
  std::cout << v.end() - v.begin() << " " << *it;
}

```

Expected output:

```text
3 6
```

The vector difference counts three elements. advance reaches the list value 6 by walking two links.

Pitfall: std::distance on a list is linear; repeated distance calls inside a loop can create quadratic work.

Question: Which statement correctly describes this example’s contract?

1. Advancing a list iterator takes linear steps
2. Every iterator supports subtraction
3. Iterator category determines element ownership

Answer: 1. Advancing a list iterator takes linear steps. The vector difference counts three elements. advance reaches the list value 6 by walking two links.

Experiment: Use a forward_list and identify which operations disappear. Count increments in a wrapper iterator instead of timing a three-element fixture.

## Continue traversal using erase’s result

Erasing from a vector invalidates iterators and references at or after the erased position. erase returns a valid iterator to the next surviving element, possibly end. A loop must decide whether to advance based on whether it erased an element.

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 4, 3};
  for (auto it = v.begin(); it != v.end();) {
    if (*it % 2 == 0)
      it = v.erase(it);
    else
      ++it;
  }
  for (int n : v)
    std::cout << n;
}

```

Expected output:

```text
13
```

Two adjacent even values are removed without skipping either. The iterator returned by erase replaces the invalid old iterator.

Pitfall: Incrementing an invalid iterator or incrementing again immediately after erase can skip elements or violate a precondition.

Question: Which statement correctly describes this example’s contract?

1. Every vector iterator survives erase
2. Always increment after erase
3. Use the iterator returned by erase

Answer: 3. Use the iterator returned by erase. Two adjacent even values are removed without skipping either. The iterator returned by erase replaces the invalid old iterator.

Experiment: Test empty input, all-even input, and alternating values. Rewrite with std::erase_if and compare the returned count.

## Insert through an output iterator

An output iterator describes where produced values go. back_inserter adapts push_back into assignment through an iterator, growing the destination as needed. In contrast, copying into begin on an empty vector does not create destination elements.

```cpp
#include <algorithm>
#include <iostream>
#include <iterator>
#include <vector>

int main() {
  std::vector<int> a{1, 2, 3}, b;
  std::transform(a.begin(), a.end(), std::back_inserter(b),
                 [](int n) { return n * n; });
  for (int n : b)
    std::cout << n << " ";
}

```

Expected output:

```text
1 4 9 
```

transform emits one square per input element; the adapter inserts each result into b.

Pitfall: reserve alone is not enough to make b.begin a writable range of initialized elements. Resize first or use an insertion adapter.

Question: Which statement correctly describes this example’s contract?

1. reserve makes begin writable for capacity elements
2. back_inserter grows the destination
3. transform always resizes its destination

Answer: 2. back_inserter grows the destination. transform emits one square per input element; the adapter inserts each result into b.

Experiment: Pre-size b and use b.begin instead. Compare sizes and capacities, then adapt the example to insert into a set.

## Treat stream iteration as single pass

Input iterators can represent a single-pass source. Reading advances shared stream state, so copying an input iterator does not provide an independently rewindable sequence. A default stream iterator acts as the end sentinel once extraction fails or input ends.

```cpp
#include <iostream>
#include <iterator>
#include <numeric>
#include <sstream>

int main() {
  std::istringstream input("3 4 5");
  std::istream_iterator<int> first(input), last;
  std::cout << std::accumulate(first, last, 0);
}

```

Expected output:

```text
12
```

accumulate consumes all three integers and produces their sum without materializing a vector.

Pitfall: Do not measure a single-pass range with distance and then expect a second traversal to read the same input.

Question: Which statement correctly describes this example’s contract?

1. Copying an input iterator rewinds the stream
2. Every input iterator is multipass
3. Stream input iteration consumes the source

Answer: 3. Stream input iteration consumes the source. accumulate consumes all three integers and produces their sum without materializing a vector.

Experiment: Add malformed text between two numbers and inspect the stream state. Materialize the valid prefix when two independent traversals are required.

## Chapter project

Write a generic range copier without assuming random access.
