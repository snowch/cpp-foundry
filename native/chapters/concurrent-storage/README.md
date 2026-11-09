# Concurrent storage ownership

Protect compound invariants and reject stale updates.

## Return a value copy from a locked read

A lock protects shared map access only while held. Returning a reference to a mutable row and releasing the lock can expose later unsynchronized access. An owning value copy lets the caller inspect a stable result after the lock is released.

This store copies a revision and one scalar value under the same mutex so the pair describes one observation.

```cpp
#include <iostream>
#include <map>
#include <mutex>
#include <utility>

class Store {
    mutable std::mutex mutex_;
    unsigned revision_ = 0;
    std::map<unsigned, int> rows_{{1, 10}};

  public:
    std::pair<unsigned, int> read(unsigned id) const {
        std::lock_guard lock(mutex_);
        return {revision_, rows_.at(id)};
    }
    bool update(unsigned id, int value, unsigned expected) {
        std::lock_guard lock(mutex_);
        if (revision_ != expected)
            return false;
        rows_.at(id) = value;
        ++revision_;
        return true;
    }
};

int main() {
    Store store;
    auto [revision, value] = store.read(1);
    std::cout << "revision=" << revision << " value=" << value << "\n";
}

```

Expected output:

```text
revision=0 value=10
```

The returned pair owns its scalar values and does not borrow the protected map element.

Pitfall: Returning const Row& does not keep a mutex held or prevent another owner from mutating the row.

Question: Why return a value from this read?

1. It keeps the map locked forever
2. It remains independent after unlocking
3. It prevents every future write

Answer: 2. The copied observation has no borrowed mutable storage.

Experiment: Extend the row to own a string and return a complete Row copy. Compare the lifetime contract with a scoped locked-view API.

## Validate and update under the same mutex

Optimistic updates carry the revision associated with a prior observation. Validation and publication must occur under one synchronization boundary so another writer cannot slip between the check and the write.

This whole-store revision protocol is coarse: even unrelated row updates can invalidate an observation. That limitation should be documented rather than hidden.

```cpp
#include <iostream>
#include <map>
#include <mutex>
#include <utility>

class Store {
    mutable std::mutex mutex_;
    unsigned revision_ = 0;
    std::map<unsigned, int> rows_{{1, 10}};

  public:
    std::pair<unsigned, int> read(unsigned id) const {
        std::lock_guard lock(mutex_);
        return {revision_, rows_.at(id)};
    }
    bool update(unsigned id, int value, unsigned expected) {
        std::lock_guard lock(mutex_);
        if (revision_ != expected)
            return false;
        rows_.at(id) = value;
        ++revision_;
        return true;
    }
};

int main() {
    Store store;
    auto first = store.read(1), stale = first;
    bool accepted = store.update(1, 20, first.first);
    bool rejected = !store.update(1, 30, stale.first);
    std::cout << accepted << " " << rejected << " value=" << store.read(1).second
              << "\n";
}

```

Expected output:

```text
1 1 value=20
```

The first update advances the revision; the stale second update is rejected while preserving twenty.

Pitfall: An unlocked revision check followed by a locked write can still overwrite newer state.

Question: Which operations share the lock?

1. Only the mutation after an unlocked check
2. Revision comparison and mutation
3. Only the prior read

Answer: 2. The comparison must stay valid until the update publishes.

Experiment: Coordinate two worker threads so both capture one revision before either updates. Check one success and one stale rejection.

## Shared reading needs a consistent writer protocol

shared_mutex permits several shared holders while excluding an exclusive writer. Every access to the protected state must still use the same protocol; a shared lock is not permission to mutate ordinary members.

The fixture checks reader observations and performs the write after joining readers to keep the expected result deterministic.

```cpp
#include <iostream>
#include <mutex>
#include <shared_mutex>
#include <thread>

int main() {
    std::shared_mutex mutex;
    int value = 7, first = 0, second = 0;
    std::jthread one([&] {
        std::shared_lock lock(mutex);
        first = value;
    });
    std::jthread two([&] {
        std::shared_lock lock(mutex);
        second = value;
    });
    one.join();
    two.join();
    {
        std::unique_lock lock(mutex);
        value = 9;
    }
    std::cout << first << " " << second << " final=" << value << "\n";
}

```

Expected output:

```text
7 7 final=9
```

Both readers observe the initial value under shared locks; the later exclusive operation changes it to nine.

Pitfall: A shared lock does not automatically make mutation through another alias legal.

Question: Which mode should protect a write?

1. Shared ownership
2. No lock if readers are fast
3. Exclusive ownership of the mutex

Answer: 3. Writers must exclude conflicting readers and writers.

Experiment: Add a coordinated overlapping writer and define allowed reader outcomes. Avoid assuming fairness or a particular scheduling order.

## Protect multi-field consistency as one observation

A storage invariant can span a row count, an index entry, and a page state. Protecting each field independently does not automatically make a reader’s combined observation consistent.

This bounded fixture uses one lock around a two-field transfer and one lock around the total observation. The point is the invariant boundary, not a claim that one global lock scales indefinitely.

```cpp
#include <iostream>
#include <mutex>
#include <thread>

int main() {
    int free = 8, used = 2;
    std::mutex mutex;
    auto allocate = [&] {
        std::lock_guard lock(mutex);
        if (free) {
            --free;
            ++used;
        }
    };
    std::jthread one(allocate), two(allocate);
    one.join();
    two.join();
    std::lock_guard lock(mutex);
    std::cout << "free=" << free << " used=" << used << " total=" << free + used
              << "\n";
}

```

Expected output:

```text
free=6 used=4 total=10
```

Both allocation transitions preserve the total capacity of ten, and the final observation covers the pair together.

Pitfall: Two atomic counters can individually be race-free while an unlocked reader observes an impossible combined state.

Question: What defines the required synchronization boundary?

1. The compound invariant
2. The number of source lines
3. The size of each integer

Answer: 1. Related fields must be updated and observed coherently.

Experiment: Replace the counters with a row map and index map. Define and test which lock scope preserves cross-structure consistency.

## Reclaim old data only after readers release ownership

Publishing a replacement does not imply that old readers have finished. Snapshot ownership can retain an old immutable value until the last reader releases it. A weak observer can expose when reclamation becomes possible without owning the old version itself.

This is a lifetime model; production page reclamation also needs generation IDs, synchronized reader registration, and resource accounting.

```cpp
#include <iostream>
#include <memory>

int main() {
    auto current = std::make_shared<const int>(10);
    auto reader = current;
    std::weak_ptr<const int> old = current;
    current = std::make_shared<const int>(20);
    std::cout << "retained=" << !old.expired() << " ";
    reader.reset();
    std::cout << "released=" << old.expired() << "\n";
}

```

Expected output:

```text
retained=1 released=1
```

Replacing current removes one owner, but reader still retains the old value until reset.

Pitfall: Reusing old page storage immediately after publication can invalidate a reader that still references the old generation.

Question: When can the old value be reclaimed?

1. Immediately after current changes
2. After its last owning reader releases it
3. When the next write starts

Answer: 2. Publication and reclamation are distinct events.

Experiment: Model two readers with different completion times. Confirm the old generation remains retained until both release it.

## Chapter project

Implement a synchronized record store with a documented reader contract.
