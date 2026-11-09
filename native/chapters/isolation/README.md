# Isolation and multi-client contracts

Model anomalies and distinguish isolation from durability.

## Expose a lost update with an explicit schedule

Two clients can read the same committed value, compute independent increments, and overwrite each other with full-value writes. This is a logical isolation anomaly even when each individual storage operation is serialized and free of data races.

Model the schedule as ordinary sequential steps first; that makes the failure reproducible without relying on thread timing.

```cpp
#include <iostream>

int main() {
    int committed = 10;
    int first_read = committed, second_read = committed;
    committed = first_read + 5;
    committed = second_read + 7;
    std::cout << "actual=" << committed << " intended=" << 10 + 5 + 7 << "\n";
}

```

Expected output:

```text
actual=17 intended=22
```

The second full-value write discards the first client’s increment because it was computed from the old value.

Pitfall: A mutex around each separate read and write does not automatically make the whole read-modify-write transaction isolated.

Question: What was lost?

1. The first client’s increment of five
2. The second client’s increment of seven
3. The initial value ten

Answer: 1. The stale second write replaces the newer first result.

Experiment: Add a revision check to the write boundary and replay this exact schedule. Require the second stale write to fail explicitly.

## Keep uncommitted values out of committed reads

A dirty read observes a value another transaction has not committed and might later discard. Separate tentative ownership from committed state so a committed-reader interface cannot accidentally reach pending writes.

This schedule demonstrates rollback without threads. The contract concerns visibility, while synchronization is a separate implementation requirement.

```cpp
#include <iostream>
#include <optional>

int main() {
    int committed = 10;
    std::optional<int> pending = 99;
    int reader = committed;
    pending.reset();
    std::cout << "reader=" << reader << " committed=" << committed
              << " pending=" << bool(pending) << "\n";
}

```

Expected output:

```text
reader=10 committed=10 pending=0
```

The reader takes the committed value, and discarding the pending value has no effect on its observation.

Pitfall: Sharing a mutable row between private and committed maps can leak tentative changes despite separate container names.

Question: Which value may this committed reader observe?

1. Ten
2. The pending ninety-nine
3. An arbitrary mix of both

Answer: 1. The visibility interface excludes uncommitted candidate state.

Experiment: Model two pending writers and one committed reader. Test that aborted values never enter the reader’s result sequence.

## Distinguish read-committed from snapshot reads

A read-committed client can observe a newer committed value on its second read. A snapshot reader instead holds a fixed logical view for its documented lifetime. These are different contracts, not merely different caching policies.

The fixture records a snapshot value before another commit and compares it with a later committed-state read.

```cpp
#include <iostream>

int main() {
    int committed = 10, snapshot = committed;
    int first = committed;
    committed = 20;
    int second = committed;
    std::cout << "read_committed=" << first << "," << second << " snapshot=" << snapshot
              << "," << snapshot << "\n";
}

```

Expected output:

```text
read_committed=10,20 snapshot=10,10
```

The current committed view changes, while the separately retained snapshot remains stable.

Pitfall: Retaining a raw pointer to a mutable row does not implement a stable snapshot.

Question: Does read-committed require both reads to match?

1. No
2. Yes
3. Only when using a map

Answer: 1. A later read may observe a later committed state.

Experiment: Write explicit schedules for repeatable row reads and range predicates. State which guarantees your API actually supplies.

## Disjoint writes can violate a shared predicate

Snapshot isolation can prevent write-write conflicts and still allow write skew. Two clients can read a shared invariant from one snapshot and update different rows, each assuming the other row remains unchanged.

This bounded doctor-on-call model requires at least one true row. Disjoint updates based on the same old predicate can leave both false.

```cpp
#include <iostream>

int main() {
    bool alice = true, bob = true;
    bool first_saw_bob = bob, second_saw_alice = alice;
    if (first_saw_bob)
        alice = false;
    if (second_saw_alice)
        bob = false;
    std::cout << "on_call=" << (alice || bob) << "\n";
}

```

Expected output:

```text
on_call=0
```

Neither client writes the other’s row, yet their combined committed outcome violates the cross-row rule.

Pitfall: Checking only overlapping write keys does not detect every dependency through a read predicate.

Question: Why can disjoint writes still conflict logically?

1. Different rows are always independent
2. Both decisions depend on the shared predicate
3. Booleans cannot be synchronized

Answer: 2. The invariant spans the state both transactions read.

Experiment: Add predicate or read-set validation and replay both commit orders. Require one client to retry instead of violating the on-call rule.

## Validate the data a decision depended on

A serializable optimistic protocol must account for relevant read dependencies, not only written keys. A coarse store-wide revision can reject any candidate based on an older read view, preventing the demonstrated write-skew schedule at the cost of extra conflicts.

A production fine-grained implementation needs explicit row and predicate validation under a synchronized commit boundary.

```cpp
#include <iostream>

int main() {
    unsigned revision = 0, first_base = revision, second_base = revision;
    bool alice = true, bob = true;
    if (first_base == revision) {
        alice = false;
        ++revision;
    }
    bool second_ok = second_base == revision;
    if (second_ok) {
        bob = false;
        ++revision;
    }
    std::cout << "second=" << second_ok << " invariant=" << (alice || bob) << "\n";
}

```

Expected output:

```text
second=0 invariant=1
```

The first commit advances the revision, so the second old decision is rejected and the invariant survives.

Pitfall: A revision that wraps or is checked outside the publication lock can undermine this validation model.

Question: Why is the second decision rejected?

1. Its read revision is no longer current
2. It writes the same row
3. Its Boolean value is false

Answer: 1. The coarse revision represents the whole read-view dependency.

Experiment: Replace the coarse revision with per-row read versions and a predicate guard. Identify which additional phantom cases need range validation.

## Chapter project

Write schedules that expose and prevent lost updates.
