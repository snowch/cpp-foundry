# Redo logging and recovery

Validate complete records and recover only committed work.

## Define a log record independently of memory layout

Before this chapter: [Publish a complete candidate at commit](../transactions/README.md)

Recovery reconstructs an accepted state after an interruption. A redo record describes a change to re-apply; a commit marker distinguishes finished work from an incomplete transaction. A torn record is one only partly present in the available bytes.

A redo record needs a documented encoding before recovery can interpret it. This bounded single-value model uses seven bytes: tag, transaction ID, four little-endian value bytes, and a one-byte XOR check.

The XOR check is a teaching integrity mechanism with collisions, not a production checksum or authentication primitive. The model does not implement a multi-row database log.

```cpp
#include <iostream>
#include <map>
#include <span>
#include <vector>

using Bytes = std::vector<unsigned char>;
Bytes record(unsigned char tag, unsigned char transaction, unsigned value) {
    Bytes bytes{tag, transaction};
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
    unsigned char checksum = 0;
    for (auto byte : bytes)
        checksum ^= byte;
    bytes.push_back(checksum);
    return bytes;
}
void append(Bytes &log, const Bytes &bytes) {
    log.insert(log.end(), bytes.begin(), bytes.end());
}
struct Recovery {
    unsigned value = 0;
    std::size_t valid_bytes = 0;
    bool tail = false;
};
Recovery recover(std::span<const unsigned char> log, unsigned initial = 0) {
    Recovery result{initial, 0, false};
    std::map<unsigned, unsigned> pending;
    while (log.size() - result.valid_bytes >= 7) {
        auto at = result.valid_bytes;
        unsigned char checksum = 0;
        for (unsigned i = 0; i < 6; ++i)
            checksum ^= log[at + i];
        auto tag = log[at], transaction = log[at + 1];
        if (checksum != log[at + 6] || (tag != 'P' && tag != 'C'))
            break;
        unsigned value = 0;
        for (unsigned i = 0; i < 4; ++i)
            value |= unsigned(log[at + 2 + i]) << (i * 8);
        if (tag == 'P')
            pending[transaction] = value;
        else if (auto found = pending.find(transaction); found != pending.end()) {
            result.value = found->second;
            pending.erase(found);
        }
        result.valid_bytes += 7;
    }
    result.tail = result.valid_bytes != log.size();
    return result;
}

int main() {
    auto bytes = record('P', 1, 42);
    std::cout << "bytes=" << bytes.size() << " value-low=" << unsigned(bytes[2])
              << "\n";
}

```

Original program output:

```text
bytes=7 value-low=42
```

The value’s low byte is at offset two, and every encoded record has the same seven-byte size.

Pitfall: Writing a C++ struct directly would introduce padding and host-layout assumptions into recovery.

Question: How is the value encoded?

1. The native unsigned object representation
2. Four explicit little-endian bytes
3. A pointer to a live value

Answer: 2. The record layout is independent of the process object layout.

### Run the starter, then try a change

Open `native/examples/wal-records.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/wal-records.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
record('P', 1, 42)
```

With

```cpp
record('P', 1, 300)
```

Rerun the terminal command. Compare bytes= and value-low=. What part of a 32-bit value fits in one byte?

## Recover only values with a complete commit marker

Before this chapter: [Publish a complete candidate at commit](../transactions/README.md)

A complete update record is not evidence that its transaction committed. Recovery should retain tentative redo until a valid commit marker authorizes publication. Uncommitted tail work is ignored.

This model remembers one pending value per transaction ID. Transaction IDs are bounded fixture identifiers and are not reused across an unresolved transaction.

