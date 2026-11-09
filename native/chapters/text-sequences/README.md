# Text and sequences

Own, inspect, transform, and validate sequences.

## Text length and byte length are different contracts

std::string owns a sequence of char units. With UTF-8 input, a character can occupy more than one byte, so size is a storage count rather than a user-perceived character count.

The record store limits UTF-8 bytes because the file format stores a byte length. Display width and Unicode segmentation require different algorithms.

```cpp
#include <iostream>
#include <string>

int main() {
    std::string name = "Zoë";
    std::cout << "bytes=" << name.size() << "\n";
    std::cout << name << "\n";
}

```

Expected output:

```text
bytes=4
Zoë
```

Z and o occupy one byte each; ë occupies two UTF-8 bytes. The browser runtime preserves the byte sequence through output decoding.

Pitfall: Truncating at an arbitrary byte boundary can split a UTF-8 sequence and create invalid text.

Question: What does size report for this UTF-8 string?

1. Three Unicode characters
2. Four screen columns
3. Four bytes

Answer: 3. The string counts stored char units, not grapheme clusters.

Experiment: Try a different multibyte name. Inspect its bytes and identify valid code-point boundaries before designing truncation.

## Size describes live elements; capacity describes storage

A vector may own more storage than it currently uses for live elements. reserve requests capacity without constructing new elements. resize changes size and constructs or destroys elements as needed.

Avoid asserting an exact growth factor: the standard specifies capacity guarantees and amortized behavior, not a universal doubling policy.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{1, 2};
    values.reserve(20);
    std::cout << "size=" << values.size() << " enough=" << (values.capacity() >= 20)
              << "\n";
    values.resize(4);
    std::cout << values.at(2) << " " << values.at(3) << "\n";
}

```

Expected output:

```text
size=2 enough=1
0 0
```

reserve leaves two live elements. resize constructs two additional int elements, value-initialized to zero.

Pitfall: Accessing an index below capacity but at or above size still violates the element-access precondition.

Question: After reserve alone, is element 19 alive?

1. Yes, initialized to zero
2. Only when capacity is exactly 20
3. No

Answer: 3. Capacity is storage availability, not the number of constructed elements.

Experiment: Reserve a smaller amount after the first call and inspect capacity. Add a type with visible construction/destruction to study resize.

## Frame input as complete lines

A line-oriented command language needs clear framing before token parsing. getline extracts one line without retaining the delimiter, which prevents a malformed command from borrowing the next command’s text accidentally.

This example uses an in-memory stream for deterministic input. The same getline loop can read preloaded stdin in the browser or a native stream.

```cpp
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::istringstream input("LIST\n\nSAVE\n");
    std::string line;
    while (std::getline(input, line))
        std::cout << "[" << line << "]\n";
}

```

Expected output:

```text
[LIST]
[]
[SAVE]
```

The empty line is a legitimate framed record. The application can choose to ignore it after framing, as the capstone does.

Pitfall: Mixing formatted extraction with getline can leave a newline waiting in the stream. Handle that transition deliberately.

Question: Does getline keep the newline in line?

1. No
2. Yes
3. Only for empty lines

Answer: 1. The delimiter is extracted but not appended to the string.

Experiment: Add a final line without a newline and verify it is still processed. Decide how an overlong command should be rejected.

## Remove elements with an explicit predicate

C++20 provides erase_if for standard sequence containers. It removes elements satisfying a predicate and reports how many were removed. This avoids confusing a logical partition operation with a change in container size.

References and iterators into a vector can be invalidated by erasure. Finish the mutation before establishing new observers.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{1, 2, 3, 4, 5};
    auto removed = std::erase_if(values, [](int value) { return value % 2 == 0; });
    std::cout << "removed=" << removed << " remaining=" << values.size() << "\n";
    for (int value : values)
        std::cout << value;
    std::cout << "\n";
}

```

Expected output:

```text
removed=2 remaining=3
135
```

Two even values are erased. The surviving odd values retain their relative order in the vector.

Pitfall: Do not keep using an iterator to an erased or shifted element after vector erasure.

Question: What changes after erase_if?

1. The vector size and element positions can change
2. Only the capacity changes
3. The original elements are all still present

Answer: 1. erase_if performs actual removal, not just a search.

Experiment: Test no matches, all matches, and an empty vector. Save an index before deletion and decide whether it still names the same record.

## Build subranges from validated bounds

A slice needs both a start and a length that fit the source. Validate using subtraction after checking the start, rather than adding start+length where an unsigned sum could wrap.

A string_view slice borrows the source. Returning an owning string instead is useful when the caller cannot maintain the source lifetime.

```cpp
#include <iostream>
#include <optional>
#include <string_view>

std::optional<std::string_view> slice(std::string_view text, std::size_t start,
                                      std::size_t length) {
    if (start > text.size() || length > text.size() - start)
        return std::nullopt;
    return text.substr(start, length);
}

int main() {
    auto part = slice("Lovelace", 0, 4);
    if (part)
        std::cout << *part << "\n";
    std::cout << "rejected=" << !slice("Ada", 2, 9) << "\n";
}

```

Expected output:

```text
Love
rejected=1
```

The first request selects four bytes. The second asks for more bytes than remain after position two and is rejected before slicing.

Pitfall: A valid byte slice of UTF-8 is not necessarily a valid slice at Unicode boundaries.

Question: Why subtract only after checking start?

1. To allocate a new buffer
2. Because substr always copies
3. To avoid underflow in size-start

Answer: 3. The guard establishes that the unsigned subtraction is representable.

Experiment: Test an empty slice at the end, an out-of-range start, and a very large length. Document byte versus character semantics.

## Chapter project

Build a line-oriented report without borrowing from destroyed input.
