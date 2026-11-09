# Algorithms and generic code

Use the standard library, then understand the costs.

## Algorithms separate intent from iteration

An algorithm names an operation over a range. std::ranges::sort makes the ordering step explicit and can use a projection to choose a record field. It rearranges the existing elements; it does not create an independent sorted collection.

Sorting N elements takes O(N log N) comparisons. Binary search then takes O(log N) comparisons on a random-access sorted range, but maintaining that order has a cost. Measure the actual workload before assuming that a sorted vector is the right index.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
struct Person { int id; std::string name; };
int main() {
    std::vector<Person> people{{3,"Grace"},{1,"Ada"},{2,"Linus"}};
    std::ranges::sort(people, {}, &Person::id);
    for (const auto& person : people)
        std::cout << person.id << ' ' << person.name << '\n';
    bool found = std::ranges::binary_search(people, 2, {}, &Person::id);
    std::cout << "found=" << found << '\n';
}
```

Expected output:

```text
1 Ada
2 Linus
3 Grace
found=1
```

The projection &Person::id compares IDs without writing a custom iterator loop. The binary search uses the same ordering and projection as the sort.

Pitfall: Binary search requires the range to be partitioned appropriately for the search key and comparison. Sorting by name and then searching by ID violates that precondition in general.

Question: What must sort and binary_search agree on?

1. The ordering and projected key
2. The number of output lines
3. The vector capacity

Answer: 1. A search can discard half the range only when its ordering assumptions match the data.

Experiment: Search for an absent ID. Then insert a new smallest ID at the end and restore the sorted invariant before searching again.

## Choose an index for its contract

std::map keeps keys ordered and provides logarithmic lookup, insertion, and removal. std::unordered_map uses hashing and offers average constant-time lookup, with linear worst cases. Neither choice removes the need to specify uniqueness and failure behavior.

Use find for a read-only lookup. operator[] on a map inserts a default-constructed value when the key is missing. try_emplace gives an explicit inserted flag and leaves an existing value in place.

```cpp
#include <iostream>
#include <map>
#include <string>
int main() {
    std::map<int,std::string> names;
    auto [position, inserted] = names.try_emplace(1,"Ada");
    std::cout << "inserted=" << inserted << '\n';
    auto duplicate = names.try_emplace(1,"Grace");
    std::cout << "duplicate=" << !duplicate.second << '\n';
    std::cout << position->second << '\n';
    std::cout << "missing=" << (names.find(9) == names.end()) << '\n';
    std::cout << "size=" << names.size() << '\n';
}
```

Expected output:

```text
inserted=1
duplicate=1
Ada
missing=1
size=1
```

The second insertion reports a duplicate and preserves Ada. The unsuccessful find does not create key 9, so the final size is still one.

Pitfall: Using map[key] merely to ask whether a key exists can change the collection and conceal a missing-record bug.

Question: Which operation checks without inserting?

1. find
2. operator[]
3. try_emplace with an empty name

Answer: 1. find observes the collection; operator[] is also a mutation operation for absent keys.

Experiment: Replace find(9) with names[9], then explain the new size and empty string. Compare ordered iteration with unordered_map.

## Views describe a lazy computation

A range view often borrows its input and produces elements on demand. Composing filter and transform describes a pipeline without immediately allocating another collection. The source must remain alive while a borrowing view is used.

Laziness is useful, but does not imply that every operation is cheap or evaluated once. A predicate or projection can be called again as you traverse. Keep those functions free of surprising side effects.

```cpp
#include <iostream>
#include <ranges>
#include <vector>
int main() {
    const std::vector<int> scores{40,70,90,50};
    auto passing = scores
        | std::views::filter([](int score) { return score >= 60; })
        | std::views::transform([](int score) { return score + 5; });
    for (int score : passing) std::cout << score << '\n';
    std::cout << "original=" << scores[1] << '\n';
}
```

Expected output:

```text
75
95
original=70
```

filter admits 70 and 90, then transform produces 75 and 95. The transform returns values and does not modify the const source vector.

Pitfall: Returning a borrowing view of a local vector can leave the caller with dangling storage. Materialize an owning result when the source cannot outlive the view.

Question: Where are 75 and 95 stored before iteration?

1. They are computed on demand
2. In a second vector created by filter
3. In the original vector

Answer: 1. This pipeline computes transformed values as it is traversed.

Experiment: Traverse the view twice with a counter in the transform. Explain why side effects can make a lazy pipeline harder to understand.

## Constrain templates to express intent

A function template describes a family of functions. A concept constrains which types belong to that family. A readable constraint can move an error to the call site instead of leaving it deep inside a template implementation.

A constraint describes operations and semantic expectations; it does not prove arbitrary properties of an algorithm. std::integral accepts signed and unsigned integer types. Our sum example uses bounded positive values so that its arithmetic remains representable.

```cpp
#include <concepts>
#include <iostream>
#include <span>
template <std::integral T>
T total(std::span<const T> values) {
    T result{};
    for (T value : values) result += value;
    return result;
}
int main() {
    const int values[]{2,3,4};
    std::cout << total<int>(values) << '\n';
}
```

Expected output:

```text
9
```

The compiler instantiates total<int>. A span passes a pointer and count as one borrowing interface. It does not copy the array or own its storage.

Pitfall: A concept such as integral does not establish that a sum cannot overflow. Numeric contracts still need domain bounds or checked arithmetic.

Question: Does std::integral prove addition cannot overflow?

1. No
2. Yes, for signed integers
3. Yes, when using span

Answer: 1. The concept checks the kind of type; representability depends on the actual values and operations.

Experiment: Attempt total<double> with a double array and read the constraint diagnostic. Design a checked-total variant using optional.

## Chapter project

Build a searchable, sorted record index.
