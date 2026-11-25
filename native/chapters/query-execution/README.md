# Query execution operators

Compose scans, filters, projections, and bounded result production.

## A scan produces candidate rows

Before this chapter: [Parse into a typed query value](../parsing-sql/README.md)

A query operator is one stage in producing results, not a C++ arithmetic operator. A scan supplies rows, a filter keeps selected rows, and projection chooses fields. A pipeline connects those stages so later stages consume earlier output.

A table scan visits each logical row and offers it to the next operator. It is a useful baseline because its cost and semantics are easy to state. An index may later reduce candidates without changing the query result.

This model scans owning Row values in a vector. A storage-backed scan also needs page lifetime and invalidation rules.

```cpp
#include <iostream>
#include <string>
#include <vector>

struct Row {
    unsigned id;
    std::string name;
    unsigned score;
};
const std::vector<Row> fixture{{1, "Ada", 90}, {2, "Grace", 95}, {3, "Linus", 70}};

int main() {
    unsigned visited = 0;
    for (const auto &row : fixture) {
        ++visited;
        std::cout << row.id << " ";
    }
    std::cout << "visited=" << visited << "\n";
}

```

Original program output:

```text
1 2 3 visited=3
```

Every row is visited once, and the result preserves this fixture’s physical scan order.

Pitfall: A query without an ordering clause should not accidentally promise a storage-dependent order in a general engine.

Question: What does the scan cost count here?

1. Only returned names
2. Visited candidate rows
3. Compilation time

Answer: 2. The counter measures candidate production.

### Run the starter, then try a change

Open `native/examples/scan-operator.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/scan-operator.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::cout << row.id << " ";
```

With

```cpp
if (row.id == 2) std::cout << row.id << " ";
```

Rerun the terminal command. Compare the printed IDs and visited=. Why does emitting fewer rows leave the full scan’s visit count unchanged?

## A filter changes membership without changing the source

Before this chapter: [Parse into a typed query value](../parsing-sql/README.md)

A filter applies a predicate to candidate rows and forwards only matches. Keep the predicate’s domain and nullability rules explicit; the bounded teaching schema has no null scores.

Borrowing const rows avoids copying during a scan, while the result can own IDs or complete rows depending on its lifetime contract.

```cpp
#include <iostream>
#include <string>
#include <vector>

struct Row {
    unsigned id;
    std::string name;
    unsigned score;
};
const std::vector<Row> fixture{{1, "Ada", 90}, {2, "Grace", 95}, {3, "Linus", 70}};

int main() {
    std::vector<unsigned> ids;
    for (const auto &row : fixture)
        if (row.score >= 90)
            ids.push_back(row.id);
    for (auto id : ids)
        std::cout << id;
    std::cout << " source=" << fixture.size() << "\n";
}

```

Original program output:

```text
12 source=3
```

Two rows match the inclusive score threshold. The three-row source remains unchanged.

Pitfall: Mutating the source while a filter holds references can invalidate traversal and change the query being evaluated.

Question: Does this filter erase nonmatching source rows?

1. Yes
2. No
3. Only scores below zero

Answer: 2. Filtering result membership is distinct from deleting stored rows.

### Run the starter, then try a change

Open `native/examples/filter-operator.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/filter-operator.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
row.score >= 90
```

With

```cpp
row.score >= 96
```

Rerun the terminal command. Compare the selected IDs and source=. What does the source count describe even if the filter accepts no rows?

## Projection chooses result fields

Before this chapter: [Parse into a typed query value](../parsing-sql/README.md)

Projection converts a row into the requested output shape. It need not preserve every stored field. An owning projected string is appropriate when results must survive the end of the scan or a later page eviction.

A borrowed view can avoid copying only when its owner lifetime is guaranteed through result consumption.

```cpp
#include <iostream>
#include <string>
#include <vector>

struct Row {
    unsigned id;
    std::string name;
    unsigned score;
};
const std::vector<Row> fixture{{1, "Ada", 90}, {2, "Grace", 95}, {3, "Linus", 70}};

int main() {
    std::vector<std::string> names;
    for (const auto &row : fixture)
        names.push_back(row.name);
    std::cout << names.at(0) << " fields=1\n";
}

```

Original program output:

```text
Ada fields=1
```

The result owns just the name field. Its representation no longer exposes score or ID.

Pitfall: Returning string_views into an evicted page creates dangling query results.

