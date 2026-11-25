# Snapshots and version ownership

Choose visible versions and delay reclamation until readers finish.

## Visibility is a half-open version interval

Before this chapter: [Expose a lost update with an explicit schedule](../isolation/README.md)

New terms and notation:

Multi-version concurrency control, or MVCC, keeps multiple versions so a reader can use the version selected by its snapshot. A snapshot identifies the reader’s view; old versions cannot be reclaimed while a reader still needs them.

A version interval describes which snapshots can see a stored version. Registering a snapshot records that a reader still needs its view. Reclamation removes old storage only when no registered reader can need it; this chapter models one row.

A committed version is visible when its begin stamp is at or before the reader snapshot and its end stamp is after it. Half-open intervals ensure a replacement boundary chooses exactly one version.

This bounded single-row model stores owning optional values and rejects stamp exhaustion before incrementing. It is not a complete multi-row MVCC transaction engine.

[Open figure: Visibility uses half-open committed intervals](../../diagrams/version-intervals.html)

Why do snapshots 1 and 2 see 10 and 20 respectively?

Why do snapshots 1 and 2 see 10 and 20 respectively? Version value; Visibility interval; Reader result. 10; [1,2); snapshot 1 → 10; 20; [2,forever); snapshot 2 → 20. . . The begin stamp is inclusive and end stamp exclusive. Stamps are logical versions, not seconds; uncommitted visibility and concurrent reclamation are separate contracts.

The begin stamp is inclusive and end stamp exclusive. Stamps are logical versions, not seconds; uncommitted visibility and concurrent reclamation are separate contracts.

```cpp
#include <algorithm>
#include <iostream>
#include <limits>
#include <optional>
#include <set>
#include <stdexcept>
#include <vector>

struct Version {
    unsigned begin, end;
    std::optional<int> value;
};
struct Versions {
    static constexpr unsigned forever = std::numeric_limits<unsigned>::max();
    unsigned clock = 1;
    std::vector<Version> rows{{1, forever, 10}};
    std::multiset<unsigned> active;
    unsigned snapshot() {
        active.insert(clock);
        return clock;
    }
    void release(unsigned stamp) {
        auto found = active.find(stamp);
        if (found == active.end())
            throw std::runtime_error("unknown snapshot");
        active.erase(found);
    }
    void write(std::optional<int> value) {
        if (clock == forever - 1)
            throw std::runtime_error("version limit");
        auto candidate = rows;
        candidate.back().end = clock + 1;
        candidate.push_back({clock + 1, forever, value});
        rows.swap(candidate);
        ++clock;
    }
    std::optional<int> read(unsigned snapshot) const {
        for (auto it = rows.rbegin(); it != rows.rend(); ++it)
            if (it->begin <= snapshot && snapshot < it->end)
                return it->value;
        return std::nullopt;
    }
    void collect() {
        unsigned oldest = active.empty() ? clock : *active.begin();
        std::erase_if(rows,
                      [&](const Version &version) { return version.end <= oldest; });
    }
};

int main() {
    Versions versions;
    versions.write(20);
    std::cout << *versions.read(1) << " " << *versions.read(2) << "\n";
}

```

Original program output:

```text
10 20
```

Snapshot one selects the original value and snapshot two selects its replacement at the boundary.

Pitfall: Inclusive end stamps can make two versions appear visible at the same replacement boundary.

Question: Is a version visible at its end stamp?

1. No
2. Yes
3. Only if its value is nonzero

Answer: 1. The visibility interval excludes its end.

### Run the starter, then try a change

Open `native/examples/version-intervals.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/version-intervals.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
versions.write(20);
```

With

```cpp
versions.write(25);
```

Rerun the terminal command. Compare the two reads at stamps 1 and 2. Which interval contains the new value?

## A retained snapshot keeps its logical read stamp

Before this chapter: [Expose a lost update with an explicit schedule](../isolation/README.md)

