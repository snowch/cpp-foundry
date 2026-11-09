# Audit the storage boundary

Turn portability assumptions and rejection rules into executable checks.

## Make byte-width assumptions executable

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

Expected output:

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

Experiment: List every additional assumption the capstone makes beyond these scalar widths and assign each an appropriate check.

## Compare against independently specified file bytes

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

Expected output:

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

Experiment: Export a CPF1 file on two hosts and run both consumers against both files. Retain the exact bytes and toolchain versions.

## Reject unsupported headers before allocating row storage

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

Expected output:

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

Experiment: Test short headers and unrelated magic values. Verify no table-allocation or mutation callback runs for rejected headers.

## Audit bounds checks for overflow in the checks themselves

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

Expected output:

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

Experiment: Enumerate small size/offset/length combinations and compare with an arbitrary-precision mathematical oracle.

## Uniqueness must be checked during import too

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

Expected output:

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

Experiment: Test duplicates at the beginning and end, and pair them with truncated payloads. Verify the entire live table remains unchanged.

## Complete consumption is part of format validation

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

Expected output:

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

Experiment: Append every one-byte suffix to a valid capstone fixture and verify each is rejected without changing the saved snapshot.

## Check host replacement behavior rather than assuming it

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

Expected output:

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

Experiment: Add checked candidate close and injected rename failure. Record Windows and POSIX adapter behavior separately.

## Keep implementation, tests, and guarantees separate

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

Expected output:

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

Experiment: Write an audit table for CPF1 covering numeric fields, UTF-8, close failure, rename, browser storage, stale tabs, and crash behavior.

## Chapter project

Audit the CPF1 capstone and record the limits of each host adapter.
