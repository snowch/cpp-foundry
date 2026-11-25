# Maintenance and checkpointing

Compact, checkpoint, and publish generations without invalidating readers.

## Compaction changes offsets while preserving logical records

Before this chapter: [Reclaim only versions older than every active reader needs](../mvcc/README.md)

Compaction repacks live data to recover space. A generation identifies one published storage version; old readers may keep using an older generation after a new one is published. Publication and reclaiming the old storage are separate steps.

A slotted-page representation can separate stable slot identity from the current byte offset of a payload. Compaction packs live payloads and updates offsets, removing gaps left by deleted entries.

Any borrowed pointer into the old byte buffer can be invalidated. Keep record identity and pin ownership separate from a transient payload address.

```cpp
#include <iostream>
#include <string>
#include <vector>

struct Slot {
    std::string text;
    bool live;
};

int main() {
    std::vector<Slot> slots{{"Ada", true}, {"deleted", false}, {"Grace", true}};
    std::string packed;
    std::vector<std::size_t> offsets;
    for (const auto &slot : slots)
        if (slot.live) {
            offsets.push_back(packed.size());
            packed += slot.text;
        }
    std::cout << packed << " offsets=" << offsets[0] << "," << offsets[1] << "\n";
}

```

Original program output:

```text
AdaGrace offsets=0,3
```

The deleted payload disappears from the packed bytes, and the second live record starts at its new offset three.

Pitfall: Keeping old offsets after moving bytes can return the wrong record without an obvious crash.

Question: What must compaction update?

1. Live payload offsets
2. Only the free-byte counter
3. Every logical record ID

Answer: 1. Physical positions change while logical identity should remain stable.

### Run the starter, then try a change

Open `native/examples/page-compaction.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/page-compaction.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
{"Ada", true}
```

With

```cpp
{"Al", true}
```

Rerun the terminal command. Compare the packed text and offsets=. How does shortening the first live value move the second?

## A reused slot needs a generation check

Before this chapter: [Reclaim only versions older than every active reader needs](../mvcc/README.md)

A numeric slot can be freed and later reused for a different object. A stale handle containing only that slot number may then accidentally access the new object. A generation tag lets lookup reject a handle from the earlier lifetime.

Generation wrap and synchronized reuse are additional protocol limits; adding a small tag is not an unlimited ABA proof.

[Open figure: A reused slot is not the same generation](../../diagrams/generation-handles.html)

Why must the old handle be rejected even though slot 0 is live again?

Why must the old handle be rejected even though slot 0 is live again? State; Slot index; Generation; Value. Old handle; 0; 1; Identifies the old record; Initial live slot; 0; 1; 10; After reuse; 0; 2; 20; Validation; Index matches; Generation differs; Reject stale handle. . . The generation check prevents a stale logical handle from silently naming a replacement record. It does not by itself manage concurrent memory lifetime or generation wrap.

The generation check prevents a stale logical handle from silently naming a replacement record. It does not by itself manage concurrent memory lifetime or generation wrap.

```cpp
#include <iostream>

struct Handle {
    unsigned slot, generation;
};
struct Slot {
    unsigned generation;
    int value;
    bool live;
};

int main() {
    Slot slot{1, 10, true};
    Handle old{0, 1};
    slot.live = false;
    ++slot.generation;
    slot.value = 20;
    slot.live = true;
    bool valid = old.slot == 0 && slot.live && old.generation == slot.generation;
    std::cout << "stale_rejected=" << !valid << " current=" << slot.value << "\n";
}

```

Original program output:

```text
stale_rejected=1 current=20
```

The physical slot is live again, but the old generation no longer matches its new occupant.

Pitfall: Checking only whether a slot is allocated cannot distinguish successive object lifetimes.

Question: Why is the old handle rejected?

1. Its generation differs
2. Its slot number changed
3. The current value is negative

Answer: 1. The generation identifies the slot’s lifetime instance.

### Run the starter, then try a change

Open `native/examples/generation-handles.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/generation-handles.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
Handle old{0, 1};
```

With

```cpp
Handle old{0, 2};
```

Rerun the terminal command. Compare stale_rejected= and current=. This uses the new slot generation in the handle. Which comparison allows it through?

## A checkpoint covers a precise committed prefix

Before this chapter: [Reclaim only versions older than every active reader needs](../mvcc/README.md)

A checkpoint represents a committed state at a particular log position. Recovery combines that state with the log suffix after the checkpoint’s covered prefix. Truncating more log than the checkpoint covers can lose committed updates.

The fixture models positions and state values in memory. Durable checkpoint publication needs checked host ordering before old log storage can be retired.

