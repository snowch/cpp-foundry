# Audit the storage boundary

Turn portability assumptions and rejection rules into executable checks.

## Make byte-width assumptions executable

Before this chapter: [Keep logical names separate from host path rules](../host-files-text/README.md)

An audit turns an assumed storage rule into an explicit question and an executable check. A fixture is a deliberately chosen test input with an independently specified expected result. Rejection preservation means an invalid import cannot replace valid stored state.

A byte format defined in octets requires eight-bit char units and the stated fixed-width integer types. Reject unsupported implementations at compile time rather than silently writing a different format.

These checks establish scalar representation assumptions only. Filesystem atomicity, durability, encoding, and concurrency remain separate contracts.

```cpp
#include <climits>
#include <cstdint>
#include <iostream>
#include <limits>

int main() {
    static_assert(CHAR_BIT==8);static_assert(std::numeric_limits<std::uint32_t>::digits==32);
    std::cout<<"octets=8 uint32=32\n";
}

```

Original program output:

```text
octets=8 uint32=32
```

The selected implementation satisfies the explicit CPF1 scalar requirements.

Pitfall: A fixed-width integer declaration does not specify file byte order automatically.

Question: What does this assertion establish?

1. Power-loss durability
2. All input-file validity
3. The selected implementation’s scalar widths

Answer: 3. It checks a compile-time implementation precondition.

### Run the starter, then try a change

Open `native/examples/audit-octets.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/audit-octets.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::cout<<"octets=8 uint32=32\n";
```

With

```cpp
std::cout << "octets=" << CHAR_BIT << " uint32=" << std::numeric_limits<std::uint32_t>::digits << "\n";
```

Rerun the terminal command. Compare the output. Which measured type properties supply the values behind the two requirements?

## Compare against independently specified file bytes

Before this chapter: [Keep logical names separate from host path rules](../host-files-text/README.md)

A portability audit should include an external byte fixture that every producer emits and every consumer accepts. A cross-host exchange matrix adds evidence that independent environments agree on the same contract.

This executable is one local exact-byte check. It is not presented as a completed matrix across operating systems that have not been tested.

```cpp
#include <array>
#include <cstdint>
#include <iostream>

int main() {
    std::uint32_t value = 256;
    std::array<unsigned char, 4> actual{};
    for (unsigned i = 0; i < 4; ++i)
        actual[i] = static_cast<unsigned char>((value >> (8 * i)) & 255u);
    const std::array<unsigned char, 4> expected{0, 1, 0, 0};
    std::cout << "fixture=" << (actual == expected) << "\n";
    return actual == expected ? 0 : 1;
}

```

Original program output:

```text
fixture=1
```

The literal fixture identifies little-endian 256 without consulting the decoder.

Pitfall: Calling a local roundtrip a cross-host compatibility test overstates the evidence.

Question: What is still needed for a real exchange matrix?

1. Files from each producer tested by each consumer
2. Only a second call to the same encoder
3. A larger screenshot

Answer: 1. Independent hosts must actually exchange the format fixtures.

### Run the starter, then try a change

Open `native/examples/audit-endianness.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/audit-endianness.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
expected{0, 1, 0, 0}
```

With

```cpp
expected{0, 0, 1, 0}
```

Rerun the terminal command. Compare fixture= and exit status. The edit supplies the opposite byte-order expectation. Which order did the encoder write?

## Reject unsupported headers before allocating row storage

Before this chapter: [Keep logical names separate from host path rules](../host-files-text/README.md)

Header and count checks should occur before allocating resources based on untrusted fields. An unsupported magic or format version has no valid interpretation under the current decoder.

Failure preservation includes leaving the existing live table unchanged while reporting a rejected import.

```cpp
#include <array>
#include <iostream>

int main() {
    const std::array<unsigned char, 4> header{'C', 'P', 'F', '2'};
    bool accepted = header == std::array<unsigned char, 4>{'C', 'P', 'F', '1'};
    unsigned live_rows = 3;
    if (accepted)
        live_rows = 0;
    std::cout << "accepted=" << accepted << " retained=" << live_rows << "\n";
}

```

Original program output:

```text
accepted=0 retained=3
```

The future-version header is rejected before the live row count is touched.

