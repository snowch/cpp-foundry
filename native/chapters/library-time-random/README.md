# Durations, deterministic randomness, and bits

Separate clock contracts, distribution guarantees, and finite bit representations.

## Convert duration units explicitly

chrono attaches a period and representation to duration values. Adding compatible durations produces a suitable common unit. Converting to a coarser integral unit can lose information, so duration_cast makes that decision visible rather than silently treating all counts as seconds.

```cpp
#include <chrono>
#include <iostream>

int main() {
  using namespace std::chrono;
  milliseconds total = seconds(2) + milliseconds(750);
  std::cout << total.count() << " " << duration_cast<seconds>(total).count();
}

```

Expected output:

```text
2750 2
```

The common millisecond duration holds 2750. Casting to whole seconds truncates the positive remainder.

Pitfall: A count has no unit attached after extraction. Preserve the duration type across APIs whenever possible.

Question: Which statement correctly describes this example’s contract?

1. count always returns seconds
2. Casting to seconds preserves every millisecond
3. Duration counts must be interpreted with their period

Answer: 3. Duration counts must be interpreted with their period. The common millisecond duration holds 2750. Casting to whole seconds truncates the positive remainder.

Experiment: Try negative durations and distinguish duration_cast truncation from floor and round. Design a timeout parameter that rejects negative input explicitly.

## Separate elapsed time from civil time

steady_clock is intended for monotonic elapsed-time measurement, while system_clock represents wall time and may be adjusted. Time points belong to a particular clock; subtraction is meaningful within the same clock domain. A steady clock’s epoch is not a portable timestamp format.

```cpp
#include <chrono>
#include <iostream>
#include <type_traits>

int main() {
  using Clock = std::chrono::steady_clock;
  constexpr bool steady = Clock::is_steady;
  std::chrono::time_point<Clock, std::chrono::milliseconds> start(
      std::chrono::milliseconds(100));
  auto end = start + std::chrono::milliseconds(25);
  std::cout << steady << " " << (end - start).count();
}

```

Expected output:

```text
1 25
```

Synthetic steady-clock points make the expected difference deterministic without relying on actual scheduling or clock resolution.

Pitfall: high_resolution_clock is an implementation-selected alias and is not guaranteed steady. Never persist an unspecified steady-clock epoch as civil time.

Question: Which statement correctly describes this example’s contract?

1. Use a steady clock for elapsed-time intervals
2. system_clock can never move backward
3. Every clock shares a portable epoch

Answer: 1. Use a steady clock for elapsed-time intervals. Synthetic steady-clock points make the expected difference deterministic without relying on actual scheduling or clock resolution.

Experiment: Write a native benchmark that measures many operations and reports its clock. Keep its nondeterministic timing out of exact-output correctness tests.

## Separate the engine sequence from distribution mapping

A random engine generates a reproducible stateful sequence when its algorithm and seed are fixed. A distribution maps engine outputs into a target domain; its exact mapping need not be identical across standard library implementations. A seed policy is part of a reproducibility contract.

```cpp
#include <iostream>
#include <random>

int main() {
  std::mt19937 a(123), b(123);
  bool same = true;
  for (int i = 0; i < 10; ++i)
    same = same && (a() == b());
  std::mt19937 engine(456);
  std::uniform_int_distribution<int> die(1, 6);
  bool bounded = true;
  for (int i = 0; i < 100; ++i) {
    int n = die(engine);
    bounded = bounded && (n >= 1 && n <= 6);
  }
  std::cout << same << " " << bounded;
}

```

Expected output:

```text
1 1
```

Two equal-seeded engines agree. The distribution test verifies bounds instead of asserting an implementation-specific sequence of dice rolls.

Pitfall: mt19937 is not a cryptographic generator. Modulo reduction can bias a bounded sample when the engine domain is not a multiple of the desired range.

Question: Which statement correctly describes this example’s contract?

1. mt19937 is suitable for secret tokens
2. Distribution output sequences may vary between library implementations
3. Taking a random integer modulo n is always unbiased

Answer: 2. Distribution output sequences may vary between library implementations. Two equal-seeded engines agree. The distribution test verifies bounds instead of asserting an implementation-specific sequence of dice rolls.

Experiment: Save and restore engine state, then verify continuation. Compare a fixed test seed with an externally supplied workload seed and record which library performed distribution mapping.

## Check representation before shifting and bit casting

C++20 bit utilities expose operations on unsigned integer representations without handwritten shifting loops. popcount counts set bits; bit_width reports the minimum width needed for a value; has_single_bit checks a nonzero power of two. These are representation tools, not validation of an arbitrary wire format.

```cpp
#include <bit>
#include <cstdint>
#include <iostream>
#include <limits>

int main() {
  std::uint32_t mask = 0b10110;
  std::cout << std::popcount(mask) << " " << std::bit_width(mask) << " "
            << std::has_single_bit(std::uint32_t{8});
}

```

Expected output:

```text
3 5 1
```

The mask has three set bits and needs five binary positions. Eight has exactly one set bit.

Pitfall: Shifting by a negative count or by a count at least the promoted type width violates the shift precondition. Endianness is a separate concern.

Question: Which statement correctly describes this example’s contract?

1. Unsigned shifts permit every integer count
2. Bit operations still require valid shift counts
3. popcount reports the position of the highest bit

Answer: 2. Bit operations still require valid shift counts. The mask has three set bits and needs five binary positions. Eight has exactly one set bit.

Experiment: Add zero and the highest single-bit value of uint32_t. Compare bit_width with numeric_limits digits and explain why leading zero bits do not contribute.

## Chapter project

Build a deterministic workload generator with an explicit time and seed policy.