```cpp
#include <iostream>
#include <map>
#include <span>
#include <vector>

using Bytes = std::vector<unsigned char>;
Bytes record(unsigned char tag, unsigned char transaction, unsigned value) {
    Bytes bytes{tag, transaction};
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
    unsigned char checksum = 0;
    for (auto byte : bytes)
        checksum ^= byte;
    bytes.push_back(checksum);
    return bytes;
}
void append(Bytes &log, const Bytes &bytes) {
    log.insert(log.end(), bytes.begin(), bytes.end());
}
struct Recovery {
    unsigned value = 0;
    std::size_t valid_bytes = 0;
    bool tail = false;
};
Recovery recover(std::span<const unsigned char> log, unsigned initial = 0) {
    Recovery result{initial, 0, false};
    std::map<unsigned, unsigned> pending;
    while (log.size() - result.valid_bytes >= 7) {
        auto at = result.valid_bytes;
        unsigned char checksum = 0;
        for (unsigned i = 0; i < 6; ++i)
            checksum ^= log[at + i];
        auto tag = log[at], transaction = log[at + 1];
        if (checksum != log[at + 6] || (tag != 'P' && tag != 'C'))
            break;
        unsigned value = 0;
        for (unsigned i = 0; i < 4; ++i)
            value |= unsigned(log[at + 2 + i]) << (i * 8);
        if (tag == 'P')
            pending[transaction] = value;
        else if (auto found = pending.find(transaction); found != pending.end()) {
            result.value = found->second;
            pending.erase(found);
        }
        result.valid_bytes += 7;
    }
    result.tail = result.valid_bytes != log.size();
    return result;
}

int main() {
    Bytes log;
    append(log, record('P', 1, 42));
    std::cout << "before=" << recover(log).value;
    append(log, record('C', 1, 0));
    std::cout << " after=" << recover(log).value << "\n";
}

```

Original program output:

```text
before=0 after=42
```

The update alone leaves the recovered committed value at zero. Adding the complete marker makes forty-two visible.

Pitfall: Applying every valid update record during recovery can expose transactions that never committed.

Question: What authorizes publication in this model?

1. Any update tag
2. A complete valid commit marker
3. A successful allocation

Answer: 2. Tentative redo is distinct from committed redo.

### Run the starter, then try a change

Open `native/examples/wal-commit-marker.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/wal-commit-marker.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
append(log, record('C', 1, 0));
```

With

```cpp
append(log, record('C', 2, 0));
```

Rerun the terminal command. Compare before= and after=. Does a commit for transaction 2 make transaction 1’s prepared value visible?

## A truncated final record is not a complete record

Before this chapter: [Publish a complete candidate at commit](../transactions/README.md)

A crash can leave a log ending inside a record. Recovery scans only complete validated records and reports that bytes remain after the accepted prefix. It must not synthesize missing bytes from zero-filled memory.

This is a prefix-recovery model; it does not claim that arbitrary storage-device damage obeys a simple prefix failure model.

[Open figure: A complete prepare record is not a commit](../../diagrams/wal-torn-tail.html)

Why must the torn commit tail leave the update unpublished?

Why must the torn commit tail leave the update unpublished? Log region; Validation / decision; Recovery effect. P(tx 1,value 42); Complete valid prepare record; Remember tentative value only; C(tx 1); Last byte missing: incomplete tail; No complete commit decision; Recovered state; Keep earlier committed value; Do not publish tentative 42. . . Recovery accepts only the validated committed prefix. The lesson uses a single-value redo model and does not specify production fsync ordering or corruption repair.

Recovery accepts only the validated committed prefix. The lesson uses a single-value redo model and does not specify production fsync ordering or corruption repair.

