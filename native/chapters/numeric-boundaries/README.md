# Numeric boundaries in depth

Check narrowing, arithmetic, floating values, and comparisons.

## Compare signed and unsigned values deliberately

Usual arithmetic conversions can turn a negative signed value into an unsigned value during comparison. C++20 comparison helpers express mathematical ordering across signedness without relying on that surprising conversion.

The right type still depends on the domain. Do not use a negative sentinel in a size field when optional or a named status can represent absence.

```cpp
#include <iostream>
#include <utility>

int main() {
    int negative = -1;
    unsigned positive = 1;
    std::cout << "less=" << std::cmp_less(negative, positive)
              << " equal=" << std::cmp_equal(negative, positive) << "\n";
}

```

Expected output:

```text
less=1 equal=0
```

The helper correctly reports that minus one is less than positive one.

Pitfall: Casting the negative value to unsigned before comparison changes its mathematical meaning.

Question: What does cmp_less preserve across signedness?

1. The wrapped unsigned representation
2. A pointer ordering
3. Mathematical value ordering

Answer: 3. The helper handles the sign difference explicitly.

Experiment: Test zero, negative one, and unsigned maximum. Compare results with a deliberately stated domain policy for missing values.

## Validate representability before narrowing

A narrower destination type may not represent the source value. std::in_range checks representability for supported integer types before an explicit cast commits the conversion.

Clamping, rejecting, and wrapping are different policies. The example chooses rejection so callers cannot confuse a truncated value with a valid field.

```cpp
#include <cstdint>
#include <iostream>
#include <optional>
#include <utility>

std::optional<std::uint8_t> narrow(unsigned value) {
    if (!std::in_range<std::uint8_t>(value))
        return std::nullopt;
    return static_cast<std::uint8_t>(value);
}

int main() {
    for (unsigned value : {255u, 256u}) {
        auto result = narrow(value);
        std::cout << value << ":" << bool(result) << "\n";
    }
}

```

Expected output:

```text
255:1
256:0
```

255 fits the eight-bit field and 256 does not. The rejected value is never cast into an accepted result.

Pitfall: Checking whether a value changed after a lossy cast can already have discarded the information needed by the contract.

Question: When is the cast performed?

1. Before checking the source
2. Even when the function returns no result
3. After the range check succeeds

Answer: 3. Representability is established before conversion.

Experiment: Add a signed source version and test negative values. Keep the application’s field bounds separate from the destination type’s range.

## Check multiplication without overflowing the check

For nonnegative unsigned values, multiplication fits when one factor is zero or the other does not exceed max divided by the first. This rearranges the precondition without computing the potentially overflowing product.

Unsigned wrapping is defined, but that does not make a wrapped row count or allocation size acceptable to the application.

```cpp
#include <iostream>
#include <limits>
#include <optional>

std::optional<unsigned> multiply(unsigned a, unsigned b) {
    if (a != 0 && b > std::numeric_limits<unsigned>::max() / a)
        return std::nullopt;
    return a * b;
}

int main() {
    std::cout << *multiply(6, 7)
              << " overflow=" << !multiply(std::numeric_limits<unsigned>::max(), 2)
              << "\n";
}

```

Expected output:

```text
42 overflow=1
```

The small product is accepted; the maximum value times two is rejected before multiplication.

Pitfall: Checking a*b against max after unsigned wrapping does not recover the original mathematical product.

Question: Why handle a==0 separately?

1. Because zero overflows multiplication
2. To force a signed conversion
3. To avoid division by zero in the guard

Answer: 3. The guard itself must be valid for every permitted input.

Experiment: Test zero, one, maximum, and factors immediately around a boundary. Apply the same discipline to byte-count calculations.

## Division has more than a zero-denominator boundary

Signed integer division must reject zero denominators and the minimum-value divided by minus one case when that quotient is not representable. Negating the minimum value has the same representability problem.

Validate before performing the operation. A CPU trap or a Wasm trap is not an ordinary C++ error result that the caller can safely ignore.

```cpp
#include <iostream>
#include <limits>
#include <optional>

std::optional<int> divide(int a, int b) {
    if (b == 0 || (a == std::numeric_limits<int>::min() && b == -1))
        return std::nullopt;
    return a / b;
}

int main() {
    std::cout << *divide(9, 2) << " zero=" << !divide(1, 0)
              << " minimum=" << !divide(std::numeric_limits<int>::min(), -1) << "\n";
}

```

Expected output:

```text
4 zero=1 minimum=1
```

Integer division truncates nine divided by two to four. Both exceptional inputs are rejected before division.

Pitfall: A nonzero denominator alone is not a sufficient precondition for all signed division inputs.

Question: Which nonzero denominator needs a special minimum-value check?

1. One
2. Two
3. Minus one

Answer: 3. The positive quotient would exceed the signed maximum.

Experiment: Add checked remainder and checked negation with the corresponding exceptional-value rules. Test them independently of division.

## Validate finite floating values and choose a tolerance policy

Floating-point arithmetic can produce rounding differences, infinities, and NaNs. A domain that accepts only finite measurements must enforce that rule separately from syntactic numeric parsing.

Approximate comparison needs an application-specific tolerance policy. This example uses a small absolute tolerance for a fixed-scale demonstration, not a universal equality replacement.

```cpp
#include <cmath>
#include <iostream>
#include <limits>

int main() {
    double value=0.1+0.2;
    bool close=std::abs(value-0.3)<1e-12;
    auto nan=std::numeric_limits<double>::quiet_NaN();
    std::cout<<"close="<<close<<" finite_nan="<<std::isfinite(nan)<<" self_equal="<<(nan==nan)<<"\n";
}

```

Expected output:

```text
close=1 finite_nan=0 self_equal=0
```

The finite sum is close under the chosen tolerance. NaN is nonfinite and is not equal to itself.

Pitfall: An absolute tolerance alone can be unsuitable across very different numeric scales.

Question: Does NaN compare equal to itself?

1. Yes
2. Only when printed first
3. No

Answer: 3. NaN has special comparison behavior.

Experiment: Define finite-input, relative-tolerance, and near-zero policies for a measurement domain before writing its parser and tests.

## Chapter project

Build a boundary-focused numeric test table.
