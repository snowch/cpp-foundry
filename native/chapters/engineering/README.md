# Engineering beyond the browser

Test contracts, draw platform boundaries, and coordinate shared state.

## Test properties as well as examples

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

Expected output:

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

Experiment: Add reversed, all-equal, single-element, and negative-value cases. For the capstone, check that a rejected duplicate leaves the original bytes unchanged.

## Separate language guarantees from host contracts

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

Expected output:

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

Experiment: Build the exported source with another compiler. Exchange a saved file between hosts and document any filesystem adapter differences.

## Protect a shared invariant with a lock

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

Expected output:

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

Experiment: Run the native example, then design a locked two-field update. Use ThreadSanitizer where your host supports it; do not infer race freedom from one successful run.

## Publish initialized data with acquire/release

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

Expected output:

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

Experiment: Draw the happens-before chain from vector initialization to the reader. Extend to immutable snapshots using shared ownership and a documented replacement protocol.

## Chapter project

Run native investigations and document your storage guarantees.
