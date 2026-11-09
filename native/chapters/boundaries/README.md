# Boundaries and errors

Parse input, borrow safely, and preserve invariants when things fail.

## Borrowed views need a lifetime plan

std::span and std::string_view package borrowed access to a sequence. They are useful for accepting arrays, vector elements, or text without owning a copy. Neither keeps the underlying storage alive.

A string_view is not necessarily null-terminated. Use operations that understand its length, and create a std::string if an interface needs an owning or terminated string. A span also requires valid indices: it is not an automatic bounds-checking wrapper.

```cpp
#include <iostream>
#include <span>
#include <string>
#include <string_view>
int main() {
    std::string text = "Ada Lovelace";
    std::string_view first(text.data(),3);
    std::cout << first << '\n';
    int values[]{10,20,30};
    std::span<int> middle(values + 1,1);
    middle[0] += 2;
    std::cout << values[1] << '\n';
    std::string copy(first);
    text.clear();
    std::cout << copy << '\n';
}
```

Expected output:

```text
Ada
22
Ada
```

The span aliases the second array element, so the mutation is visible through values. copy owns its characters; it remains valid after the source string changes. The view is not used after clear.

Pitfall: A view can dangle after its owner is destroyed or reallocates. Mutating an owner can also invalidate the view’s usable range without moving its allocation.

Question: Which object owns the characters after text.clear()?

1. copy
2. first
3. Both views keep text alive

Answer: 1. copy is a separate string. first still carries its old pointer and length and must not be used as a valid view of the cleared string.

Experiment: Write a prefix function returning string_view. Document that its caller must keep the input’s storage alive and unchanged while using the result.

## Parse the entire field

Parsing converts untrusted text into a domain value. std::from_chars reports an error code and the point where parsing stopped. Success is not enough if the grammar requires the whole field to contain a number.

Keep conversion and validation separate. This helper accepts decimal digits in a bounded unsigned domain. It rejects empty input, trailing characters, negative values, and out-of-range values before returning a result.

```cpp
#include <charconv>
#include <iostream>
#include <optional>
#include <string_view>
#include <system_error>
std::optional<unsigned> parse_id(std::string_view text) {
    unsigned value = 0;
    auto [end,error] = std::from_chars(text.data(),text.data()+text.size(),value);
    if (error != std::errc{} || end != text.data()+text.size() || value == 0)
        return std::nullopt;
    return value;
}
int main() {
    for (auto text : {"42","42x","-1","0","99999999999999999999"}) {
        auto value = parse_id(text);
        std::cout << text << ": " << (value ? "valid" : "invalid") << '\n';
    }
}
```

Expected output:

```text
42: valid
42x: invalid
-1: invalid
0: invalid
99999999999999999999: invalid
```

42x contains a valid numeric prefix, but end does not point to the field’s end. The helper therefore rejects it rather than silently accepting 42.

Pitfall: from_chars does not skip leading whitespace like formatted stream extraction. Choose a grammar and handle whitespace deliberately.

Question: Why check both error and end?

1. A valid prefix can leave trailing garbage
2. The error code is always empty
3. The end pointer owns the input

Answer: 1. The error code describes conversion; the end pointer tells you whether the whole field was consumed.

Experiment: Try empty input, a leading space, +42, and the largest unsigned value. Add a separate upper bound for your application.

## Exceptions and failure preservation

An exception can propagate a failure across intermediate calls to a handler. Catch standard exceptions by const reference so their dynamic type and message are preserved. RAII releases owned resources as control unwinds.

The strong exception guarantee means a failed operation has no observable effect on the promised state. A simple way to achieve it is to construct and validate a candidate before committing it with an operation known not to throw.

```cpp
#include <iostream>
#include <stdexcept>
#include <string>
void rename(std::string& current, const std::string& next) {
    std::string candidate = next;
    if (candidate.empty()) throw std::invalid_argument("empty name");
    current.swap(candidate);
}
int main() {
    std::string name = "Ada";
    try { rename(name,""); }
    catch (const std::invalid_argument& error) { std::cout << error.what() << '\n'; }
    std::cout << "preserved=" << name << '\n';
    rename(name,"Grace");
    std::cout << "committed=" << name << '\n';
}
```

Expected output:

```text
empty name
preserved=Ada
committed=Grace
```

Allocation and validation happen while current is untouched. With the standard string allocator used here, swap is nonthrowing. The old string becomes the local candidate and is destroyed on return.

Pitfall: Catching an exception after partially mutating state does not automatically roll that mutation back.

Question: What makes this commit safe?

1. All fallible preparation precedes a nonthrowing swap
2. The catch handler reverses every write
3. Strings never allocate

Answer: 1. Preparation leaves current alone, and the final swap commits the validated candidate.

Experiment: Add a maximum-name-length rule before swap. Verify that both invalid cases preserve current.

## Model alternatives explicitly

Use optional when the outcome is a value or absence. Use variant when a value can take one of several different forms. A named error value can carry useful context without using an exception for an expected validation result.

C++20 does not include std::expected. Here a variant of an unsigned value and an error string makes both alternatives visible. std::visit requires a visitor that can handle every alternative.

```cpp
#include <iostream>
#include <string>
#include <variant>
using Result = std::variant<unsigned,std::string>;
Result score(int value) {
    if (value < 0 || value > 100) return std::string("score outside 0..100");
    return static_cast<unsigned>(value);
}
int main() {
    for (int value : {90,101}) {
        Result result = score(value);
        std::visit([](const auto& item) { std::cout << item << '\n'; },result);
    }
}
```

Expected output:

```text
90
score outside 0..100
```

The generic visitor is instantiated for both possible alternatives. It prints a present score or the error message, and the caller cannot confuse an invalid score with zero.

Pitfall: Getting the wrong variant alternative with std::get throws bad_variant_access. Inspect the active alternative or use visit.

Question: Is std::expected part of C++20?

1. No, it was added in C++23
2. Yes
3. Only in Wasm

Answer: 1. Choose facilities from the course’s language baseline; variant and optional are available in C++20.

Experiment: Replace the error string with a named Error struct containing a code and message. Extend the visitor to format it.

## Chapter project

Reject malformed input without changing valid state.
