# Binary records and validation

Define byte contracts and preserve state on rejected imports.

## An independent byte fixture defines the encoding

A codec should be tested against externally specified bytes, not just by decoding its own output. Two functions can share the same endianness mistake and still roundtrip successfully.

The field here is exactly four little-endian octets. The test fixture is written literally before the encoder is called.

```cpp
#include <cstdint>
#include <iostream>
#include <span>
#include <stdexcept>
#include <vector>

void put32(std::vector<unsigned char> &bytes, std::uint32_t value) {
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
}
std::uint32_t get32(std::span<const unsigned char> bytes, std::size_t &at) {
    if (at > bytes.size() || bytes.size() - at < 4)
        throw std::runtime_error("truncated");
    std::uint32_t value = 0;
    for (unsigned i = 0; i < 4; ++i)
        value |= std::uint32_t(bytes[at++]) << (i * 8);
    return value;
}

int main() {
    std::vector<unsigned char> actual;
    put32(actual, 0x01020304u);
    const std::vector<unsigned char> expected{4, 3, 2, 1};
    std::cout << "exact=" << (actual == expected) << "\n";
    return actual == expected ? 0 : 1;
}

```

Expected output:

```text
exact=1
```

The least significant byte appears first, matching the independent four-byte fixture.

Pitfall: Serializing sizeof(struct) bytes exposes padding and pointer representation instead of a defined format.

Question: What extra evidence does the literal fixture add?

1. Only agreement between the same two functions
2. Agreement with an external encoding contract
3. Proof of every host filesystem behavior

Answer: 2. It checks the bytes independently of the decoder.

Experiment: Add fixtures for zero, 255, 256, and UINT32_MAX. Compare every byte rather than only the decoded value.

## Check remaining bytes before consuming a field

A decoder needs a cursor and a proof that the next field fits. Check cursor <= size before subtracting, then compare the remaining bytes with the required field width.

Do not perform an unchecked read and hope a later header check catches corruption. The cursor should advance only after the bounds precondition is satisfied.

```cpp
#include <cstdint>
#include <iostream>
#include <span>
#include <stdexcept>
#include <vector>

void put32(std::vector<unsigned char> &bytes, std::uint32_t value) {
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
}
std::uint32_t get32(std::span<const unsigned char> bytes, std::size_t &at) {
    if (at > bytes.size() || bytes.size() - at < 4)
        throw std::runtime_error("truncated");
    std::uint32_t value = 0;
    for (unsigned i = 0; i < 4; ++i)
        value |= std::uint32_t(bytes[at++]) << (i * 8);
    return value;
}

int main() {
    const std::vector<unsigned char> bytes{1, 2, 3};
    std::size_t at = 0;
    try {
        get32(bytes, at);
    } catch (const std::exception &error) {
        std::cout << error.what() << " cursor=" << at << "\n";
    }
}

```

Expected output:

```text
truncated cursor=0
```

The three-byte input cannot contain a four-byte field, so rejection happens before the cursor changes.

Pitfall: Using size-cursor when cursor may exceed size can underflow an unsigned count.

Question: What happens to the cursor on this rejection?

1. It remains zero
2. It advances beyond the input
3. It becomes a negative number

Answer: 1. The precondition check occurs before reading or advancing.

Experiment: Test every prefix length from zero through four and cursors at, before, and beyond the end.

## A length prefix needs its own domain bound

A declared length is untrusted data. Even when the bytes fit the input, the application may impose a smaller maximum to prevent unreasonable resource use or invalid domain values.

Check both the format’s remaining-byte condition and the schema’s maximum before constructing an owning result.

```cpp
#include <iostream>
#include <span>
#include <stdexcept>
#include <string>
#include <vector>

std::string name(std::span<const unsigned char> bytes) {
    if (bytes.empty())
        throw std::runtime_error("missing length");
    auto length = bytes[0];
    if (!length || length > 63 || length > bytes.size() - 1)
        throw std::runtime_error("invalid length");
    return std::string(bytes.begin() + 1, bytes.begin() + 1 + length);
}

int main() {
    const std::vector<unsigned char> bytes{3, 'A', 'd', 'a'};
    std::cout << name(bytes) << "\n";
}

```