Pitfall: Treating all versions as equivalent can misparse later fields and overwrite valid state.

Question: When should unsupported format rejection occur?

1. Before interpreting dependent fields
2. After replacing the live table
3. Only when printing rows fails

Answer: 1. Early format recognition establishes the decoding rules.

### Run the starter, then try a change

Open `native/examples/audit-header-rejection.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/audit-header-rejection.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
header{'C', 'P', 'F', '2'}
```

With

```cpp
header{'C', 'P', 'F', '1'}
```

Rerun the terminal command. Compare accepted= and retained=. At which decision does this simplified model replace its live row count?

## Audit bounds checks for overflow in the checks themselves

Before this chapter: [Keep logical names separate from host path rules](../host-files-text/README.md)

A check such as offset+length <= size can overflow before it compares. Establish offset <= size first, then require length <= size-offset. The reordered guard is meaningful only with that first precondition.

Use hostile boundary values in tests, including a maximum size_t length, instead of exercising only plausible small records.

```cpp
#include <cstddef>
#include <iostream>
#include <limits>

int main() {
    auto fits = [](std::size_t size, std::size_t offset, std::size_t length) {
        return offset <= size && length <= size - offset;
    };
    std::cout << fits(8, 4, 4) << " " << fits(8, 9, 0) << " "
              << fits(8, 1, std::numeric_limits<std::size_t>::max()) << "\n";
}

```

Original program output:

```text
1 0 0
```

The valid final four bytes fit. An out-of-range offset and a maximal length are rejected without wrapping an addition.

Pitfall: Subtracting before checking offset can replace an addition overflow bug with unsigned underflow.

Question: Which condition must precede size-offset?

1. length==0
2. offset is odd
3. offset<=size

Answer: 3. It proves the subtraction is representable in the intended range.

### Run the starter, then try a change

Open `native/examples/audit-length-arithmetic.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/audit-length-arithmetic.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
fits(8, 4, 4)
```

With

```cpp
fits(8, 4, 5)
```

Rerun the terminal command. Compare the first flag. How much space remains after offset 4 of an eight-byte buffer?

## Uniqueness must be checked during import too

Before this chapter: [Keep logical names separate from host path rules](../host-files-text/README.md)

An insertion API can enforce unique keys while a separate importer accidentally bypasses that rule. Every ingestion boundary must establish the same logical invariants before publishing state.

Build a candidate key set or table during import and reject a duplicate rather than silently overwriting the first payload.

```cpp
#include <iostream>
#include <set>
#include <vector>

int main() {
    const std::vector<unsigned> imported{1, 2, 1};
    std::set<unsigned> candidate;
    bool accepted = true;
    for (auto id : imported)
        if (!candidate.insert(id).second) {
            accepted = false;
            break;
        }
    unsigned live_count = 4;
    if (accepted)
        live_count = static_cast<unsigned>(candidate.size());
    std::cout << "accepted=" << accepted << " retained=" << live_count << "\n";
}

```

Original program output:

```text
accepted=0 retained=4
```

The third imported key is a duplicate, so the candidate is not published and the old live count remains four.

Pitfall: Using map[key]=row during import can conceal duplicate rows by replacing an earlier value.

Question: Should duplicate import overwrite the earlier row here?

1. No, the format contract rejects it
2. Yes, always
3. Only when the score is larger

Answer: 1. The importer must enforce the same uniqueness rule as insertion.

### Run the starter, then try a change

Open `native/examples/audit-duplicates.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/audit-duplicates.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
imported{1, 2, 1}
```

With

```cpp
imported{1, 2, 3}
```

Rerun the terminal command. Compare accepted= and retained=. When can the candidate’s count replace the live count?

## Complete consumption is part of format validation

Before this chapter: [Keep logical names separate from host path rules](../host-files-text/README.md)

A binary decoder must decide whether extra bytes after the documented record sequence are permitted. CPF1 rejects them, preventing an otherwise valid prefix from hiding unknown extensions or accidental concatenation.

Keep the cursor and input size as separate evidence at the final publication boundary.

```cpp
#include <cstddef>
#include <iostream>

int main() {
    auto complete = [](std::size_t consumed, std::size_t size) {
        return consumed == size;
    };
    std::cout << "exact=" << complete(8, 8) << " trailing=" << complete(8, 9) << "\n";
}

```

