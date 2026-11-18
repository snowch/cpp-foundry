# Build a persistent record store

Connect value types, validation, byte formats, and file ownership.

## Represent rows as owning values

Before this chapter: [Weighted shortest paths require a compatible algorithm](../graphs/README.md)

A record groups fields describing one item; an ID is the field used to identify it. CRUD abbreviates create, read, update, and delete. Persistence means retaining state beyond the current run; this project writes a whole-file snapshot rather than a production database.

A database row is a domain value, not a pointer into an editor or input buffer. Give it owning fields, then define the rules for a valid row. The capstone uses a positive uint32 ID, a name of 1–63 UTF-8 bytes, and a score from 0 to 100.

Representability and domain validity are different checks. Zero fits in uint32_t, but the application rejects it as an ID. A useful validation function can be reused at the parser, insertion, and file-import boundaries.

```cpp
#include <cstdint>
#include <iostream>
#include <string>
struct Row { std::uint32_t id; std::string name; unsigned score; };
bool valid(const Row& row) {
    return row.id != 0 && !row.name.empty() && row.name.size() <= 63 && row.score <= 100;
}
int main() {
    const Row good{1,"Ada",90};
    const Row bad{0,"",101};
    std::cout << "good=" << valid(good) << '\n';
    std::cout << "bad=" << valid(bad) << '\n';
}
```

Original program output:

```text
good=1
bad=0
```

This example checks the shape and scalar bounds. The complete capstone additionally validates UTF-8 and rejects control characters in names before accepting a row.

Pitfall: std::string::size counts bytes, not Unicode characters. Choose and document which limit your file format enforces.

Question: What does name.size() count?

1. Bytes stored in the string
2. Unicode characters in every encoding
3. Words

Answer: 1. std::string is a sequence of char units; the capstone explicitly treats those units as UTF-8 bytes.

### Run the starter, then try a change

Open `native/examples/row-model.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/row-model.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
Row bad{0,"",101}
```

With

```cpp
Row bad{2,"",90}
```

Rerun the terminal command. Compare good= and bad=. Can a row with a permitted ID and score still fail validation?

## Uniqueness and updates are contracts

Before this chapter: [Weighted shortest paths require a compatible algorithm](../graphs/README.md)

New terms and notation:

A transaction groups tentative operations into one change with an explicit commit or rollback. Commit attempts to publish the change; rollback abandons it. Exactly what isolation and durability are promised depends on the model being taught.

An insert should distinguish a new row from a duplicate ID. An update should distinguish an existing row from a missing one. Those are observable API decisions, not incidental details of the underlying container.

An ordered map gives this first store unique IDs and deterministic listing. It is an in-memory index, not a disk B-tree. The capstone serializes the complete bounded table when saving; it does not claim page-level updates or transactions.

```cpp
#include <iostream>
#include <map>
#include <string>
struct Row { std::string name; unsigned score; };
int main() {
    std::map<unsigned,Row> rows;
    auto inserted = rows.try_emplace(1,Row{"Ada",90});
    auto duplicate = rows.try_emplace(1,Row{"Wrong",0});
    std::cout << "inserted=" << inserted.second << '\n';
    std::cout << "duplicate=" << !duplicate.second << '\n';
    if (auto found = rows.find(1); found != rows.end()) found->second.score = 95;
    std::cout << rows.at(1).name << ' ' << rows.at(1).score << '\n';
    std::cout << "removed=" << rows.erase(1) << '\n';
    std::cout << "count=" << rows.size() << '\n';
}
```

Original program output:

```text
inserted=1
duplicate=1
Ada 95
removed=1
count=0
```

try_emplace preserves the first row on duplicate insertion. find checks existence before mutation, and erase reports the number removed.

Pitfall: A convenient container operation can violate your domain contract: insert_or_assign would replace a duplicate, while operator[] could create a missing row during an update.

Question: Which insertion preserves an existing row?

1. try_emplace
2. insert_or_assign
3. operator[] followed by assignment

Answer: 1. try_emplace reports the duplicate and leaves its mapped value unchanged.

### Run the starter, then try a change

Open `native/examples/crud.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/crud.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
found->second.score = 95
```

With

```cpp
found->second.score = 97
```

Rerun the terminal command. Compare the printed Ada row and the final count=. Which value does update replace, and what does erase remove?

