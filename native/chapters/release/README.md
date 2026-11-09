# Reliability and release work

Test contracts, inject failures, benchmark honestly, and ship reproducibly.

## Broaden a deterministic workload with permutations

An independent reference can validate every small input permutation without depending on random seeds. Small exhaustive workloads are especially useful for structural algorithms whose failures depend on operation order.

Exhaustive testing over a finite domain is not a proof for arbitrary sizes. State the enumerated domain and preserve its failing fixtures.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> input{1, 2, 3};
    unsigned cases = 0;
    bool valid = true;
    do {
        auto result = input;
        std::ranges::sort(result);
        valid = valid && (result == std::vector<int>{1, 2, 3});
        ++cases;
    } while (std::next_permutation(input.begin(), input.end()));
    std::cout << "cases=" << cases << " valid=" << valid << "\n";
    return valid ? 0 : 1;
}

```

Expected output:

```text
cases=6 valid=1
```

All six permutations agree with one independently stated sorted result.

Pitfall: Calling a finite workload “proof for all inputs” overstates its coverage.

Question: What domain is exhaustively tested?

1. Every possible vector size
2. Every compiler optimization
3. All permutations of these three distinct keys

Answer: 3. The coverage is complete only within the stated finite domain.

Experiment: Apply permutation workloads to the custom AVL and B+ examples, checking contents and invariants after every operation.

## Inject failures at named preparation boundaries

Reliable code needs tests for controlled failures, not just successful runs. A named injection point can simulate a failed preparation step deterministically while checks verify cleanup and preservation of committed state.

Keep the failure outside the publication operation when testing the strong guarantee. RAII cleanup and logical rollback are related but distinct properties.

```cpp
#include <iostream>
#include <stdexcept>

struct Guard {
    int &count;
    explicit Guard(int &value) : count(value) {
        ++count;
    }
    ~Guard() {
        --count;
    }
};

int main() {
    int live = 10, owners = 0;
    try {
        Guard guard(owners);
        int candidate = 99;
        if (candidate == 99)
            throw std::runtime_error("injected");
        live = candidate;
    } catch (const std::exception &) {
        std::cout << "rejected ";
    }
    std::cout << "live=" << live << " owners=" << owners << "\n";
}

```

Expected output:

```text
rejected live=10 owners=0
```

The injected error prevents publication while the guard destructor returns the owner count to zero.

Pitfall: A cleanup check alone can pass while partially modified logical state remains corrupted.

Question: Which two properties are checked?

1. Cleanup and logical state preservation
2. Only whether catch ran
3. Only the printed error text

Answer: 1. Resources can be released correctly while state semantics are still wrong.

Experiment: Add failure points before allocation, after candidate construction, and before publication. Check each against a captured independent before-state.

## Enumerate logical commit orders without timing sleeps

Concurrency-related contracts are easier to diagnose with an explicit serialized schedule model before adding threads. Enumerate relevant orderings and compare outcomes with the declared validation rule.

A schedule model does not establish data-race freedom in the real implementation; synchronization tests and analysis remain necessary.

```cpp
#include <array>
#include <iostream>

int main() {
    unsigned accepted = 0;
    for (auto order : std::array<std::array<unsigned, 2>, 2>{{{0, 1}, {1, 0}}}) {
        unsigned revision = 0, commits = 0;
        std::array<unsigned, 2> base{0, 0};
        for (auto client : order)
            if (base[client] == revision) {
                ++revision;
                ++commits;
            }
        if (commits == 1)
            ++accepted;
    }
    std::cout << "orders=" << accepted << "\n";
    return accepted == 2 ? 0 : 1;
}

```

Expected output:

```text
orders=2
```

For either commit order, one old-revision candidate succeeds and the other is rejected.

Pitfall: Sleeping for a guessed duration does not guarantee that a test reaches a particular interleaving.

Question: What determines the order in this fixture?

1. An explicit schedule array
2. The host scheduler
3. A fixed sleep

Answer: 1. The modeled transitions are deterministic and reproducible.

Experiment: Implement the same schedule with barriers or condition variables and compare the real synchronized store against the model.

## Separate work accounting from setup and presentation

A benchmark should name the operation under study and avoid attributing setup or output to it accidentally. Counting predicate evaluations gives an interpretable workload metric before introducing wall-clock noise.

Use multiple input sizes and distributions, retain observations, and avoid claiming a hardware-independent speedup from a single run.

```cpp
#include <array>
#include <iostream>

int main() {
    const std::array<int, 5> values{1, 2, 3, 4, 5};
    unsigned comparisons = 0;
    for (int value : values) {
        ++comparisons;
        if (value == 99)
            break;
    }
    std::cout << "input=" << values.size() << " key_comparisons=" << comparisons
              << "\n";
}

```

Expected output:

```text
input=5 key_comparisons=5
```

The absent key forces five key comparisons. Printing happens only after accounting completes.

Pitfall: Including compiler startup in a small algorithm timing can dominate the result and answer the wrong question.

Question: What is measured here?

1. Compilation latency
2. Key comparisons in the search
3. Filesystem durability

Answer: 2. The counter targets a specifically defined unit of work.

Experiment: Time a larger repeated workload only after validating results. Keep initialization and output outside the measured region.

## Canonicalize release metadata before comparing builds

A release manifest should record toolchain versions, flags, inputs, and artifact identities in a stable representation. Sorting entries removes accidental dependence on file discovery order.

Canonical metadata is one ingredient of reproducibility, not proof that machine-code artifacts are identical. Compare actual artifact digests from independently repeated builds before making that claim.

```cpp
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

std::string manifest(const std::vector<std::pair<std::string, unsigned>> &entries) {
    std::map<std::string, unsigned> ordered(entries.begin(), entries.end());
    std::ostringstream out;
    for (const auto &[name, size] : ordered)
        out << name << "=" << size << "\n";
    return out.str();
}

int main() {
    const std::vector<std::pair<std::string, unsigned>> first{{"b.cpp", 7},
                                                              {"a.cpp", 12}},
        second{{"a.cpp", 12}, {"b.cpp", 7}};
    std::cout << "deterministic=" << (manifest(first) == manifest(second)) << "\n";
}

```

Expected output:

```text
deterministic=1
```

Equivalent entry sets yield the same ordered metadata text despite different discovery orders.

Pitfall: A stable file-size list is not a cryptographic artifact identity and cannot detect every content change.

Question: What additional evidence supports reproducible artifacts?

1. Only identical filenames
2. Only a green screenshot
3. Matching digests from repeated controlled builds

Answer: 3. The actual produced bytes must be compared under recorded build inputs.

Experiment: Extend the manifest with pinned compiler/library versions, flags, and cryptographic artifact digests, then rebuild in a clean environment.

## Chapter project

Publish a reproducible release with a written failure model.