A snapshot is a chosen logical observation time, not simply the latest version each time a reader asks. Retaining that stamp lets a long read observe the same committed version while later writes create newer versions.

The model registers active snapshots so later reclamation can account for readers that still need old state.

```cpp
#include <algorithm>
#include <iostream>
#include <limits>
#include <optional>
#include <set>
#include <stdexcept>
#include <vector>

struct Version {
    unsigned begin, end;
    std::optional<int> value;
};
struct Versions {
    static constexpr unsigned forever = std::numeric_limits<unsigned>::max();
    unsigned clock = 1;
    std::vector<Version> rows{{1, forever, 10}};
    std::multiset<unsigned> active;
    unsigned snapshot() {
        active.insert(clock);
        return clock;
    }
    void release(unsigned stamp) {
        auto found = active.find(stamp);
        if (found == active.end())
            throw std::runtime_error("unknown snapshot");
        active.erase(found);
    }
    void write(std::optional<int> value) {
        if (clock == forever - 1)
            throw std::runtime_error("version limit");
        auto candidate = rows;
        candidate.back().end = clock + 1;
        candidate.push_back({clock + 1, forever, value});
        rows.swap(candidate);
        ++clock;
    }
    std::optional<int> read(unsigned snapshot) const {
        for (auto it = rows.rbegin(); it != rows.rend(); ++it)
            if (it->begin <= snapshot && snapshot < it->end)
                return it->value;
        return std::nullopt;
    }
    void collect() {
        unsigned oldest = active.empty() ? clock : *active.begin();
        std::erase_if(rows,
                      [&](const Version &version) { return version.end <= oldest; });
    }
};

int main() {
    Versions versions;
    auto snapshot = versions.snapshot();
    versions.write(20);
    versions.write(30);
    std::cout << "snapshot=" << *versions.read(snapshot)
              << " current=" << *versions.read(versions.clock) << "\n";
    versions.release(snapshot);
}

```

Original program output:

```text
snapshot=10 current=30
```

The registered reader continues selecting value ten while current committed state advances to thirty.

Pitfall: Reading “latest” inside every step of a supposedly stable scan can mix incompatible versions.

Question: What remains fixed for this reader?

1. Its snapshot stamp
2. The current store clock
3. The number of allocated versions

Answer: 1. The stamp defines its visibility view.

### Run the starter, then try a change

Open `native/examples/stable-snapshot.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/stable-snapshot.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
versions.write(30);
```

With

```cpp
versions.write(40);
```

Rerun the terminal command. Compare snapshot= and current=. Which stamp remains fixed while current follows the version clock?

## A tombstone preserves historical visibility

Before this chapter: [Expose a lost update with an explicit schedule](../isolation/README.md)

Deleting a row under MVCC can publish a tombstone version rather than immediately destroying all history. Old snapshots still select the earlier value, while newer snapshots observe absence.

optional represents the row’s visible absence in this single-row model. A larger API may also need to distinguish never-existing keys from retained tombstones internally.

```cpp
#include <algorithm>
#include <iostream>
#include <limits>
#include <optional>
#include <set>
#include <stdexcept>
#include <vector>

struct Version {
    unsigned begin, end;
    std::optional<int> value;
};
struct Versions {
    static constexpr unsigned forever = std::numeric_limits<unsigned>::max();
    unsigned clock = 1;
    std::vector<Version> rows{{1, forever, 10}};
    std::multiset<unsigned> active;
    unsigned snapshot() {
        active.insert(clock);
        return clock;
    }
    void release(unsigned stamp) {
        auto found = active.find(stamp);
        if (found == active.end())
            throw std::runtime_error("unknown snapshot");
        active.erase(found);
    }
    void write(std::optional<int> value) {
        if (clock == forever - 1)
            throw std::runtime_error("version limit");
        auto candidate = rows;
        candidate.back().end = clock + 1;
        candidate.push_back({clock + 1, forever, value});
        rows.swap(candidate);
        ++clock;
    }
    std::optional<int> read(unsigned snapshot) const {
        for (auto it = rows.rbegin(); it != rows.rend(); ++it)
            if (it->begin <= snapshot && snapshot < it->end)
                return it->value;
        return std::nullopt;
    }
    void collect() {
        unsigned oldest = active.empty() ? clock : *active.begin();
        std::erase_if(rows,
                      [&](const Version &version) { return version.end <= oldest; });
    }
};

int main() {
    Versions versions;
    auto old = versions.snapshot();
    versions.write(std::nullopt);
    std::cout << "old=" << *versions.read(old)
              << " current_missing=" << !versions.read(versions.clock) << "\n";
    versions.release(old);
}

```

