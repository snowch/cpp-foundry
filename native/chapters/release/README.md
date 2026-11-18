# Reliability and release work

Test contracts, inject failures, benchmark honestly, and ship reproducibly.

## Broaden a deterministic workload with permutations

Before this chapter: [Publish a replacement without invalidating old readers](../maintenance/README.md)

A test oracle is an independent way to determine the expected answer. Failure injection deliberately makes an operation fail at a selected point. A reproducible release records inputs and tool versions so another person can repeat its build and checks.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/permutation-oracle.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/permutation-oracle.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
input{1, 2, 3}
```

With

```cpp
input{3, 2, 1}
```

Rerun the terminal command. Compare cases= and valid=. Why does starting at the final permutation visit fewer cases?

## Inject failures at named preparation boundaries

Before this chapter: [Publish a replacement without invalidating old readers](../maintenance/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/failure-injection.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/failure-injection.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
int candidate = 99;
```

With

```cpp
int candidate = 11;
```

Rerun the terminal command. Compare rejected, live= and owners=. Which value becomes visible when the candidate avoids the injected failure?

## Enumerate logical commit orders without timing sleeps

Before this chapter: [Publish a replacement without invalidating old readers](../maintenance/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/schedule-model.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/schedule-model.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
if (commits == 1)
```

With

```cpp
if (commits == 2)
```

Rerun the terminal command. Compare orders= and status. The edit asks which schedules accept both writes. How does revision validation prevent the second write?

## Separate work accounting from setup and presentation

Before this chapter: [Publish a replacement without invalidating old readers](../maintenance/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/benchmark-separation.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/benchmark-separation.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
if (value == 99)
```

With

```cpp
if (value == 1)
```

Rerun the terminal command. Compare input= and key_comparisons=. Which workload ends after the first element, and why is neither count a time measurement?

## Canonicalize release metadata before comparing builds

Before this chapter: [Publish a replacement without invalidating old readers](../maintenance/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/reproducible-manifest.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/reproducible-manifest.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
{"a.cpp", 12}, {"b.cpp", 7}
```

With

```cpp
{"a.cpp", 12}, {"b.cpp", 8}
```

Rerun the terminal command. Compare deterministic=. Which changed size means the second manifest no longer describes the same inputs?

## Chapter project

Publish a reproducible release with a written failure model.
