# Atomics and the memory model

Reason about atomic operations and happens-before relations.

## An atomic read-modify-write prevents lost counter increments

An atomic fetch_add combines observation and update into one indivisible operation on that atomic object. Two separate load/store calls are not equivalent to a read-modify-write and can lose concurrent increments.

This counter needs atomicity but does not publish other data, so relaxed ordering is sufficient for the increments themselves. Joins establish completion before the final observation.

```cpp
#include <atomic>
#include <iostream>
#include <thread>

int main() {
    std::atomic<unsigned> count{0};
    auto work = [&] {
        for (unsigned i = 0; i < 10000; ++i)
            count.fetch_add(1, std::memory_order_relaxed);
    };
    std::jthread first(work), second(work);
    first.join();
    second.join();
    std::cout << "count=" << count.load() << "\n";
}

```

Expected output:

```text
count=20000
```

Every fetch_add contributes one increment, producing exactly twenty thousand after both workers join.

Pitfall: An atomic load followed by an atomic store is still two operations and can overwrite another thread’s increment.

Question: What operation combines the update atomically?

1. load followed by store
2. fetch_add
3. A non-atomic ++ protected only by hope

Answer: 2. The read-modify-write is indivisible for this atomic object.

Experiment: Implement a deliberately separate load/store model under a controlled schedule to demonstrate a lost update without introducing a data race.

## A failed compare-exchange updates the expected value

compare_exchange compares an atomic object with an expected value and conditionally publishes a desired value. On failure, it writes the observed value back into expected. This supports retry loops without an extra uncoordinated assumption.

Weak compare-exchange can also fail spuriously and is normally used in a loop. This fixture uses the strong operation for one deterministic mismatch.

```cpp
#include <atomic>
#include <iostream>

int main() {
    std::atomic<int> value{7};
    int expected = 5;
    bool changed = value.compare_exchange_strong(expected, 9);
    std::cout << "changed=" << changed << " expected=" << expected
              << " value=" << value.load() << "\n";
}

```

Expected output:

```text
changed=0 expected=7 value=7
```

The initial expected value does not match, so the atomic remains seven and expected becomes seven.

Pitfall: A retry loop that never accounts for the updated expected state can apply the wrong decision rule.

Question: What does expected contain after this failure?

1. The observed value seven
2. The desired value nine
3. Its original value five

Answer: 1. Failure reports the currently observed atomic value through expected.

Experiment: Retry with a decision based on the observed value. Specify whether the desired update should be recomputed after each failure.

## Publish a prepared batch before readers inspect it

A release store can publish preceding initialization to a reader that observes it through an acquire load. The ordering relation applies to the protected prior writes; it does not permit future unsynchronized mutation of that same data.

Keep the published object alive through reader completion and make the single-publication limitation explicit.

```cpp
#include <array>
#include <atomic>
#include <iostream>
#include <thread>

int main() {
    std::array<int, 2> values{};
    std::atomic<bool> ready{false};
    int result = 0;
    std::jthread reader([&] {
        while (!ready.load(std::memory_order_acquire))
            std::this_thread::yield();
        result = values[0] + values[1];
    });
    values = {20, 22};
    ready.store(true, std::memory_order_release);
    reader.join();
    std::cout << "batch=" << result << "\n";
}

```

Expected output:

```text
batch=42
```

The reader observes the release and then reads the initialized pair. The writer performs no later mutation.

Pitfall: Changing the flag operations to relaxed removes this publication guarantee for the non-atomic array.

Question: What is made visible by observing the release?

1. The preceding array initialization
2. Every future mutation automatically
3. The compiler’s temporary files

Answer: 1. Acquire/release establishes visibility of the writes ordered before publication.

Experiment: Draw the happens-before chain explicitly. Explain why publishing a pointer without retaining its owner would still be unsafe.

## Sequential consistency constrains the global atomic order

Sequentially consistent atomic operations participate in a single total order compatible with each thread’s sequencing requirements. In the classic two-store/two-load fixture, both reads cannot observe zero under that model.

The exact observed pair is schedule-dependent, so the program checks an allowed-outcome property rather than asserting one arbitrary interleaving.

```cpp
#include <atomic>
#include <iostream>
#include <thread>

int main() {
    std::atomic<int> a{0}, b{0};
    int first = 0, second = 0;
    std::jthread one([&] {
        a.store(1);
        first = b.load();
    });
    std::jthread two([&] {
        b.store(1);
        second = a.load();
    });
    one.join();
    two.join();
    bool allowed = !(first == 0 && second == 0);
    std::cout << "allowed=" << allowed << "\n";
    return allowed ? 0 : 1;
}

```

Expected output:

```text
allowed=1
```

The check permits all outcomes consistent with the stated model and rejects the forbidden both-zero result.

Pitfall: Printing one observed schedule repeatedly does not prove that other permitted schedules cannot occur.

Question: Why does the output avoid one exact read pair?

1. Atomic loads return random values
2. The test ignores all results
3. Several schedules are permitted

Answer: 3. The contract constrains outcomes without fixing the scheduler.

Experiment: Model the ordering constraints on paper. Compare with relaxed operations conceptually without claiming a finite run proves a memory-model theorem.

## Publish an owning immutable snapshot handle

C++20 supports atomic shared_ptr operations that combine publication with owning handle transfer. A reader holding an old shared owner can continue reading that immutable version after a newer one is published.

The pointed-to data must remain immutable through that read contract. Atomic handle access does not make arbitrary mutation of the pointee safe, and lock-free implementation is not guaranteed.

```cpp
#include <atomic>
#include <iostream>
#include <memory>
#include <vector>

int main() {
    using Snapshot = std::shared_ptr<const std::vector<int>>;
    std::atomic<Snapshot> current{
        std::make_shared<const std::vector<int>>(std::initializer_list<int>{1, 2})};
    auto old = current.load();
    current.store(
        std::make_shared<const std::vector<int>>(std::initializer_list<int>{3, 4}));
    std::cout << old->at(0) << " " << current.load()->at(0) << "\n";
}

```

Expected output:

```text
1 3
```

The retained old owner still sees its original vector while a new load obtains the replacement snapshot.

Pitfall: Atomic shared_ptr does not promise lock-free behavior on every implementation.

Question: Why is the old snapshot still alive?

1. The atomic permanently keeps every version
2. Its vector capacity is small
3. The reader retains a shared owner

Answer: 3. Ownership, not just publication ordering, protects its lifetime.

Experiment: Hold several readers across replacement and observe reclamation through weak_ptr expiration after their owners are released.

## Chapter project

Explain each edge in a single-publication protocol.