Original program output:

```text
exact=1 trailing=0
```

Exactly consuming the empty-table header is accepted; one extra byte violates the current format contract.

Pitfall: A decoder that ignores trailing bytes silently accepts a broader format than the writer and documentation define.

Question: When can the candidate be published?

1. After exact consumption and all other checks
2. After any valid prefix
3. Whenever the last byte is nonzero

Answer: 1. Complete-file validation is a prerequisite for publication.

### Run the starter, then try a change

Open `native/examples/audit-trailing-bytes.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/audit-trailing-bytes.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
complete(8, 9)
```

With

```cpp
complete(8, 10)
```

Rerun the terminal command. Compare exact= and trailing=. Can reading a complete prefix accept a file with two unconsumed bytes?

## Check host replacement behavior rather than assuming it

Before this chapter: [Keep logical names separate from host path rules](../host-files-text/README.md)

Snapshot publication often writes a candidate and renames it over an existing destination. Whether that replacement succeeds is a host-interface contract, not a universal consequence of using C++ streams.

This native POSIX fixture checks replacement and reopening on the selected host. A portable Windows adapter may need a different publication operation; neither path alone proves crash durability.

```cpp
#include <cstdio>
#include <fstream>
#include <iostream>
#include <string>

int main() {
    {std::ofstream old("current.txt");old<<"old";}
    {std::ofstream next("candidate.txt");next<<"new";}
    if(std::rename("candidate.txt","current.txt")!=0)return 1;
    std::ifstream input("current.txt");std::string value;input>>value;
    std::cout<<value<<"\n";return value=="new"?0:1;
}

```

Original program output:

```text
new
```

The host reports successful replacement, and reopening returns the candidate’s contents.

Pitfall: A checked rename is not equivalent to syncing file contents and the containing directory for a specified failure model.

Question: What does this run establish?

1. Replacement/reopen behavior on this host
2. All-host power-loss durability
3. Atomic multi-file transactions

Answer: 1. The evidence is scoped to the actual host operation exercised.

### Run the starter, then try a change

Open `native/examples/audit-rename.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/audit-rename.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
next<<"new";
```

With

```cpp
next<<"next";
```

Rerun the terminal command. Compare the printed text and exit status. The starter explicitly checks for new, so the file operation can succeed while that program check returns 1. Which text did the renamed file contain?

## Keep implementation, tests, and guarantees separate

Before this chapter: [Keep logical names separate from host path rules](../host-files-text/README.md)

A useful audit lists each promised behavior and the evidence supporting it. “Implemented,” “tested on one host,” and “qualified across hosts” describe different levels of evidence. A finite happy-path suite cannot establish a power-loss guarantee.

This release gate fails if a required check is absent; it does not automatically promote untested assumptions into guarantees.

```cpp
#include <array>
#include <iostream>
#include <string_view>

struct Check {
    std::string_view name;
    bool required;
    bool passed;
};

int main() {
    const std::array<Check, 3> checks{{{"exact bytes", true, true},
                                       {"rejected import", true, true},
                                       {"power loss", false, false}}};
    unsigned required_missing = 0;
    for (const auto &check : checks) {
        if (check.required && !check.passed)
            ++required_missing;
        std::cout << check.name << ":" << (check.passed ? "checked" : "not qualified")
                  << "\n";
    }
    return required_missing ? 1 : 0;
}

```

Original program output:

```text
exact bytes:checked
rejected import:checked
power loss:not qualified
```

The two required local checks pass; the unsupported power-loss claim remains explicitly unqualified.

Pitfall: Turning a limitation into a passing Boolean does not create supporting evidence.

Question: What should happen to an unqualified durability claim?

1. It is assumed true after compilation
2. It is hidden from the audit
3. It remains outside the stated guarantees

Answer: 3. A guarantee needs an explicit failure model and relevant evidence.

### Run the starter, then try a change

Open `native/examples/audit-evidence.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/audit-evidence.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
{"rejected import", true, true}
```

With

```cpp
{"rejected import", true, false}
```

Rerun the terminal command. Compare the row’s qualification label and process status. Which requirement makes an unqualified result fail this audit?

## Chapter project

Audit the CPF1 capstone and record the limits of each host adapter.
