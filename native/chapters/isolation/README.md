# Isolation and multi-client contracts

Model anomalies and distinguish isolation from durability.

## Expose a lost update with an explicit schedule

Before this chapter: [Validate and update under the same mutex](../concurrent-storage/README.md)

A schedule is an ordering of operations from different clients. Isolation describes what interference those clients may observe. A lost update overwrites another client’s change; write skew can break a rule spanning separate records even without overwriting the same record.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/lost-update-schedule.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lost-update-schedule.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
committed = second_read + 7;
```

With

```cpp
second_read = committed; committed = second_read + 7;
```

Rerun the terminal command. Compare actual= and intended=. What changes when the second update starts from the value after the first update?

## Keep uncommitted values out of committed reads

Before this chapter: [Validate and update under the same mutex](../concurrent-storage/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/dirty-read-boundary.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/dirty-read-boundary.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
int reader = committed;
```

With

```cpp
int reader = *pending;
```

Rerun the terminal command. Compare reader=, committed= and pending=. Which value can the reader still report after aborting the simulated write?

## Distinguish read-committed from snapshot reads

Before this chapter: [Validate and update under the same mutex](../concurrent-storage/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/repeatable-observation.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/repeatable-observation.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
committed = 20;
```

With

```cpp
committed = 35;
```

Rerun the terminal command. Compare read_committed= and snapshot=. Which pair sees the replacement?

## Disjoint writes can violate a shared predicate

Before this chapter: [Validate and update under the same mutex](../concurrent-storage/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/write-skew.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/write-skew.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
second_saw_alice = alice
```

With

```cpp
second_saw_alice = false
```

Rerun the terminal command. Compare on_call=. This models Bob already knowing Alice will be off duty. Which decision preserves someone on call?

## Validate the data a decision depended on

Before this chapter: [Validate and update under the same mutex](../concurrent-storage/README.md)

New terms and notation:

In database isolation, serializable means the accepted transactions behave like some non-overlapping ordering of those transactions. In file formats, serialization instead means converting values to bytes. The surrounding lesson determines which meaning is intended.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/serial-validation.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/serial-validation.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
++revision;
    }
    bool second_ok
```

With

```cpp
}
    bool second_ok
```

Rerun the terminal command. Compare second= and invariant=. What happens if the first write forgets to advance the validated revision?

## Chapter project

Write schedules that expose and prevent lost updates.