## Define bytes independently of object layout

Before this chapter: [Weighted shortest paths require a compatible algorithm](../graphs/README.md)

Never persist a C++ object by writing sizeof(object) bytes. Padding, endianness, pointer fields, and library object layout do not form a portable file format. Define the field widths, byte order, and validation rules explicitly.

The capstone uses a CPF1 magic header, a little-endian uint32 row count, and rows containing ID, score, a one-byte name length, and UTF-8 bytes. Imports reject duplicates, invalid fields, truncation, excess rows, and trailing bytes before replacing live state.

```cpp
#include <array>
#include <cstdint>
#include <iostream>
std::array<unsigned char,4> encode(std::uint32_t value) {
    std::array<unsigned char,4> result{};
    for (unsigned i=0;i<4;++i) result[i]=static_cast<unsigned char>((value>>(8*i))&255u);
    return result;
}
std::uint32_t decode(const std::array<unsigned char,4>& bytes) {
    std::uint32_t value=0;
    for (unsigned i=0;i<4;++i) value |= std::uint32_t(bytes[i]) << (8*i);
    return value;
}
int main() {
    auto bytes=encode(0x12345678u);
    for (auto byte:bytes) std::cout << std::hex << unsigned(byte) << ' ';
    std::cout << "\nroundtrip=" << (decode(bytes)==0x12345678u) << '\n';
}
```

Original program output:

```text
78 56 34 12 
roundtrip=1
```

The low byte is written first, regardless of the host’s native endianness. Converting each byte to uint32_t before shifting avoids signed promotion surprises.

Pitfall: A roundtrip test alone can miss a shared encoder/decoder bug. Also compare against independently specified exact bytes.

Question: Why test exact bytes as well as roundtrips?

1. Both functions could share the same mistake
2. Exact bytes are faster to compile
3. Roundtrips require threads

Answer: 1. Independent format expectations catch a pair of functions that agree with each other but violate the external contract.

### Run the starter, then try a change

Open `native/examples/byte-format.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/byte-format.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace both occurrences of

```cpp
0x12345678u
```

With

```cpp
0x12345679u
```

Rerun the terminal command. Compare the bytes and roundtrip=. Which byte changes when the least significant byte increases?

## Close, reopen, and validate

Before this chapter: [Weighted shortest paths require a compatible algorithm](../graphs/README.md)

A file stream owns a file handle. Check opening and writing, then check close explicitly when publishing output: destructors cannot conveniently report a late close failure. Read into a candidate collection so a rejected import does not partially overwrite current state.

This example demonstrates reopening a temporary lesson file. The Workbench runs the complete capstone against people.cpf and saves that file in IndexedDB after successful runs. Browser storage is separate from native filesystem durability; download a backup for work you want to keep.

```cpp
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
int main() {
    {
        std::ofstream out("snapshot.txt",std::ios::binary|std::ios::trunc);
        if (!out) throw std::runtime_error("open failed");
        out << "1 Ada 90\n";
        out.close();
        if (!out) throw std::runtime_error("write or close failed");
    }
    std::ifstream in("snapshot.txt",std::ios::binary);
    std::string line;
    if (!std::getline(in,line)) throw std::runtime_error("read failed");
    std::cout << "reopened: " << line << '\n';
}
```

Original program output:

```text
reopened: 1 Ada 90
```

The writer is closed before the reader opens the file. In the capstone, SAVE writes a candidate file and publishes it with rename; LOAD validates the complete binary format before swapping tables.

Pitfall: An ofstream close followed by rename is not a power-loss durability protocol. Native sync and directory-publication behavior depend on the host; the browser adds its own storage layer.

Question: Does this example prove power-loss durability?

1. No, it proves the demonstrated reopen behavior
2. Yes, because binary mode is enabled
3. Yes, because the stream uses RAII

Answer: 1. Durability requires a documented platform and failure model beyond the C++ stream abstraction.

### Run the starter, then try a change

Open `native/examples/persistence.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/persistence.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
1 Ada 90\n
```

With

```cpp
1 Ada 95\n
```

Rerun the terminal command. Compare the reopened line. What shows that the program reads back the bytes it wrote in the same run?

## Chapter project

Extend the working record store in the Workbench.
