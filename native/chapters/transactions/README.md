# Transaction state and commit

Keep tentative writes separate from committed state.

## Begin with a private candidate state

A transaction separates tentative writes from committed state. This teaching store copies a bounded map at begin so transaction-local changes cannot leak through shared mutable rows.

It is a serialized in-memory state model, not a concurrent implementation or a durable transaction engine. Later lessons add conflict and publication contracts.

```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <utility>

struct Transaction {
    unsigned base;
    std::map<int, int> rows;
    bool active = true;
};
struct Store {
    unsigned revision = 0;
    std::map<int, int> rows{{1, 10}, {2, 20}};
    Transaction begin() const {
        return {revision, rows, true};
    }
    bool commit(Transaction &transaction) {
        if (!transaction.active || transaction.base != revision)
            return false;
        auto candidate = transaction.rows;
        rows.swap(candidate);
        ++revision;
        transaction.active = false;
        return true;
    }
};
void rollback(Transaction &transaction) {
    transaction.rows.clear();
    transaction.active = false;
}

int main() {
    Store store;
    auto transaction = store.begin();
    transaction.rows.at(1) = 99;
    std::cout << "private=" << transaction.rows.at(1)
              << " committed=" << store.rows.at(1) << "\n";
}

```

Expected output:

```text
private=99 committed=10
```

The private map contains the new value while the committed map still contains the old value.

Pitfall: Copying only pointers to mutable rows would not isolate tentative writes.

Question: Why are committed rows unchanged?

1. The transaction owns a separate candidate map
2. The output stream rolls back writes
3. All map copies share immutable storage

Answer: 1. Owning value semantics separate the two mutable states.

Experiment: Mutate several private rows and verify a second reader of committed state sees none of them before commit.

## A transaction needs a coherent read view

A transaction usually reads its own writes even when other observers still see committed state. Its read interface must specify whether it consults a private candidate, an overlay, or a versioned snapshot.

This copy-based model reads directly from the candidate map. The representation is simple but incurs whole-table copying at begin.

```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <utility>

struct Transaction {
    unsigned base;
    std::map<int, int> rows;
    bool active = true;
};
struct Store {
    unsigned revision = 0;
    std::map<int, int> rows{{1, 10}, {2, 20}};
    Transaction begin() const {
        return {revision, rows, true};
    }
    bool commit(Transaction &transaction) {
        if (!transaction.active || transaction.base != revision)
            return false;
        auto candidate = transaction.rows;
        rows.swap(candidate);
        ++revision;
        transaction.active = false;
        return true;
    }
};
void rollback(Transaction &transaction) {
    transaction.rows.clear();
    transaction.active = false;
}

int main() {
    Store store;
    auto transaction = store.begin();
    transaction.rows[3] = 30;
    std::cout << "own=" << transaction.rows.contains(3)
              << " external=" << store.rows.contains(3) << "\n";
}

```

Expected output:

```text
own=1 external=0
```

The newly inserted key is visible inside the transaction and absent from the committed view.

Pitfall: Reading from committed state after writing a private overlay can hide a transaction’s own changes.

Question: Which state supplies this transaction’s reads?

1. Its candidate map
2. Only the original committed map
3. Whichever map has fewer rows

Answer: 1. The read view and tentative writes share one private state.

Experiment: Model deletion and a repeated read of the same key. Document whether absence comes from the base state or a transaction-local deletion.

## Publish a complete candidate at commit

Commit validates the transaction’s base revision, prepares the candidate copy, and publishes it with a nonthrowing map swap. All rows become visible through one serialized state transition.

This atomicity is a model of observable commit boundaries. It does not make unsynchronized threads safe to access the map concurrently.

```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <utility>

struct Transaction {
    unsigned base;
    std::map<int, int> rows;
    bool active = true;
};
struct Store {
    unsigned revision = 0;
    std::map<int, int> rows{{1, 10}, {2, 20}};
    Transaction begin() const {
        return {revision, rows, true};
    }
    bool commit(Transaction &transaction) {
        if (!transaction.active || transaction.base != revision)
            return false;
        auto candidate = transaction.rows;
        rows.swap(candidate);
        ++revision;
        transaction.active = false;
        return true;
    }
};
void rollback(Transaction &transaction) {
    transaction.rows.clear();
    transaction.active = false;
}

int main() {
    Store store;
    auto transaction = store.begin();
    transaction.rows.at(1) = 99;
    std::cout << "commit=" << store.commit(transaction) << " value=" << store.rows.at(1)
              << " revision=" << store.revision << "\n";
}

```

Expected output:

```text
commit=1 value=99 revision=1
```