```cpp
#include <iostream>
#include <map>
#include <span>
#include <vector>

using Bytes = std::vector<unsigned char>;
Bytes record(unsigned char tag, unsigned char transaction, unsigned value) {
    Bytes bytes{tag, transaction};
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
    unsigned char checksum = 0;
    for (auto byte : bytes)
        checksum ^= byte;
    bytes.push_back(checksum);
    return bytes;
}
void append(Bytes &log, const Bytes &bytes) {
    log.insert(log.end(), bytes.begin(), bytes.end());
}
struct Recovery {
    unsigned value = 0;
    std::size_t valid_bytes = 0;
    bool tail = false;
};
Recovery recover(std::span<const unsigned char> log, unsigned initial = 0) {
    Recovery result{initial, 0, false};
    std::map<unsigned, unsigned> pending;
    while (log.size() - result.valid_bytes >= 7) {
        auto at = result.valid_bytes;
        unsigned char checksum = 0;
        for (unsigned i = 0; i < 6; ++i)
            checksum ^= log[at + i];
        auto tag = log[at], transaction = log[at + 1];
        if (checksum != log[at + 6] || (tag != 'P' && tag != 'C'))
            break;
        unsigned value = 0;
        for (unsigned i = 0; i < 4; ++i)
            value |= unsigned(log[at + 2 + i]) << (i * 8);
        if (tag == 'P')
            pending[transaction] = value;
        else if (auto found = pending.find(transaction); found != pending.end()) {
            result.value = found->second;
            pending.erase(found);
        }
        result.valid_bytes += 7;
    }
    result.tail = result.valid_bytes != log.size();
    return result;
}

int main() {
    Bytes log;
    append(log, record('P', 1, 42));
    auto commit = record('C', 1, 0);
    log.insert(log.end(), commit.begin(), commit.end() - 1);
    auto result = recover(log);
    std::cout << "value=" << result.value << " valid=" << result.valid_bytes
              << " tail=" << result.tail << "\n";
}

```

Original program output:

```text
value=0 valid=7 tail=1
```

The update is accepted into tentative state, but the six-byte commit prefix cannot authorize publication.

Pitfall: Continuing past a malformed record without a resynchronization contract can misinterpret payload bytes as new records.

Question: Is a six-byte commit prefix sufficient?

1. Yes, because its tag is present
2. No
3. Only if the file size is even

Answer: 2. The fixed record and its check must be complete.

### Run the starter, then try a change

Open `native/examples/wal-torn-tail.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/wal-torn-tail.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
commit.end() - 1
```

With

```cpp
commit.end()
```

Rerun the terminal command. Compare value=, valid= and tail=. What changes once the final byte of the record is available?

## Stop at an invalid integrity boundary

Before this chapter: [Publish a complete candidate at commit](../transactions/README.md)

Recovery should validate a record before applying its meaning. A changed byte can invalidate the record’s integrity check, forcing a stop at the earlier accepted prefix.

A one-byte XOR check detects this fixture’s single-bit change but not every possible corruption. Distinguish a demonstration of validation ordering from a claim about production error-detection strength.

```cpp
#include <iostream>
#include <map>
#include <span>
#include <vector>

using Bytes = std::vector<unsigned char>;
Bytes record(unsigned char tag, unsigned char transaction, unsigned value) {
    Bytes bytes{tag, transaction};
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
    unsigned char checksum = 0;
    for (auto byte : bytes)
        checksum ^= byte;
    bytes.push_back(checksum);
    return bytes;
}
void append(Bytes &log, const Bytes &bytes) {
    log.insert(log.end(), bytes.begin(), bytes.end());
}
struct Recovery {
    unsigned value = 0;
    std::size_t valid_bytes = 0;
    bool tail = false;
};
Recovery recover(std::span<const unsigned char> log, unsigned initial = 0) {
    Recovery result{initial, 0, false};
    std::map<unsigned, unsigned> pending;
    while (log.size() - result.valid_bytes >= 7) {
        auto at = result.valid_bytes;
        unsigned char checksum = 0;
        for (unsigned i = 0; i < 6; ++i)
            checksum ^= log[at + i];
        auto tag = log[at], transaction = log[at + 1];
        if (checksum != log[at + 6] || (tag != 'P' && tag != 'C'))
            break;
        unsigned value = 0;
        for (unsigned i = 0; i < 4; ++i)
            value |= unsigned(log[at + 2 + i]) << (i * 8);
        if (tag == 'P')
            pending[transaction] = value;
        else if (auto found = pending.find(transaction); found != pending.end()) {
            result.value = found->second;
            pending.erase(found);
        }
        result.valid_bytes += 7;
    }
    result.tail = result.valid_bytes != log.size();
    return result;
}

int main() {
    Bytes log;
    append(log, record('P', 1, 42));
    append(log, record('C', 1, 0));
    log[2] ^= 1;
    auto result = recover(log);
    std::cout << "valid=" << result.valid_bytes << " value=" << result.value
              << " tail=" << result.tail << "\n";
}

```

