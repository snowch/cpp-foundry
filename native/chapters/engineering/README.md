# Engineering beyond the browser

Test contracts, draw platform boundaries, and coordinate shared state.

## Test properties as well as examples

Before this chapter: [Keep implementation, tests, and guarantees separate](../storage-audit/README.md)

A contract states requirements and promised behavior. Portability asks which parts still work in a different environment. Concurrency allows overlapping activities, so we must distinguish ownership of an object’s lifetime from coordination of access to its contents.

A worked example establishes one concrete behavior. A test suite should also target empty input, boundaries, rejection preservation, and relationships that hold across a family of cases. Use an independent expected result where possible.

Here a sorting check compares against a known sequence and also verifies idempotence: sorting an already sorted range does not change it. Idempotence alone would not catch a sort that always returned its input unchanged.

```cpp
#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <vector>
void require(bool condition) {
    if (!condition) throw std::runtime_error("contract failed");
}
int main() {
    std::vector<int> values{3,1,2,1};
    std::ranges::sort(values);
    require(values == std::vector<int>({1,1,2,3}));
    auto first=values;
    std::ranges::sort(values);
    require(values == first);
    std::vector<int> empty;
    std::ranges::sort(empty);
    require(empty.empty());
    std::cout << "3 contracts passed\n";
}
```

Original program output:

```text
3 contracts passed
```

The exact expected result checks ordering and duplicate preservation. The second check verifies repeat behavior. The empty case checks a boundary without relying on an unchecked optional or invalid index.

Pitfall: Tests that merely repeat the implementation’s logic can reproduce its mistakes. Design an oracle or property independently.

Question: Would idempotence alone prove sorting is correct?

1. No, doing nothing is also idempotent
2. Yes
3. Only for integers

Answer: 1. Combine properties with independent expected outcomes and meaningful boundary cases.

### Run the starter, then try a change

Open `native/examples/contracts.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/contracts.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
values{3,1,2,1}
```

With

```cpp
values{1,1,2,3}
```

Rerun the terminal command. Compare the number of reported contracts. Is the independently expected result the same when the original values arrive already sorted?

## Separate language guarantees from host contracts

Before this chapter: [Keep implementation, tests, and guarantees separate](../storage-audit/README.md)

C++20 standardizes many facilities, but does not make every platform interchangeable. Numeric widths, path encodings, filesystem replacement behavior, and external byte formats each need a documented contract.

Use static assertions for compile-time assumptions and runtime checks for data. The capstone explicitly requires octets and uint32_t. It avoids serializing std::string or map internals, so those library representations do not leak into its file format.

```cpp
#include <climits>
#include <cstdint>
#include <iostream>
#include <limits>
static_assert(CHAR_BIT == 8,"CPF1 requires octets");
static_assert(std::numeric_limits<std::uint32_t>::digits == 32);
int main() {
    std::cout << "byte bits=" << CHAR_BIT << '\n';
    std::cout << "uint32 bits=" << std::numeric_limits<std::uint32_t>::digits << '\n';
    std::cout << "portable format uses explicit bytes\n";
}
```

Original program output:

```text
byte bits=8
uint32 bits=32
portable format uses explicit bytes
```

A host that cannot satisfy the format’s scalar assumptions fails at compilation instead of silently creating incompatible files. This does not establish that rename replacement behaves identically on all hosts.

Pitfall: A successful build on one operating system does not prove cross-host file compatibility or identical filesystem semantics.

Question: What does static_assert verify?

1. A compile-time condition on this implementation
2. Every possible input file
3. Power-loss behavior

Answer: 1. It checks implementation assumptions; file validation and host-specific behavior need separate checks.

### Run the starter, then try a change

Open `native/examples/portability.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/portability.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
"uint32 bits=" << std::numeric_limits<std::uint32_t>::digits
```

With

```cpp
"uint16 bits=" << std::numeric_limits<std::uint16_t>::digits
```

Rerun the terminal command. Compare the bit widths and format statement. Why does using a narrower scalar change the width but leave the rule about explicit persisted bytes intact?

## Protect a shared invariant with a lock

