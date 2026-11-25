# Binary records and validation

Define byte contracts and preserve state on rejected imports.

## An independent byte fixture defines the encoding

Before this chapter: [Define bytes independently of object layout](../records/README.md)

New terms and notation:

A codec defines how values become a sequence of bytes and how those bytes are checked and converted back into values. Encoding writes a specified representation; decoding must reject representations that do not meet that specification.

A binary format gives precise meanings to byte positions. A length prefix records how much following data belongs to a field. A decoder must check that the input contains the promised bytes before reading them.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/codec-exact-bytes.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/codec-exact-bytes.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
expected{4, 3, 2, 1}
```

With

```cpp
expected{1, 2, 3, 4}
```

Rerun the terminal command. Compare exact= and the exit status. The edited reference uses big-endian byte order. Which order does put32 actually write?

## Check remaining bytes before consuming a field

Before this chapter: [Define bytes independently of object layout](../records/README.md)

New terms and notation:

Happens-before is the C++ ordering relation that lets one operation’s effects be relied on by another. The concurrency lessons construct specific synchronization edges; wall-clock timing or a convenient observed output is not a substitute for those edges.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/codec-bounds.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/codec-bounds.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
bytes{1, 2, 3}
```

With

```cpp
bytes{1, 2}
```

Rerun the terminal command. Compare truncated and cursor=. Does the cursor advance if a shorter prefix is rejected?

## A length prefix needs its own domain bound

Before this chapter: [Define bytes independently of object layout](../records/README.md)

A declared length is untrusted data. Even when the bytes fit the input, the application may impose a smaller maximum to prevent unreasonable resource use or invalid domain values.

Check both the format’s remaining-byte condition and the schema’s maximum before constructing an owning result.

[Open figure: The length prefix bounds the following payload](../../diagrams/codec-length-prefix.html)

Which bytes form the three-character name Ada?

Which bytes form the three-character name Ada? Encoded bytes: index 0 = 3, index 1 = A, index 2 = d, index 3 = a. Offset 0 declares three payload bytes; offsets 1..3 contain the name.. Check that the declared length fits both the format policy and the available bytes before making a view or copy. The length byte is not part of the name.

Check that the declared length fits both the format policy and the available bytes before making a view or copy. The length byte is not part of the name.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/codec-length-prefix.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/codec-length-prefix.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
bytes{3, 'A', 'd', 'a'}
```

With

```cpp
bytes{3, 'B', 'o', 'b'}
```

Rerun the terminal command. Compare the decoded names. What tells the reader how many payload bytes belong to each name?

## Validate a complete candidate before replacing live state

Before this chapter: [Define bytes independently of object layout](../records/README.md)

An import should decode into temporary owned state and publish only after every required field succeeds. This provides failure preservation without reverse-writing partially imported rows.

The example’s two-field fixture is deliberately small. A full table additionally validates uniqueness, row count, text, and trailing-byte rejection.

[Open figure: A partial candidate never replaces the live values](../../diagrams/codec-candidate-import.html)

Why does the failed second read leave live as [7,8]?

Why does the failed second read leave live as [7,8]? Step; Private candidate; Live values. Before decoding; empty; [7,8]; Read first complete u32; [1]; [7,8]; Read second u32: truncated; Reject this candidate; [7,8]; swap is not reached; Discard partial result; [7,8]. . . The input contains only four bytes. The worked decoder stages two fields; a full importer must additionally validate its schema, uniqueness and complete input consumption.

The input contains only four bytes. The worked decoder stages two fields; a full importer must additionally validate its schema, uniqueness and complete input consumption.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/codec-candidate-import.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/codec-candidate-import.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
truncated{1, 0, 0, 0}
```

With

```cpp
truncated{1, 0, 0, 0, 2, 0, 0, 0}
```

Rerun the terminal command. Compare rejected and the two live numbers. When does the decoder replace live state?

## Recognize a format version before interpreting its fields

Before this chapter: [Define bytes independently of object layout](../records/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/codec-version-header.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/codec-version-header.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
future{'C', 'P', 'F', '2'}
```

With

```cpp
future{'C', 'P', 'F', '1'}
```

Rerun the terminal command. Compare the second recognition result. Which format byte must match before the parser can continue?

## Chapter project

Write a record codec with exact independent byte fixtures.
