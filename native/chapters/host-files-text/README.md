# Files, text, and host boundaries

Distinguish byte formats, text conventions, names, and host behavior.

## Normalize line endings at a text boundary

Before this chapter: [An independent byte fixture defines the encoding](../binary-codecs/README.md)

A file is a sequence of bytes offered by a host environment. A path is a name used to locate an object, not an unchanging identity. Text conventions such as line endings may differ even when programs use the same C++ language rules.

Text files may use LF or CRLF line endings. getline removes LF from the stream but can leave a preceding carriage return in the returned string when reading literal bytes. A text protocol must decide how to normalize that boundary.

Do not apply text normalization to a binary database format, where every byte has a defined role.

```cpp
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::istringstream input("LIST\r\nSAVE\n");
    std::string line;
    while (std::getline(input, line)) {
        if (!line.empty() && line.back() == '\r')
            line.pop_back();
        std::cout << "[" << line << "]\n";
    }
}

```

Original program output:

```text
[LIST]
[SAVE]
```

The CRLF and LF lines produce the same command text after the explicit trailing-CR rule.

Pitfall: Blindly deleting every carriage return can alter quoted payload text rather than just line framing.

Question: Where should this normalization happen?

1. Inside every binary field
2. At the documented text framing boundary
3. After converting the entire file to native structs

Answer: 2. The protocol defines which delimiters are framing rather than payload.

### Run the starter, then try a change

Open `native/examples/line-endings.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/line-endings.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
LIST\r\nSAVE\n
```

With

```cpp
LIST\r\n\r\nSAVE
```

Rerun the terminal command. Compare the bracketed lines. Which line is empty, and why does SAVE appear even without a final newline?

## Binary payloads can contain zero bytes

Before this chapter: [An independent byte fixture defines the encoding](../binary-codecs/README.md)

A binary stream carries explicit byte counts, including zero-valued bytes. C string functions that stop at a zero terminator cannot represent arbitrary binary payload lengths.

Use a container size and a checked write/read count. The database format’s string fields have their own explicit lengths and validation rules.

```cpp
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string bytes("A\0B", 3);
    std::istringstream input(bytes);
    char value;
    unsigned count = 0, zeros = 0;
    while (input.get(value)) {
        ++count;
        if (value == 0)
            ++zeros;
    }
    std::cout << "bytes=" << count << " zeros=" << zeros << "\n";
}

```

Original program output:

```text
bytes=3 zeros=1
```

All three bytes are consumed, including the embedded zero between A and B.

Pitfall: strlen would report only the prefix before the embedded zero.

Question: What supplies the binary length here?

1. A zero terminator
2. The explicit string size
3. The printed width

Answer: 2. The owned byte sequence tracks its complete length.

### Run the starter, then try a change

Open `native/examples/binary-zero.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/binary-zero.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
A\0B
```

With

```cpp
A\0\0
```

Rerun the terminal command. Compare bytes= and zeros=. Why does a zero byte change the second count without ending the loop?

## A Unicode boundary is not an arbitrary byte position

Before this chapter: [An independent byte fixture defines the encoding](../binary-codecs/README.md)

UTF-8 uses continuation bytes for multibyte code points. A byte-oriented storage format can count bytes while still requiring valid text at field boundaries. Never assume a maximum byte count can be enforced by cutting at that position blindly.

This fixture exposes the two bytes of one code point; full validation also checks overlong encodings, surrogates, and maximum scalar values.

[Open figure: A byte offset can fall inside one UTF-8 scalar](../../diagrams/text-byte-slices.html)

Why is offset 1 not the start of another character in ë?

Why is offset 1 not the start of another character in ë? One scalar, two UTF-8 bytes. ë uses byte offsets 0 through 1: C3, AB. The starter prints lead=c3 and continuation=ab. Indexing std::string accesses code units; an arbitrary byte slice need not be valid UTF-8 or align with grapheme boundaries.

The starter prints lead=c3 and continuation=ab. Indexing std::string accesses code units; an arbitrary byte slice need not be valid UTF-8 or align with grapheme boundaries.

```cpp
#include <iomanip>
#include <iostream>
#include <string>

int main() {
    std::string text = "ë";
    std::cout << "bytes=" << text.size() << " lead=" << std::hex
              << unsigned(static_cast<unsigned char>(text[0]))
              << " continuation=" << unsigned(static_cast<unsigned char>(text[1]))
              << "\n";
}

```

Original program output:

```text
bytes=2 lead=c3 continuation=ab
```

The two-byte sequence must remain together when forming a valid text field.

Pitfall: Checking only that continuation bytes have the right prefix is not complete UTF-8 validation.

Question: Can either individual byte represent this character alone?

1. Yes
2. Only after changing the locale
3. No

Answer: 3. The code point is encoded by the complete multibyte sequence.

### Run the starter, then try a change

Open `native/examples/text-byte-slices.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/text-byte-slices.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::string text = "ë";
```

With

```cpp
std::string text = "€";
```

Rerun the terminal command. Compare bytes= and the first two bytes. The program prints only those two byte values. Does its byte count report another byte?

## Keep logical names separate from host path rules

Before this chapter: [An independent byte fixture defines the encoding](../binary-codecs/README.md)

Paths are host interfaces with rules about separators, case, encoding, and replacement behavior. A portable storage design can restrict logical names and implement host adaptation separately. Lexical normalization is not a security proof that a path stays inside a filesystem root.

This native lesson normalizes a path without asserting identical filesystem case behavior across hosts.

```cpp
#include <filesystem>
#include <iostream>

int main() {
    std::filesystem::path path("logs/../people.cpf");
    std::cout << path.lexically_normal().generic_string() << "\n";
}

```

Original program output:

```text
people.cpf
```

The lexical parent component cancels logs. No filesystem lookup or symlink resolution is performed.

Pitfall: A symlink can make lexical containment differ from actual filesystem resolution.

Question: Does lexically_normal resolve symlinks?

1. Yes
2. Only for relative paths
3. No

Answer: 3. It transforms path syntax without querying the filesystem.

### Run the starter, then try a change

Open `native/examples/path-contracts.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/path-contracts.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
logs/../people.cpf
```

With

```cpp
logs/../backup/people.cpf
```

Rerun the terminal command. Compare the normalized paths. Which components are removed without checking whether either path exists?

## EOF is a stream state, not a stored byte

Before this chapter: [An independent byte fixture defines the encoding](../binary-codecs/README.md)

A stream read can fail because it reached the end or because an I/O error occurred. A parser should distinguish successful extraction of the final value from the subsequent failed read that establishes EOF.

Checking eof before reading does not predict whether the next read succeeds. Drive processing from the extraction operation itself.

```cpp
#include <iostream>
#include <sstream>

int main() {
    std::istringstream input("AB");
    char value;
    unsigned count = 0;
    while (input.get(value))
        ++count;
    std::cout << "count=" << count << " eof=" << input.eof() << " bad=" << input.bad()
              << "\n";
}

```

Original program output:

```text
count=2 eof=1 bad=0
```

Two successful reads process A and B. The next attempt reaches end-of-input without a bad I/O state.

Pitfall: while(!stream.eof()) can process stale data after a failed extraction.

Question: What controls this loop?

1. A pre-read eof prediction
2. Whether extraction succeeds
3. The last character being zero

Answer: 2. Only a successful read contributes a processed byte.

### Run the starter, then try a change

Open `native/examples/eof-state.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/eof-state.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
input("AB")
```

With

```cpp
input("")
```

Rerun the terminal command. Compare count=, eof= and bad=. How does clean input exhaustion differ from an input error?

## Chapter project

Exchange a documented fixture between two native hosts.