Original program output:

```text
valid=0 value=0 tail=1
```

The first record fails its check, so neither it nor later records are interpreted under an unsupported resynchronization assumption.

Pitfall: A checksum that detects some errors is not proof that all corruption or adversarial edits are detected.

Question: When is a record applied?

1. After its complete encoding validates
2. Before checking its final byte
3. Whenever its tag looks familiar

Answer: 1. Validation precedes state effects.

### Run the starter, then try a change

Open `native/examples/wal-corrupt-record.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/wal-corrupt-record.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
log[2] ^= 1;
```

With

```cpp
log[9] ^= 1;
```

Rerun the terminal command. Compare valid=, value= and tail=. How many bytes does recovery accept when the first damaged record is the commit?

## Associate redo with the correct transaction

Before this chapter: [Publish a complete candidate at commit](../transactions/README.md)

Interleaved update records need transaction identity so one transaction’s commit does not publish another’s pending state. Recovery groups tentative values by transaction ID before processing commit markers.

The fixture is serialized log interpretation, not concurrent file writing. The writer side still needs an ordering and synchronization contract.

```cpp
#include <iostream>
#include <map>
#include <span>
#include <vector>

using Bytes = std::vector<unsigned char>;
Bytes record(unsigned char tag, unsigned char transaction, unsigned value) {
    Bytes bytes{tag, transaction};
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
    unsigned char checksum = 0;
    for (auto byte : bytes)
        checksum ^= byte;
    bytes.push_back(checksum);
    return bytes;
}
void append(Bytes &log, const Bytes &bytes) {
    log.insert(log.end(), bytes.begin(), bytes.end());
}
struct Recovery {
    unsigned value = 0;
    std::size_t valid_bytes = 0;
    bool tail = false;
};
Recovery recover(std::span<const unsigned char> log, unsigned initial = 0) {
    Recovery result{initial, 0, false};
    std::map<unsigned, unsigned> pending;
    while (log.size() - result.valid_bytes >= 7) {
        auto at = result.valid_bytes;
        unsigned char checksum = 0;
        for (unsigned i = 0; i < 6; ++i)
            checksum ^= log[at + i];
        auto tag = log[at], transaction = log[at + 1];
        if (checksum != log[at + 6] || (tag != 'P' && tag != 'C'))
            break;
        unsigned value = 0;
        for (unsigned i = 0; i < 4; ++i)
            value |= unsigned(log[at + 2 + i]) << (i * 8);
        if (tag == 'P')
            pending[transaction] = value;
        else if (auto found = pending.find(transaction); found != pending.end()) {
            result.value = found->second;
            pending.erase(found);
        }
        result.valid_bytes += 7;
    }
    result.tail = result.valid_bytes != log.size();
    return result;
}

int main() {
    Bytes log;
    append(log, record('P', 1, 10));
    append(log, record('P', 2, 20));
    append(log, record('C', 1, 0));
    std::cout << "committed=" << recover(log).value << "\n";
}

```

Original program output:

```text
committed=10
```

Transaction two remains pending while transaction one’s committed value becomes visible.

Pitfall: One global pending slot would let the second update overwrite the state associated with the first transaction’s marker.

Question: Which value does transaction one’s marker publish?

1. The most recent update from any transaction
2. Its own pending value ten
3. Both values at once

Answer: 2. Recovery retains pending state by transaction identity.

### Run the starter, then try a change

Open `native/examples/wal-interleaving.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/wal-interleaving.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
append(log, record('C', 1, 0));
```

With

```cpp
append(log, record('C', 1, 0)); append(log, record('C', 2, 0));
```

Rerun the terminal command. Compare committed=. Which value becomes visible after recovery sees the later commit?

## Redo should tolerate repeating already applied work

Before this chapter: [Publish a complete candidate at commit](../transactions/README.md)

New terms and notation:

An operation is idempotent when applying it again has the same relevant effect as applying it once. Recovery protocols may need this property when replay can repeat an already applied record.

Recovery may run more than once. Redo records that assign a known value are naturally idempotent: applying the same assignment again does not increment it twice. Other operation forms need explicit sequence or applied-position checks.