Expected output:

```text
Ada
```

The one-byte length is three, within the domain limit and the available payload size.

Pitfall: A valid byte count does not prove the payload is valid UTF-8; encoding validation remains a separate boundary.

Question: Which checks are both necessary?

1. Domain length and available bytes
2. Only the prefix integer type
3. Only whether allocation succeeds

Answer: 1. Format bounds and application bounds address different failures.

Experiment: Try zero, 64, and a truncated declared payload. Add UTF-8 validation before accepting the name as a record field.

## Validate a complete candidate before replacing live state

An import should decode into temporary owned state and publish only after every required field succeeds. This provides failure preservation without reverse-writing partially imported rows.

The example’s two-field fixture is deliberately small. A full table additionally validates uniqueness, row count, text, and trailing-byte rejection.

```cpp
#include <cstdint>
#include <iostream>
#include <span>
#include <stdexcept>
#include <vector>

void put32(std::vector<unsigned char> &bytes, std::uint32_t value) {
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
}
std::uint32_t get32(std::span<const unsigned char> bytes, std::size_t &at) {
    if (at > bytes.size() || bytes.size() - at < 4)
        throw std::runtime_error("truncated");
    std::uint32_t value = 0;
    for (unsigned i = 0; i < 4; ++i)
        value |= std::uint32_t(bytes[at++]) << (i * 8);
    return value;
}

int main() {
    std::vector<std::uint32_t> live{7, 8};
    const std::vector<unsigned char> truncated{1, 0, 0, 0};
    try {
        std::size_t at = 0;
        std::vector<std::uint32_t> candidate;
        candidate.push_back(get32(truncated, at));
        candidate.push_back(get32(truncated, at));
        live.swap(candidate);
    } catch (const std::exception &) {
        std::cout << "rejected ";
    }
    std::cout << live[0] << "," << live[1] << "\n";
}

```

Expected output:

```text
rejected 7,8
```

The second field fails. Because swap was not reached, the original live values remain seven and eight.

Pitfall: Catching a decoder exception after overwriting live rows does not automatically restore the previous table.

Question: When is the candidate published?

1. After each decoded byte
2. When the first field looks valid
3. After complete validation

Answer: 3. The final swap is separated from fallible preparation.

Experiment: Add a trailing-byte check before swap. Verify every truncated prefix leaves the independently captured live state unchanged.

## Recognize a format version before interpreting its fields

A magic/version header distinguishes a documented format from unrelated bytes and future incompatible layouts. Validate it before interpreting counts and offsets under the current schema.

A recognized header is only the beginning of validation. It does not make later field lengths, values, or checksums trustworthy.

```cpp
#include <array>
#include <iostream>
#include <span>

bool recognized(std::span<const unsigned char> bytes) {
    return bytes.size() >= 4 && bytes[0] == 'C' && bytes[1] == 'P' && bytes[2] == 'F' &&
           bytes[3] == '1';
}

int main() {
    const std::array<unsigned char, 4> good{'C', 'P', 'F', '1'},
        future{'C', 'P', 'F', '2'};
    std::cout << recognized(good) << " " << recognized(future) << "\n";
}

```

Expected output:

```text
1 0
```

The current CPF1 signature is recognized; CPF2 is rejected rather than silently interpreted with the old layout.

Pitfall: Ignoring an unknown version can turn a valid future file into corrupted state under the wrong decoder.

Question: What should an unsupported version do?

1. Be treated as the current version
2. Skip all validation
3. Produce an explicit rejection or migration path

Answer: 3. A format boundary needs an intentional compatibility policy.

Experiment: Document a migration function that reads the old format into a validated domain value before writing a new version.

## Chapter project

Write a record codec with exact independent byte fixtures.
