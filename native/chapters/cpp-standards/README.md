# C++ standards and library contracts

Separate language versions, feature detection, and implementation choices.

## State the language baseline explicitly

A language version controls available syntax and semantic rules. __cplusplus reports the selected language mode, not the completeness of every standard-library feature. This course requires C++20 or later.

A project should document its compiler, language mode, library, and host separately so a successful build has an interpretable contract.

```cpp
#include <iostream>

int main() {
    static_assert(__cplusplus>=202002L);
    std::cout<<"C++20 baseline enabled\n";
}

```

Expected output:

```text
C++20 baseline enabled
```

The compile-time assertion rejects an older selected language mode before the program runs.

Pitfall: A recent compiler executable can still be invoked in an older language mode.

Question: What does __cplusplus primarily describe?

1. The operating-system version
2. The selected C++ language mode
3. Every library implementation detail

Answer: 2. The mode is distinct from compiler and library release numbers.

Experiment: Compile the exported source with C++17 and C++20 flags and compare the baseline diagnostic. Record the toolchain versions separately.

## Detect a required facility with its feature macro

Feature-test macros describe availability of particular language or library facilities. Include the relevant header or version header, then test the documented macro value rather than guessing from a vendor name.

Feature detection should guard an intentional fallback or an explicit build rejection. Silently removing behavior can change a lesson or application contract.

```cpp
#include <iostream>
#include <span>
#include <version>

int main() {
    static_assert(__cpp_lib_span>=202002L);
    int values[]{1,2};std::span<int> view(values);
    std::cout<<"span="<<view.size()<<"\n";
}

```

Expected output:

```text
span=2
```

The program checks span availability and then uses the facility covered by that requirement.

Pitfall: A compiler version check can mispredict a feature supplied by a separately versioned standard library.

Question: Why prefer a facility feature macro?

1. It proves every facility is complete
2. It detects all runtime platform behavior
3. It directly describes the required facility

Answer: 3. The check targets the capability the code needs.

Experiment: Add a documented required macro for concepts or ranges. Distinguish a missing facility from a runtime host limitation.

## Include the header that declares each used facility

A standard header can include other headers as an implementation detail. Depending on that accidental inclusion can make code compile with one library and fail with another. Include the declarations you actually use.

Small translation-unit checks are useful: compile a public header on its own with a minimal caller rather than only through a large precompiled environment.

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{1, 2, 3};
    std::size_t size = values.size();
    std::cout << "elements=" << size << "\n";
}

```

Expected output:

```text
elements=3
```

vector declares the container, cstddef supplies size_t, and iostream supplies the output interface.

Pitfall: An umbrella header in one environment can hide missing direct includes in your own header.

Question: Should a public header rely on an unrelated caller’s includes?

1. Yes
2. No
3. Only for templates

Answer: 2. Its declared dependencies should be self-contained.

Experiment: Create a tiny source that includes only one project header and main. Compile it with two standard-library/toolchain combinations when available.

## Make effect ordering explicit

Expressions with side effects require a sequencing rule. Rather than relying on subtle evaluation-order details, split logically ordered operations into statements when the algorithm needs one result before another.

This is especially useful around stream reads, state mutation, and function calls. Readability can make a correctness argument easier than a compact expression.

```cpp
#include <iostream>

int main() {
    int value = 1;
    int before = value;
    ++value;
    int after = value;
    std::cout << before << " " << after << "\n";
}

```

Expected output:

```text
1 2
```

Each full expression completes before the next statement, so the before and after values have an explicit order.

Pitfall: Do not infer a universal argument-evaluation order from one compiler’s observed output.

Question: What establishes the order in this example?

1. Separate sequenced statements
2. Alphabetical variable names
3. The output buffer size

Answer: 1. Each completed statement precedes the next.

Experiment: Audit an input-processing expression with several side effects and rewrite it as named steps with a stated precondition for each.

## Object representation is not an interchange format

C++ object layout can include padding and implementation-specific representations. Standard-layout properties help certain language operations, but do not turn an object containing a string into a portable file record.

A stable interchange format defines widths, byte order, text encoding, and validation independently of ABI choices.

```cpp
#include <array>
#include <cstdint>
#include <iostream>

int main() {
    std::array<unsigned char, 4> bytes{0x78, 0x56, 0x34, 0x12};
    std::uint32_t value = 0;
    for (unsigned i = 0; i < 4; ++i)
        value |= std::uint32_t(bytes[i]) << (8 * i);
    std::cout << std::hex << value << "\n";
}

```

Expected output:

```text
12345678
```

The value is reconstructed from explicit octets without reinterpreting the array as a uint32_t object.

Pitfall: reinterpret_cast does not supply alignment, lifetime, or endianness guarantees for arbitrary file bytes.

Question: What makes these bytes portable?

1. The address of the array
2. The explicitly defined decoding rule
3. The current struct padding

Answer: 2. The format contract is independent of host object layout.

Experiment: Write the matching encoder and independent fixtures. Keep ABI-dependent structs out of the persisted representation.

## Chapter project

Document the language, library, and host assumptions of your project.