This one-value fixture demonstrates assignment redo. It does not establish idempotence for arbitrary user-defined operations.

```cpp
#include <iostream>
#include <map>
#include <span>
#include <vector>

using Bytes = std::vector<unsigned char>;
Bytes record(unsigned char tag, unsigned char transaction, unsigned value) {
    Bytes bytes{tag, transaction};
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
    unsigned char checksum = 0;
    for (auto byte : bytes)
        checksum ^= byte;
    bytes.push_back(checksum);
    return bytes;
}
void append(Bytes &log, const Bytes &bytes) {
    log.insert(log.end(), bytes.begin(), bytes.end());
}
struct Recovery {
    unsigned value = 0;
    std::size_t valid_bytes = 0;
    bool tail = false;
};
Recovery recover(std::span<const unsigned char> log, unsigned initial = 0) {
    Recovery result{initial, 0, false};
    std::map<unsigned, unsigned> pending;
    while (log.size() - result.valid_bytes >= 7) {
        auto at = result.valid_bytes;
        unsigned char checksum = 0;
        for (unsigned i = 0; i < 6; ++i)
            checksum ^= log[at + i];
        auto tag = log[at], transaction = log[at + 1];
        if (checksum != log[at + 6] || (tag != 'P' && tag != 'C'))
            break;
        unsigned value = 0;
        for (unsigned i = 0; i < 4; ++i)
            value |= unsigned(log[at + 2 + i]) << (i * 8);
        if (tag == 'P')
            pending[transaction] = value;
        else if (auto found = pending.find(transaction); found != pending.end()) {
            result.value = found->second;
            pending.erase(found);
        }
        result.valid_bytes += 7;
    }
    result.tail = result.valid_bytes != log.size();
    return result;
}

int main() {
    Bytes log;
    append(log, record('P', 1, 42));
    append(log, record('C', 1, 0));
    auto first = recover(log);
    auto second = recover(log, first.value);
    std::cout << first.value << " " << second.value << "\n";
}

```

Original program output:

```text
42 42
```

Replaying from a state already holding forty-two leaves the same committed value.

Pitfall: An unchecked “add five” redo can apply the same logical change twice after repeated recovery.

Question: Why is this redo repeatable?

1. It runs only once by definition
2. It assigns a known final value
3. The checksum removes repeated records

Answer: 2. Repeating the assignment has the same state effect.

### Run the starter, then try a change

Open `native/examples/wal-idempotence.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/wal-idempotence.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
auto second = recover(log, first.value);
```

With

```cpp
auto second = recover(log, 5);
```

Rerun the terminal command. Compare both values. How does assignment redo behave when recovery begins with a different earlier value?

## Enumerate crash prefixes against a committed-state oracle

Before this chapter: [Publish a complete candidate at commit](../transactions/README.md)

A finite crash-prefix workload can test every byte truncation of a small log fixture. The expected state comes from the documented commit boundary rather than the recovery parser’s own logic.

This check is valuable but limited: real crashes, reordering, sector behavior, and torn writes need a larger host failure model.