A successful commit advances the revision and makes the transaction inactive.

Pitfall: Updating committed rows one by one can expose a partially committed batch to observers.

Question: What publishes the prepared state?

1. The final map swap
2. Each private assignment
3. Printing a success message

Answer: 1. Preparation and publication are separate operations.

Experiment: Update two related rows and verify the committed view changes only at the commit boundary under a serialized test schedule.

## Rollback discards tentative ownership

Rollback ends a transaction without publishing its candidate. In this model, clearing the private map and marking it inactive releases tentative state while leaving the committed map alone.

An already rolled-back transaction must not be committed later. Transaction lifecycle state is part of the API, not a comment remembered only by callers.

```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <utility>

struct Transaction {
    unsigned base;
    std::map<int, int> rows;
    bool active = true;
};
struct Store {
    unsigned revision = 0;
    std::map<int, int> rows{{1, 10}, {2, 20}};
    Transaction begin() const {
        return {revision, rows, true};
    }
    bool commit(Transaction &transaction) {
        if (!transaction.active || transaction.base != revision)
            return false;
        auto candidate = transaction.rows;
        rows.swap(candidate);
        ++revision;
        transaction.active = false;
        return true;
    }
};
void rollback(Transaction &transaction) {
    transaction.rows.clear();
    transaction.active = false;
}

int main() {
    Store store;
    auto transaction = store.begin();
    transaction.rows.at(1) = 99;
    rollback(transaction);
    std::cout << "value=" << store.rows.at(1) << " inactive=" << !transaction.active
              << " commit=" << store.commit(transaction) << "\n";
}

```

Expected output:

```text
value=10 inactive=1 commit=0
```

The original committed value remains ten, and the inactive candidate is rejected by commit.

Pitfall: A rollback that changes only a printed status but leaves the transaction active permits accidental later publication.

Question: Can this rolled-back transaction commit?

1. Yes, if its map is empty
2. No
3. Only once

Answer: 2. The active-state check rejects ended transactions.

Experiment: Specify behavior for repeated rollback and repeated commit. Test that every ended transaction remains unable to publish.

## Reject a commit based on an old revision

Two candidates can begin from the same committed revision. Publishing one invalidates the other candidate’s base revision. A compare-before-publish check prevents the later stale candidate from silently overwriting the newer state.

This coarse whole-store validation rejects more cases than a fine-grained conflict detector, but its failure contract is easy to observe.

```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <utility>

struct Transaction {
    unsigned base;
    std::map<int, int> rows;
    bool active = true;
};
struct Store {
    unsigned revision = 0;
    std::map<int, int> rows{{1, 10}, {2, 20}};
    Transaction begin() const {
        return {revision, rows, true};
    }
    bool commit(Transaction &transaction) {
        if (!transaction.active || transaction.base != revision)
            return false;
        auto candidate = transaction.rows;
        rows.swap(candidate);
        ++revision;
        transaction.active = false;
        return true;
    }
};
void rollback(Transaction &transaction) {
    transaction.rows.clear();
    transaction.active = false;
}

int main() {
    Store store;
    auto first = store.begin(), stale = store.begin();
    first.rows.at(1) = 50;
    store.commit(first);
    stale.rows.at(2) = 80;
    std::cout << "stale=" << !store.commit(stale) << " retained=" << store.rows.at(1)
              << "," << store.rows.at(2) << "\n";
}

```

Expected output:

```text
stale=1 retained=50,20
```

The stale candidate is rejected in full. The newer value fifty survives and the stale update to key two is not published.

Pitfall: Checking a revision before an unlocked write does not prevent races in a real concurrent implementation; validation and publication need synchronization together.

Question: What must be protected together in a concurrent implementation?

1. Only output formatting
2. Revision validation and state publication
3. Only candidate construction

Answer: 2. The check must remain valid through publication.

Experiment: Implement the same schedule with a mutex-protected store. Keep the stale-candidate rejection deterministic with explicit coordination.

## Commit related fields as one logical unit

A transaction can preserve a compound invariant across several tentative updates. A transfer between two balances should publish both changes or neither, provided validation and arithmetic checks have succeeded.

The example uses small nonnegative values and a serialized commit. A real transfer API also needs insufficient-funds and overflow rejection before candidate mutation.