```cpp
#include <iostream>
#include <utility>
#include <vector>

int main() {
    const std::vector<std::pair<unsigned, int>> log{{1, 10}, {2, 20}, {3, 30}};
    unsigned covered = 2;
    int state = 20;
    for (auto [position, value] : log)
        if (position > covered)
            state = value;
    std::cout << "covered=" << covered << " recovered=" << state << "\n";
}

```

Original program output:

```text
covered=2 recovered=30
```

The checkpoint supplies state at position two, and the position-three suffix advances it to thirty.

Pitfall: Publishing a checkpoint marker before its corresponding state is safely available can authorize premature log deletion.

Question: Which log records must still be replayed?

1. Every record before the checkpoint only
2. Those after the covered checkpoint position
3. No records after any checkpoint exists

Answer: 2. The checkpoint covers a prefix, not future commits.

### Run the starter, then try a change

Open `native/examples/checkpoint-cutoff.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/checkpoint-cutoff.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
unsigned covered = 2;
    int state = 20;
```

With

```cpp
unsigned covered = 3;
    int state = 30;
```

Rerun the terminal command. Compare covered= and recovered=. If the checkpoint already covers the final record, which updates need replay?

## Publish a replacement without invalidating old readers

Before this chapter: [Reclaim only versions older than every active reader needs](../mvcc/README.md)

Compaction or checkpointing can produce a new immutable generation while readers still use the old one. Publish an owning handle to the new generation, then retire old storage only after retained readers finish.

This ownership model does not by itself synchronize a real concurrent publication; the atomic-handle and locking lessons supply that separate boundary.

[Open figure: Old readers retain the old generation](../../diagrams/generation-publication.html)

Why is old_size 3 while new_size is 2?

Why is old_size 3 while new_size is 2? Before publication: Old immutable vector contains [1,2,3]. current shared owner Old immutable vector; reader shared owner Old immutable vector. After replacing current: Old immutable vector contains [1,2,3]. reader keeps old generation alive Old immutable vector; New immutable vector contains [2,3]. current owns new generation New immutable vector. The old generation can be reclaimed only after its last owner releases it. Replacing a handle is separate from reclamation and does not prove durable file replacement.

The old generation can be reclaimed only after its last owner releases it. Replacing a handle is separate from reclamation and does not prove durable file replacement.

```cpp
#include <iostream>
#include <memory>
#include <vector>

int main() {
    auto current =
        std::make_shared<const std::vector<int>>(std::initializer_list<int>{1, 2, 3});
    auto reader = current;
    current =
        std::make_shared<const std::vector<int>>(std::initializer_list<int>{2, 3});
    std::cout << "old_size=" << reader->size() << " new_size=" << current->size()
              << "\n";
}

```

Original program output:

```text
old_size=3 new_size=2
```

The old reader sees its original three-element generation while new users obtain the compacted two-element generation.

Pitfall: Overwriting old bytes in place can break readers even when the new generation is logically correct.

Question: What protects the old generation here?

1. The name current
2. The new vector’s smaller capacity
3. The reader’s owning handle

Answer: 3. Retained ownership separates publication from reclamation.

### Run the starter, then try a change

Open `native/examples/generation-publication.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/generation-publication.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::initializer_list<int>{2, 3}
```

With

```cpp
std::initializer_list<int>{3}
```

Rerun the terminal command. Compare old_size= and new_size=. Which reader still sees the previous generation?

## Refresh statistics from the state they describe

Before this chapter: [Reclaim only versions older than every active reader needs](../mvcc/README.md)

A maintenance pass can rebuild statistics after data changes. Record which committed generation or revision the statistics summarize so a planner can reason about stale estimates.

This fixture recomputes a selective count from owning rows and compares it with an older estimate. It does not assume uniform distribution or infer a durable speedup from one sample.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    const std::vector<int> scores{95, 95, 95, 20, 10};
    unsigned old_estimate = 1;
    auto observed = std::count_if(scores.begin(), scores.end(),
                                  [](int score) { return score >= 90; });
    std::cout << "old=" << old_estimate << " refreshed=" << observed << "\n";
}

```

Original program output:

```text
old=1 refreshed=3
```

The current distribution has three high scores, which differs from the older estimate of one.

Pitfall: Statistics gathered from mixed uncommitted and committed versions can describe no actual query snapshot.

Question: Which state should a statistic identify?

1. An arbitrary mixture of reader versions
2. Only the compiler version
3. The committed view it summarizes

Answer: 3. Statistics need a defined data-view boundary.

### Run the starter, then try a change

Open `native/examples/statistics-refresh.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/statistics-refresh.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
return score >= 90;
```

With

```cpp
return score >= 96;
```

Rerun the terminal command. Compare old= and refreshed=. Which updated observation changes when you tighten the predicate, and which number remains a supplied estimate?

## Chapter project

Model generation replacement and old-reader retention.