```cpp
#include <iostream>
#include <map>
#include <span>
#include <vector>

using Bytes = std::vector<unsigned char>;
Bytes record(unsigned char tag, unsigned char transaction, unsigned value) {
    Bytes bytes{tag, transaction};
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
    unsigned char checksum = 0;
    for (auto byte : bytes)
        checksum ^= byte;
    bytes.push_back(checksum);
    return bytes;
}
void append(Bytes &log, const Bytes &bytes) {
    log.insert(log.end(), bytes.begin(), bytes.end());
}
struct Recovery {
    unsigned value = 0;
    std::size_t valid_bytes = 0;
    bool tail = false;
};
Recovery recover(std::span<const unsigned char> log, unsigned initial = 0) {
    Recovery result{initial, 0, false};
    std::map<unsigned, unsigned> pending;
    while (log.size() - result.valid_bytes >= 7) {
        auto at = result.valid_bytes;
        unsigned char checksum = 0;
        for (unsigned i = 0; i < 6; ++i)
            checksum ^= log[at + i];
        auto tag = log[at], transaction = log[at + 1];
        if (checksum != log[at + 6] || (tag != 'P' && tag != 'C'))
            break;
        unsigned value = 0;
        for (unsigned i = 0; i < 4; ++i)
            value |= unsigned(log[at + 2 + i]) << (i * 8);
        if (tag == 'P')
            pending[transaction] = value;
        else if (auto found = pending.find(transaction); found != pending.end()) {
            result.value = found->second;
            pending.erase(found);
        }
        result.valid_bytes += 7;
    }
    result.tail = result.valid_bytes != log.size();
    return result;
}

int main() {
    Bytes log;
    append(log, record('P', 1, 42));
    append(log, record('C', 1, 0));
    bool valid = true;
    for (std::size_t length = 0; length <= log.size(); ++length) {
        auto state = recover(std::span(log).first(length));
        valid = valid && (state.value == (length == 14 ? 42u : 0u));
    }
    std::cout << "prefixes=" << log.size() + 1 << " verified=" << valid << "\n";
    return valid ? 0 : 1;
}

```

Original program output:

```text
prefixes=15 verified=1
```

All fifteen prefixes agree with an independent rule: only the complete fourteen-byte pair commits forty-two.

Pitfall: Passing prefix tests is not evidence that the underlying filesystem guarantees prefix-only failures.

Question: Where does the expected commit boundary come from?

1. Calling recover a second time
2. The independently specified record contract
3. The wall-clock duration

Answer: 2. The oracle does not duplicate the parser’s transitions.

### Run the starter, then try a change

Open `native/examples/wal-crash-prefix-oracle.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/wal-crash-prefix-oracle.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
length == 14
```

With

```cpp
length == 13
```

Rerun the terminal command. Compare prefixes=, verified= and exit status. Does the deliberately changed reference accept a commit before all its bytes exist?

## Separate checked writes from a host durability request

Before this chapter: [Publish a complete candidate at commit](../transactions/README.md)

New terms and notation:

A write-ahead log, abbreviated WAL, records recovery information before the associated change is treated as durably published. These lessons use a small redo-log model: replay re-applies validated committed changes after an interruption.

A checkpoint records a selected committed state so recovery may start from that state instead of replaying all older work. Which writes are durable and which log records can be discarded depend on the checkpoint protocol.

A successful write or stream close does not by itself promise power-loss durability. A native host adapter can request synchronization and must check that request’s result before reporting the corresponding durability boundary.

This POSIX investigation writes one byte, checks fsync, and checks close. It demonstrates syscall handling, not a full WAL-plus-directory publication protocol or device-failure proof.

```cpp
#include <fcntl.h>
#include <iostream>
#include <unistd.h>

int main() {
    int fd = ::open("redo.log", O_WRONLY | O_CREAT | O_TRUNC, 0600);
    if (fd < 0)
        return 1;
    const char byte = 'x';
    bool written = ::write(fd, &byte, 1) == 1;
    bool synced = written && ::fsync(fd) == 0;
    bool closed = ::close(fd) == 0;
    std::cout << "write=" << written << " sync=" << synced << " close=" << closed
              << "\n";
    return written && synced && closed ? 0 : 1;
}

```

Original program output:

```text
write=1 sync=1 close=1
```

The success line requires all three host calls to report success. Publication of a renamed checkpoint would add further ordering and directory concerns.

Pitfall: Ignoring fsync failure and printing “durable” misstates the host result.

Question: Does this finite run prove power-loss durability on every device?

1. No
2. Yes
3. Only because the file contains one byte

Answer: 1. It verifies checked behavior on the selected host, under its documented assumptions.

### Run the starter, then try a change

Open `native/examples/wal-native-sync.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/wal-native-sync.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
const char byte = 'x';
```

With

```cpp
const char byte = 'y';
```

Rerun the terminal command. Compare write=, sync= and close=. Then enter od -An -tc "$run_dir/redo.log" to see the byte written inside this experiment’s temporary directory. These results describe the actual file operations on your host.

## Chapter project

Enumerate crash prefixes and check recovery against a committed-state model.
