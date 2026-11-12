# Ranges, views, and borrowed lifetimes

Compose lazy views while tracking ownership, repeated work, and projections.

## Observe a lazy pipeline before materializing

A view is a lightweight range abstraction, not necessarily a container of computed results. filter and transform usually perform work during iteration. This lvalue pipeline borrows the vector, so the source must outlive its use and iterator invalidation rules still apply.

```cpp
#include <iostream>
#include <ranges>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 3, 4};
  auto even = v | std::views::filter([](int n) { return n % 2 == 0; }) |
              std::views::transform([](int n) { return n * n; });
  for (int n : even)
    std::cout << n << " ";
}

```

Expected output:

```text
4 16 
```

Iteration selects two even values and computes their squares on demand. No result vector is created.

Pitfall: Returning a view that refers to a local vector leaves a dangling source. Do not assume every view owns its input.

Question: Which statement correctly describes this example’s contract?

1. The source vector must outlive this borrowed pipeline
2. Every view owns a copy of its source
3. Creating transform eagerly computes all results

Answer: 1. The source vector must outlive this borrowed pipeline. Iteration selects two even values and computes their squares on demand. No result vector is created.

Experiment: Materialize the pipeline into an explicit vector using a loop. Compare repeated traversal with cached results using a side-effect-free transformation counter outside production code.

## Sort records through a projection

Ranges algorithms can apply a projection before comparison. A member pointer expresses which field participates while leaving the comparison itself reusable. Sorting by one field does not automatically choose a deterministic secondary order for equal keys.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Row {
  std::string name;
  int score;
};
int main() {
  std::vector<Row> rows{{"Ada", 3}, {"Grace", 1}};
  std::ranges::sort(rows, {}, &Row::score);
  for (const auto &r : rows)
    std::cout << r.name << " ";
}

```

Expected output:

```text
Grace Ada 
```

The score projection puts Grace before Ada. The record values remain intact; only their positions change.

Pitfall: ranges::sort is not stable. Add a secondary key or use a stable algorithm when equal-score order is part of the contract.

Question: Which statement correctly describes this example’s contract?

1. The projection chooses the compared field
2. A projection strips other fields from each record
3. ranges::sort guarantees stable equal-key order

Answer: 1. The projection chooses the compared field. The score projection puts Grace before Ada. The record values remain intact; only their positions change.

Experiment: Add tied scores and compare a lexicographic comparator with stable_sort. Document whether input order or a name tie-break is required.

## Bound a generated range before consuming it

An unbounded iota view can generate successive values without storing them. A terminating consumer must impose a suitable bound. take limits how many values are requested, but does not make arbitrary source operations safe or remove numeric representability limits.

```cpp
#include <iostream>
#include <ranges>

int main() {
  auto values = std::views::iota(1) | std::views::take(4);
  for (int n : values)
    std::cout << n << " ";
}

```

Expected output:

```text
1 2 3 4 
```

The take adaptor stops iteration after four integers, so the unbounded source is never exhausted.

Pitfall: Filtering an infinite source for a condition that never matches may never produce the first value, even when followed by take(1).

Question: Which statement correctly describes this example’s contract?

1. Every view is finite
2. The consumer must establish termination
3. take prevents any upstream nontermination

Answer: 2. The consumer must establish termination. The take adaptor stops iteration after four integers, so the unbounded source is never exhausted.

Experiment: Compare iota(1,5) with an unbounded iota followed by take. Explain why moving a filter before the count bound can alter termination.

## Keep algorithm results tied to a living range

Some ranges algorithms return dangling instead of an iterator when passed a temporary non-borrowed range. This catches one class of lifetime mistake at the type level. borrowed_range concerns whether iterators can outlive the range object, not whether the underlying elements live forever.

```cpp
#include <algorithm>
#include <iostream>
#include <ranges>
#include <type_traits>
#include <vector>

int main() {
  std::vector<int> v{2, 4, 6};
  auto it = std::ranges::find(v, 4);
  using Result = decltype(std::ranges::find(std::vector<int>{2, 4}, 4));
  std::cout << *it << " " << std::is_same_v<Result, std::ranges::dangling>;
}

```

Expected output:

```text
4 1
```

The lvalue vector yields a usable iterator. The temporary-vector expression is inspected only as a type and yields dangling.

Pitfall: A span can be a borrowed range while still referring to destroyed storage. The range concept does not prove ownership of its elements.

Question: Which statement correctly describes this example’s contract?

1. borrowed_range guarantees eternal storage
2. A temporary vector returns an owning iterator
3. A borrowed range still needs live underlying elements

Answer: 3. A borrowed range still needs live underlying elements. The lvalue vector yields a usable iterator. The temporary-vector expression is inspected only as a type and yields dangling.

Experiment: Compare the result type for a span over a living array. Then write a lifetime diagram for a span returned from a local array without executing invalid access.

## Chapter project

Create an owned report from a borrowed filtering pipeline.
