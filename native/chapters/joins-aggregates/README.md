# Joins, grouping, and richer queries

Implement relational operators with explicit empty/duplicate behavior.

## A join must preserve matching multiplicity

An inner equijoin produces one result for every matching pair of input rows. Duplicate keys on either side therefore multiply results rather than disappearing into one representative.

Nested-loop execution is a clear reference implementation: it checks every left/right pair and supplies an independent oracle for a later indexed or hash join.

```cpp
#include <iostream>
#include <string>
#include <utility>
#include <vector>

int main() {
    const std::vector<std::pair<int, std::string>> left{{1, "A"}, {2, "B"}},
        right{{1, "X"}, {1, "Y"}};
    for (const auto &a : left)
        for (const auto &b : right)
            if (a.first == b.first)
                std::cout << a.second << b.second << "\n";
}

```

Expected output:

```text
AX
AY
```

The left key one matches both right rows, producing two distinct result pairs.

Pitfall: Replacing the right input with a unique-key map can silently discard duplicate join matches.

Question: How many outputs arise from one left row and two matching right rows?

1. One
2. Zero unless keys are unique
3. Two

Answer: 3. Join multiplicity follows matching pairs.

Experiment: Add two left duplicates and predict the cross-product size for that key before running.

## A hash join bucket owns all matching build rows

A hash join groups build-side rows by key, then probes with the other input. Each bucket must retain all duplicate payloads to preserve inner-join multiplicity.

This small model uses an ordered map of vectors for deterministic display; the bucket contract is the same even when a hash container supplies lookup.

```cpp
#include <iostream>
#include <map>
#include <string>
#include <utility>
#include <vector>

int main() {
    const std::vector<std::pair<int, std::string>> build{{1, "X"}, {1, "Y"}, {3, "Z"}};
    std::map<int, std::vector<std::string>> buckets;
    for (const auto &[key, value] : build)
        buckets[key].push_back(value);
    for (const auto &value : buckets.at(1))
        std::cout << "A" << value << "\n";
}

```

Expected output:

```text
AX
AY
```

Both payloads remain in the key-one bucket, matching the nested-loop reference result.

Pitfall: One scalar payload per join key loses multiplicity unless the schema genuinely guarantees uniqueness.

Question: What must the bucket retain?

1. Every build row for the key
2. Only the last inserted row
3. Only the key’s hash number

Answer: 1. The probe must enumerate all matching build rows.

Experiment: Compare complete result multisets with a nested-loop join across empty, duplicate-heavy, and unmatched fixtures.

## An unmatched left row needs an explicit absent payload

A left outer join retains every left row even when no right row matches. The result needs an absent right-side representation rather than inventing a real value such as zero or an empty name.

The example uses optional<string> for the projected right payload. A full relational engine also defines null propagation and predicate semantics explicitly.

```cpp
#include <iostream>
#include <map>
#include <optional>
#include <string>

int main() {
    const std::map<int, std::string> right{{1, "X"}};
    for (int key : {1, 2}) {
        std::optional<std::string> matched;
        auto found = right.find(key);
        if (found != right.end())
            matched = found->second;
        std::cout << key << ":" << matched.value_or("<missing>") << "\n";
    }
}

```

Expected output:

```text
1:X
2:<missing>
```

The second left key still produces a result, with an explicitly absent right payload.

Pitfall: Filtering out missing right rows after an outer join can turn the observable result into inner-join behavior.

Question: Does an unmatched left row disappear?

1. Yes
2. Only if its key is positive
3. No

Answer: 3. The left-outer contract retains it with an absent right side.

Experiment: Add a right-side filter and distinguish placing it in the join condition from placing it after the outer join.

## Group state by a declared key

Grouping creates one aggregate state per grouping key. A count and a sum have different empty and overflow considerations, and the state should be updated only for rows belonging to that group.

This bounded fixture uses small positive values so its integer sums are representable. A production aggregate needs checked arithmetic and clear null handling.

```cpp
#include <iostream>
#include <map>
#include <utility>
#include <vector>

int main() {
    const std::vector<std::pair<int, int>> rows{{1, 10}, {2, 7}, {1, 20}};
    std::map<int, std::pair<unsigned, int>> groups;
    for (auto [key, value] : rows) {
        auto &state = groups[key];
        ++state.first;
        state.second += value;
    }
    for (auto [key, state] : groups)
        std::cout << key << " count=" << state.first << " sum=" << state.second << "\n";
}

```

Expected output:

```text
1 count=2 sum=30
2 count=1 sum=7
```

Key one accumulates two values and key two accumulates one. Ordered map iteration makes this fixture’s output deterministic.

Pitfall: An aggregate accumulator can overflow even when every input field individually fits its type.

Question: Why is aggregate state keyed separately?

1. The key itself is always the sum
2. Each group needs its own count and sum
3. Grouping removes all duplicates first

Answer: 2. Rows contribute to their matching group’s state.

Experiment: Test an empty input and a new group appearing late. Compare results with a hand-computed fixture before optimizing.

## Distinguish row count, present-value count, and absent sum

An aggregate over optional values can count all rows separately from the number of present values. An absent sum for no contributing values differs from a present sum equal to zero.

These semantics need to be declared before execution, especially when outer joins introduce absent fields. The fixture models those distinctions explicitly rather than relying on a magic numeric sentinel.

```cpp
#include <iostream>
#include <optional>
#include <vector>

int main() {
    const std::vector<std::optional<int>> values{0, std::nullopt, 5};
    unsigned present = 0;
    std::optional<int> sum;
    for (auto value : values)
        if (value) {
            ++present;
            sum = sum.value_or(0) + *value;
        }
    std::cout << "rows=" << values.size() << " present=" << present << " sum=" << *sum
              << "\n";
}

```

Expected output:

```text
rows=3 present=2 sum=5
```

The present zero contributes to the value count, while the absent entry contributes only to the row count.

Pitfall: Testing *value as a Boolean would incorrectly treat a present zero as absence.

Question: Does the present zero count as a value?

1. No
2. Only when the sum is nonzero
3. Yes

Answer: 3. Optional engagement is independent of the contained number.

Experiment: Run empty and all-absent inputs and keep sum disengaged. Define how COUNT and SUM results are presented in the query API.

## Chapter project

Add a join and grouped aggregate with independent expected rows.