Before this chapter: [Keep implementation, tests, and guarantees separate](../storage-audit/README.md)

New terms and notation:

A data race occurs when threads perform conflicting accesses to the same memory without the required coordination, with at least one access being a write and without the appropriate atomic protection. In C++, a data race makes the program’s behavior undefined.

A relational join combines matching rows from two inputs according to a key or condition. This is different from joining a thread, which waits for that thread to finish. Duplicate key matches can produce multiple result rows.

Two threads that access the same non-atomic object concurrently, with at least one write and without synchronization, can cause a data race. A data race is undefined behavior, not simply an occasional wrong answer.

A mutex protects a chosen invariant only if every access follows the same locking protocol. lock_guard uses RAII to release the lock. This native lesson uses jthread, which joins on destruction; we also join explicitly before observing the final result.

```cpp
#include <iostream>
#include <mutex>
#include <thread>
int main() {
    int count=0;
    std::mutex mutex;
    auto increment=[&] {
        for (int i=0;i<10000;++i) {
            std::lock_guard lock(mutex);
            ++count;
        }
    };
    std::jthread first(increment),second(increment);
    first.join(); second.join();
    std::cout << "count=" << count << '\n';
}
```

Original program output:

```text
count=20000
```

Each increment runs while owning the same mutex. Joining both threads establishes that their work has finished before main reads count.

Pitfall: Locking writes while leaving concurrent reads unlocked does not protect a non-atomic shared value. One atomic counter also does not protect an entire multi-field database invariant.

Question: Must a concurrent reader follow the locking protocol?

1. Yes, for this non-atomic shared state
2. No, reads cannot race
3. Only if count is negative

Answer: 1. A conflicting read and write can form a data race even when only the writer locks.

### Run the starter, then try a change

Open `native/examples/threads.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/threads.cpp -pthread -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
i<10000
```

With

```cpp
i<5000
```

Rerun the terminal command. Compare count=. Why does the final count reflect both workers’ loop bounds when read after their joins?

## Publish initialized data with acquire/release

Before this chapter: [Keep implementation, tests, and guarantees separate](../storage-audit/README.md)

New terms and notation:

A release operation can publish effects that occurred before it. An acquire operation that observes the corresponding publication establishes the required visibility for those effects. A flag with unrelated or relaxed accesses does not automatically provide that synchronization.

An atomic flag can publish a fully initialized object when the writer uses a release operation and the reader observes it with an acquire operation. The synchronization makes preceding writes visible; it does not grant permission to keep modifying the published object concurrently.

This single-writer, single-publication example keeps the vector alive until the reader joins. A general snapshot system also needs ownership and reclamation rules. Atomics do not automatically supply those rules.

```cpp
#include <atomic>
#include <iostream>
#include <thread>
#include <vector>
int main() {
    std::vector<int> values;
    std::atomic<bool> ready{false};
    int observed=0;
    std::jthread reader([&] {
        while (!ready.load(std::memory_order_acquire)) std::this_thread::yield();
        for (int value:values) observed += value;
    });
    values={10,20,30};
    ready.store(true,std::memory_order_release);
    reader.join();
    std::cout << "snapshot sum=" << observed << '\n';
}
```

Original program output:

```text
snapshot sum=60
```

The reader observes the release through its acquire load before accessing values. The writer performs no later vector mutation, and joining the reader precedes main’s read of observed.

Pitfall: Changing the flag to relaxed removes this publication guarantee. Reusing the flag for many updates also requires a new protocol; this example proves only one publication.

Question: Can the writer freely mutate values after publishing?

1. No, that needs additional synchronization
2. Yes, the flag makes all data atomic
3. Only when the vector capacity stays fixed

Answer: 1. Publication establishes visibility of prior writes. It does not synchronize future conflicting accesses.

### Run the starter, then try a change

Open `native/examples/publication.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/publication.cpp -pthread -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
values={10,20,30}
```

With

```cpp
values={10,20,40}
```

Rerun the terminal command. Compare snapshot sum=. Which store and load must be paired before the reader treats the new vector values as published?

## Chapter project

Run native investigations and document your storage guarantees.