Original program output:

```text
old=10 current_missing=1
```

The old reader retains ten, but the delete version hides the row from the current view.

Pitfall: Immediately freeing all old values on delete breaks readers whose snapshots precede the deletion.

Question: What does the tombstone change?

1. Visibility for newer snapshots
2. Every older snapshot’s historical value
3. The encoding of all previous versions

Answer: 1. The new interval represents absence without rewriting earlier history.

### Run the starter, then try a change

Open `native/examples/versioned-delete.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/versioned-delete.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
versions.write(std::nullopt);
```

With

```cpp
versions.write(std::nullopt); versions.write(12);
```

Rerun the terminal command. Compare old= and current_missing=. Is the key still absent at the newest stamp after inserting again?

## Several readers can hold the same snapshot stamp

Before this chapter: [Expose a lost update with an explicit schedule](../isolation/README.md)

A reader registry must account for every active reader, including several readers beginning at the same committed stamp. A set that records only unique stamps can release one reader and accidentally erase protection for another.

The model uses a multiset, so release removes exactly one registration at a time.

```cpp
#include <algorithm>
#include <iostream>
#include <limits>
#include <optional>
#include <set>
#include <stdexcept>
#include <vector>

struct Version {
    unsigned begin, end;
    std::optional<int> value;
};
struct Versions {
    static constexpr unsigned forever = std::numeric_limits<unsigned>::max();
    unsigned clock = 1;
    std::vector<Version> rows{{1, forever, 10}};
    std::multiset<unsigned> active;
    unsigned snapshot() {
        active.insert(clock);
        return clock;
    }
    void release(unsigned stamp) {
        auto found = active.find(stamp);
        if (found == active.end())
            throw std::runtime_error("unknown snapshot");
        active.erase(found);
    }
    void write(std::optional<int> value) {
        if (clock == forever - 1)
            throw std::runtime_error("version limit");
        auto candidate = rows;
        candidate.back().end = clock + 1;
        candidate.push_back({clock + 1, forever, value});
        rows.swap(candidate);
        ++clock;
    }
    std::optional<int> read(unsigned snapshot) const {
        for (auto it = rows.rbegin(); it != rows.rend(); ++it)
            if (it->begin <= snapshot && snapshot < it->end)
                return it->value;
        return std::nullopt;
    }
    void collect() {
        unsigned oldest = active.empty() ? clock : *active.begin();
        std::erase_if(rows,
                      [&](const Version &version) { return version.end <= oldest; });
    }
};

int main() {
    Versions versions;
    auto first = versions.snapshot(), second = versions.snapshot();
    versions.write(20);
    versions.release(first);
    versions.collect();
    std::cout << "retained=" << versions.rows.size()
              << " reader=" << *versions.read(second) << "\n";
    versions.release(second);
}

```

Original program output:

```text
retained=2 reader=10
```

One reader remains registered at the old stamp, so both versions are retained after collection.

Pitfall: A uniqueness-only registry can undercount readers that share one version.

Question: Why is a multiset used?

1. Each reader registration must be counted
2. Version stamps must be random
3. It sorts row payloads

Answer: 1. Duplicate stamps still represent distinct active readers.

### Run the starter, then try a change

Open `native/examples/snapshot-registration.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/snapshot-registration.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
versions.release(first);
    versions.collect();
```