```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <utility>

struct Transaction {
    unsigned base;
    std::map<int, int> rows;
    bool active = true;
};
struct Store {
    unsigned revision = 0;
    std::map<int, int> rows{{1, 10}, {2, 20}};
    Transaction begin() const {
        return {revision, rows, true};
    }
    bool commit(Transaction &transaction) {
        if (!transaction.active || transaction.base != revision)
            return false;
        auto candidate = transaction.rows;
        rows.swap(candidate);
        ++revision;
        transaction.active = false;
        return true;
    }
};
void rollback(Transaction &transaction) {
    transaction.rows.clear();
    transaction.active = false;
}

int main() {
    Store store;
    auto transaction = store.begin();
    transaction.rows.at(1) -= 3;
    transaction.rows.at(2) += 3;
    store.commit(transaction);
    std::cout << store.rows.at(1) << "+" << store.rows.at(2) << "="
              << store.rows.at(1) + store.rows.at(2) << "\n";
}

```

Expected output:

```text
7+23=30
```

The total is conserved while the individual balances change together at commit.

Pitfall: Atomic counters for individual balances do not automatically make the two-field transfer invariant atomic.

Question: Which invariant should every committed transfer preserve?

1. Each individual balance is unchanged
2. The combined total, absent fees or external changes
3. The transaction map stays empty

Answer: 2. The operation changes two fields while preserving their sum.

Experiment: Reject an oversized transfer before changing either candidate balance. Test committed state after both rejection and success.

## Fallible preparation must precede publication

A commit can fail while validating or allocating a candidate. Arrange those operations before the nonthrowing publication step so failure leaves committed state unchanged.

This fixture injects a validation exception explicitly. It illustrates the commit ordering rather than relying on an unpredictable allocation failure.

```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <utility>

struct Transaction {
    unsigned base;
    std::map<int, int> rows;
    bool active = true;
};
struct Store {
    unsigned revision = 0;
    std::map<int, int> rows{{1, 10}, {2, 20}};
    Transaction begin() const {
        return {revision, rows, true};
    }
    bool commit(Transaction &transaction) {
        if (!transaction.active || transaction.base != revision)
            return false;
        auto candidate = transaction.rows;
        rows.swap(candidate);
        ++revision;
        transaction.active = false;
        return true;
    }
};
void rollback(Transaction &transaction) {
    transaction.rows.clear();
    transaction.active = false;
}

int main() {
    Store store;
    auto transaction = store.begin();
    transaction.rows.at(1) = -1;
    try {
        if (transaction.rows.at(1) < 0)
            throw std::runtime_error("negative balance");
        store.commit(transaction);
    } catch (const std::exception &error) {
        std::cout << error.what() << "\n";
    }
    std::cout << "committed=" << store.rows.at(1) << " revision=" << store.revision
              << "\n";
}

```

Expected output:

```text
negative balance
committed=10 revision=0
```

Validation fails before commit, so neither the committed value nor revision changes.

Pitfall: Catching an exception after publishing a partially prepared state cannot establish the strong guarantee retroactively.

Question: Where must fallible validation occur?

1. After increasing the revision
2. Only in the caller’s log formatter
3. Before publication

Answer: 3. The old committed state remains the fallback until preparation succeeds.

Experiment: Inject failures at several preparation boundaries and compare committed bytes and revision with an independently captured before-state.

## Make begin, commit, and abort states explicit

A transaction lifecycle defines which operations are legal before and after completion. Reusing a completed candidate can otherwise replay old work against a new revision.

This model permits one successful commit per transaction. A failed stale commit remains active so the caller can inspect or discard it, but cannot succeed without a new begin under this API.

```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <utility>

struct Transaction {
    unsigned base;
    std::map<int, int> rows;
    bool active = true;
};
struct Store {
    unsigned revision = 0;
    std::map<int, int> rows{{1, 10}, {2, 20}};
    Transaction begin() const {
        return {revision, rows, true};
    }
    bool commit(Transaction &transaction) {
        if (!transaction.active || transaction.base != revision)
            return false;
        auto candidate = transaction.rows;
        rows.swap(candidate);
        ++revision;
        transaction.active = false;
        return true;
    }
};
void rollback(Transaction &transaction) {
    transaction.rows.clear();
    transaction.active = false;
}

int main() {
    Store store;
    auto transaction = store.begin();
    bool first = store.commit(transaction), second = store.commit(transaction);
    std::cout << "first=" << first << " second=" << second
              << " revision=" << store.revision << "\n";
}

```

Expected output:

```text
first=1 second=0 revision=1
```

The first commit ends the transaction. The second fails without advancing the store revision again.

Pitfall: An inactive flag that is never checked does not enforce a lifecycle contract.

Question: How many successful commits can this candidate perform?

1. Unlimited
2. One
3. Two if no rows changed

Answer: 2. Successful commit marks it inactive.

Experiment: Write a small transition table for active, committed, and aborted states. Test each allowed and rejected transition explicitly.

## Chapter project

Add explicit begin/commit/rollback and stale-commit rejection.
