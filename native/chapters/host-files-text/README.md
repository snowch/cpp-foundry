# Files, text, and host boundaries

Distinguish byte formats, text conventions, names, and host behavior.

## Normalize line endings at a text boundary

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

Expected output:

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

Experiment: Test empty lines and a final line without a terminator. Document whether embedded carriage returns are valid payload or rejected controls.

## Binary payloads can contain zero bytes

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

Expected output:

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

Experiment: Write and reopen the same three bytes in binary mode. Compare exact bytes and distinguish end-of-file from a zero byte.

## A Unicode boundary is not an arbitrary byte position

UTF-8 uses continuation bytes for multibyte code points. A byte-oriented storage format can count bytes while still requiring valid text at field boundaries. Never assume a maximum byte count can be enforced by cutting at that position blindly.

This fixture exposes the two bytes of one code point; full validation also checks overlong encodings, surrogates, and maximum scalar values.

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

Expected output:

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

Experiment: Inspect a three-byte and a four-byte code point. Compare valid boundaries with the capstone’s byte-length limit.

## Keep logical names separate from host path rules

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

Expected output:

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

Experiment: Define allowed database basenames and reject traversal components before passing names to a host adapter.

## EOF is a stream state, not a stored byte

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

Expected output:

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

Experiment: Test empty input and inject an error state in a separate stream fixture. Specify which failures may retain a previous candidate.

## Chapter project

Exchange a documented fixture between two native hosts.