With

```cpp
versions.release(first);
    versions.collect();
    versions.write(30);
```

Rerun the terminal command. Compare retained= and reader=. Does a new version displace the old one while the other reader still holds its stamp?

## Reclaim only versions older than every active reader needs

Before this chapter: [Expose a lost update with an explicit schedule](../isolation/README.md)

The oldest registered snapshot bounds which historical versions can still be visible. A version whose end is at or before that oldest stamp is no longer needed by those readers. The current open-ended version must remain.

This is a bounded logical reclamation model. Concurrent registration, iterator lifetime, and physical page reuse need additional synchronized ownership rules.

[Open figure: An old reader keeps the earlier version alive](../../diagrams/oldest-reader-gc.html)

Why are three versions retained until snapshot 1 is released?

The fixture has value 10 visible in [1,2), value 20 in [2,3), and current value 30 from version 3 onward. Active snapshot 1 requires value 10. The conservative oldest-reader horizon also retains intermediate value 20, so three versions remain. After releasing that reader with no other active reader, the horizon becomes 3: values 10 and 20 can be reclaimed, leaving current value 30. Version stamps are not wall-clock times.

Version numbers are committed stamps, not times. The implementation uses a bounded sentinel for forever and an oldest-active-reader horizon. Releasing one reader cannot reclaim data another active reader needs.

```cpp
#include <algorithm>
#include <iostream>
#include <limits>
#include <optional>
#include <set>
#include <stdexcept>
#include <vector>

struct Version {
    unsigned begin, end;
    std::optional<int> value;
};
struct Versions {
    static constexpr unsigned forever = std::numeric_limits<unsigned>::max();
    unsigned clock = 1;
    std::vector<Version> rows{{1, forever, 10}};
    std::multiset<unsigned> active;
    unsigned snapshot() {
        active.insert(clock);
        return clock;
    }
    void release(unsigned stamp) {
        auto found = active.find(stamp);
        if (found == active.end())
            throw std::runtime_error("unknown snapshot");
        active.erase(found);
    }
    void write(std::optional<int> value) {
        if (clock == forever - 1)
            throw std::runtime_error("version limit");
        auto candidate = rows;
        candidate.back().end = clock + 1;
        candidate.push_back({clock + 1, forever, value});
        rows.swap(candidate);
        ++clock;
    }
    std::optional<int> read(unsigned snapshot) const {
        for (auto it = rows.rbegin(); it != rows.rend(); ++it)
            if (it->begin <= snapshot && snapshot < it->end)
                return it->value;
        return std::nullopt;
    }
    void collect() {
        unsigned oldest = active.empty() ? clock : *active.begin();
        std::erase_if(rows,
                      [&](const Version &version) { return version.end <= oldest; });
    }
};

int main() {
    Versions versions;
    auto old = versions.snapshot();
    versions.write(20);
    versions.write(30);
    versions.collect();
    std::cout << "while_reading=" << versions.rows.size() << " ";
    versions.release(old);
    versions.collect();
    std::cout << "after_release=" << versions.rows.size()
              << " current=" << *versions.read(versions.clock) << "\n";
}

```

Original program output:

```text
while_reading=3 after_release=1 current=30
```

The oldest reader retains all three required intervals. After it leaves, collection removes the obsolete closed versions.

Pitfall: Computing an oldest stamp without synchronizing reader registration can race with a newly admitted old reader.

Question: What must remain after all old readers finish?

1. Every closed version forever
2. The current version
3. Only the oldest version

Answer: 2. The live committed state must not be reclaimed.

### Run the starter, then try a change

Open `native/examples/oldest-reader-gc.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/oldest-reader-gc.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
versions.write(30);
```

With

```cpp
versions.write(30); versions.write(40);
```

Rerun the terminal command. Compare while_reading=, after_release= and current=. Which versions can collection remove after the oldest reader leaves?

## Chapter project

Build a bounded version store with registered snapshots.