Question: Why own names in a retained result?

1. Projection always requires dynamic dispatch
2. string_view cannot print
3. The result may outlive the scanned storage

Answer: 3. Ownership decouples the result lifetime from the scan buffers.

### Run the starter, then try a change

Open `native/examples/projection-operator.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/projection-operator.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
names.at(0)
```

With

```cpp
names.at(1)
```

Rerun the terminal command. Compare the printed name and fields=. Which value changes when you read the second projected row?

## A limit can stop upstream work

Before this chapter: [Parse into a typed query value](../parsing-sql/README.md)

A pull-style execution pipeline can stop requesting candidates after producing the required result count. This can reduce work when combined with a scan, though the exact behavior depends on filters and ordering requirements.

A limit without a specified order does not identify a universal set of “first” rows across different access paths.

```cpp
#include <iostream>
#include <string>
#include <vector>

struct Row {
    unsigned id;
    std::string name;
    unsigned score;
};
const std::vector<Row> fixture{{1, "Ada", 90}, {2, "Grace", 95}, {3, "Linus", 70}};

int main() {
    unsigned visited = 0, emitted = 0;
    const unsigned limit = 2;
    for (const auto &row : fixture) {
        if (emitted == limit)
            break;
        ++visited;
        if (row.score >= 80) {
            std::cout << row.id;
            ++emitted;
        }
    }
    std::cout << " visited=" << visited << "\n";
}

```

Original program output:

```text
12 visited=2
```

Both initial rows match, so the pipeline stops before visiting the third row.

Pitfall: Sorting the entire result before limiting has a different work profile from stopping an unordered scan early.

Question: Why is the third row not visited?

1. The output limit is already satisfied
2. Its ID is invalid
3. The scan stores only two rows

Answer: 1. The pipeline stops requesting work after two emissions.

### Run the starter, then try a change

Open `native/examples/limit-operator.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/limit-operator.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
limit = 2
```

With

```cpp
limit = 1
```

Rerun the terminal command. Compare the printed IDs and visited=. At what point can the scan stop after lowering the number it may emit?

## Compose operators while preserving the query contract

Before this chapter: [Parse into a typed query value](../parsing-sql/README.md)

A query pipeline can separate selection, ordering, and projection into distinct steps with observable intermediate sizes. Reordering operators is legal only when it preserves the documented result.

This fixture filters high scores, orders by descending score with an ID tie-breaker, and projects names. It deliberately materializes a small bounded candidate vector.

[Open figure: Operators have different responsibilities](../../diagrams/operator-composition.html)

Which stage selects rows and which orders the selected names?

Which stage selects rows and which orders the selected names? Read fixture rows; Filter score ≥ 90. Exclude rows that do not match.; Sort selected rows. Score descending; break ties with ID ascending.; Print names. Only selected rows reach this output.. This is the order in the supplied program. The filter explicitly stores a selected vector; do not infer that every possible query pipeline materializes every stage or that this program applies LIMIT.

This is the order in the supplied program. The filter explicitly stores a selected vector; do not infer that every possible query pipeline materializes every stage or that this program applies LIMIT.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Row {
    unsigned id;
    std::string name;
    unsigned score;
};
const std::vector<Row> fixture{{1, "Ada", 90}, {2, "Grace", 95}, {3, "Linus", 70}};

int main() {
    std::vector<Row> selected;
    for (const auto &row : fixture)
        if (row.score >= 90)
            selected.push_back(row);
    std::ranges::sort(selected, [](const Row &a, const Row &b) {
        return a.score == b.score ? a.id < b.id : a.score > b.score;
    });
    for (const auto &row : selected)
        std::cout << row.name << "\n";
}

```

Original program output:

```text
Grace
Ada
```

Filtering retains Ada and Grace; descending score order places Grace first before projecting names.

Pitfall: Pushing a limit ahead of a required sort can change which rows are returned.

Question: Can LIMIT always move ahead of ORDER BY?

1. Yes
2. No, it can change selected rows
3. Only when rows own strings

Answer: 2. Operator order is constrained by query semantics.

### Run the starter, then try a change

Open `native/examples/operator-composition.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/operator-composition.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
row.score >= 90
```

With

```cpp
row.score >= 95
```

Rerun the terminal command. Compare the ordered names. Which step removes rows before the sort compares them?

## Chapter project

Build an explainable scan/filter/project pipeline.
