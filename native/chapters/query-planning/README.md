# Planning and access costs

Choose access paths using explicit statistics and assumptions.

## Compare candidate access paths under a stated model

A planner compares estimated costs for access paths that produce the same logical candidates. A simple model can count scan row visits versus index traversal plus fetched matches. The units and assumptions must be stated before comparing numbers.

This fixture treats one counted operation as one model unit; it is not a hardware latency prediction.

```cpp
#include <iostream>

int main() {
    unsigned rows = 1000, height = 3, matches = 4;
    unsigned scan = rows, index = height + matches;
    std::cout << "scan=" << scan << " index=" << index
              << " choose=" << (index < scan ? "index" : "scan") << "\n";
}

```

Expected output:

```text
scan=1000 index=7 choose=index
```

The selective lookup visits far fewer modeled units than scanning all rows.

Pitfall: Comparing row counts with milliseconds without a conversion model gives meaningless costs.

Question: What makes the two costs comparable here?

1. Both variables are unsigned
2. They use the same explicitly chosen model unit
3. The index has a shorter name

Answer: 2. A cost model must define common units and relevant work.

Experiment: Add per-page fetch and sequential-scan weights. State which observations would justify those weights.

## Selectivity changes the cost of an index lookup

An index is most useful when it eliminates substantial work. If nearly every row matches and each index result requires a separate fetch, a scan can become cheaper under the chosen model.

Selectivity is a workload property, not an invariant of the index data structure. Estimate it from appropriate statistics and validate estimates against actual candidate counts.

```cpp
#include <iostream>

int main() {
    for (unsigned matches : {4u, 1000u}) {
        unsigned scan = 1000, index = 3 + 2 * matches;
        std::cout << matches << ":" << (index < scan ? "index" : "scan") << "\n";
    }
}

```

Expected output:

```text
4:index
1000:scan
```

Four matches favor the index; a thousand modeled two-unit fetches favor scanning.

Pitfall: Choosing an index merely because one exists ignores selectivity and access costs.

Question: Can a full-table match favor a scan?

1. Yes
2. No, indexes are always faster
3. Only if the key type is a string

Answer: 1. An index can add traversal and fetch work when little is filtered out.

Experiment: Find the crossover point in this model and test values on either side. Compare the prediction with a separately instrumented executor.

## Stale statistics can select a poor plan

Statistics summarize a particular data distribution. After inserts, deletes, or skewed updates, an old estimate may no longer represent the current workload. Track estimate and observation separately so errors are visible.

This lesson reports an estimation error directly instead of pretending one small sample proves a permanent distribution.

```cpp
#include <iostream>

int main() {
    unsigned estimated_matches = 5, observed_matches = 500;
    std::cout << "estimated=" << estimated_matches << " observed=" << observed_matches
              << " ratio=" << observed_matches / estimated_matches << "\n";
}

```

Expected output:

```text
estimated=5 observed=500 ratio=100
```

The actual candidate count is one hundred times the estimate, indicating the model needs attention.

Pitfall: A statistics refresh policy needs a workload trigger; silently assuming uniform data can hide skew.

Question: Should estimates be confused with actual counts?

1. Yes
2. Only when both are integers
3. No

Answer: 3. Statistics are predictions that must be compared with observations.

Experiment: Create a skewed key distribution and compare a uniform estimate with measured equality counts. Define a refresh trigger.

## Projection can change whether row fetches are needed

An index can cover a query when it already contains every requested field. A covering path can avoid fetching base rows, changing its cost compared with an index that stores only keys.

Coverage depends on the query projection and the index’s stored payload. It is not a universal property of all queries using that index.

```cpp
#include <iostream>

int main() {
    unsigned height = 3, matches = 8;
    std::cout << "covered=" << height + matches << " fetch=" << height + 3 * matches
              << "\n";
}

```

Expected output:

```text
covered=11 fetch=27
```

The model adds no base-row fetch cost to the covered path and adds two extra units per match to the fetching path.

Pitfall: Reading an unstored column from an index entry invents data rather than providing coverage.

Question: What determines coverage?

1. Only the number of matching keys
2. The compiler optimization level
3. The requested fields and index payload

Answer: 3. Every projected field must be available from the chosen path.

Experiment: List columns for several projections and decide which are covered by an (id,score) index. Keep name fetches explicit.

## Explain estimates and validate result equivalence

An explain representation should name the chosen access path, predicate, ordering, and estimated work. It helps a reader understand why a planner made a choice and which assumptions to challenge.

Plan selection must not change query meaning. A scan plan and an index plan should agree on result rows under an independent fixture even when their work differs.

```cpp
#include <iostream>
#include <string>

struct Plan {
    std::string path;
    unsigned traversal, matches;
};

int main() {
    Plan plan{"index(id)", 3, 2};
    std::cout << plan.path
              << " predicate=id=7 estimated=" << plan.traversal + plan.matches << "\n";
}

```

Expected output:

```text
index(id) predicate=id=7 estimated=5
```

The output exposes the path and the two sources of estimated work rather than claiming an unexplained speedup.

Pitfall: An explain string is not a substitute for checking the executor’s actual rows and observed work.

Question: What must remain the same across legal plan choices?

1. The number of page fetches
2. The query’s logical result
3. The internal operator names

Answer: 2. Optimization may change work but must preserve semantics.

Experiment: Execute a scan and a lookup on the same fixed table, compare results, and print estimated versus observed candidate counts.

## Chapter project

Explain and compare scan and index plans for changing workloads.
