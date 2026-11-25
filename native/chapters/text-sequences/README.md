# Text and sequences

Own, inspect, transform, and validate sequences.

## Text length and byte length are different contracts

Before this chapter: [Keep several values in a vector](../values/README.md)

New terms and notation:

A graph represents vertices and connections called edges. An adjacency list records each vertex’s neighbors; directed edges have a direction, while an undirected connection can be followed both ways.

A byte is a unit of stored data. The course’s file formats use octets, exactly eight bits each; a bit is a binary digit, zero or one. A format must specify how numbers and text turn into those byte values.

Unicode assigns code points to characters. UTF-8 encodes a code point using one to four bytes. A byte count, a code-point count, and the number of symbols a person sees can therefore differ; indexing bytes is not a general way to select visible characters.

A sequence is an ordered set of elements. Text is represented by character values; a displayed symbol can occupy more than one byte. We distinguish the elements that exist from storage reserved for possible future elements.

std::string owns a sequence of char units. With UTF-8 input, a character can occupy more than one byte, so size is a storage count rather than a user-perceived character count.

The record store limits UTF-8 bytes because the file format stores a byte length. Display width and Unicode segmentation require different algorithms.

[Open figure: UTF-8 bytes do not count displayed letters](../../diagrams/string-bytes.html)

Why does Zoë occupy four bytes?

Why does Zoë occupy four bytes? Starter string: Zoë. Z uses byte offsets 0: 5A; o uses byte offsets 1: 6F; ë uses byte offsets 2 through 3: C3, AB. std::string::size counts char code units; this fixture uses UTF-8 and eight-bit bytes. Code points are not always complete grapheme clusters.

std::string::size counts char code units; this fixture uses UTF-8 and eight-bit bytes. Code points are not always complete grapheme clusters.

```cpp
#include <iostream>
#include <string>

int main() {
    std::string name = "Zoë";
    std::cout << "bytes=" << name.size() << "\n";
    std::cout << name << "\n";
}

```

Original program output:

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

### Run the starter, then try a change

Open `native/examples/string-bytes.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/string-bytes.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::string name = "Zoë";
```

With

```cpp
std::string name = "Ada";
```

Rerun the terminal command. Compare bytes= with the names shown. Why do two names with three letters use different numbers of UTF-8 bytes?

## Size describes live elements; capacity describes storage

Before this chapter: [Keep several values in a vector](../values/README.md)

New terms and notation:

A vector’s size counts actual elements. Its capacity counts how many elements its current storage could hold without growing. Reserving storage changes capacity, not the number of elements available to read.

An amortized cost spreads total work across a sequence of operations, including occasional expensive ones. It differs from a worst-case bound for every individual operation and from a probability-based average over inputs.

A vector may own more storage than it currently uses for live elements. reserve requests capacity without constructing new elements. resize changes size and constructs or destroys elements as needed.

Avoid asserting an exact growth factor: the standard specifies capacity guarantees and amortized behavior, not a universal doubling policy.

[Open figure: Reserved capacity is not live element count](../../diagrams/vector-capacity.html)

Why does reserve(20) leave size 2 but resize(4) creates two zeros?

Why does reserve(20) leave size 2 but resize(4) creates two zeros? Operation; Live elements; Storage contract. Initial vector; [1,2] · size 2; Capacity is at least 2; reserve(20); [1,2] · size 2; Capacity at least 20; no extra elements; resize(4); [1,2,0,0] · size 4; Two new int elements are value-initialized. . . Do not index reserved capacity beyond size. Exact capacity growth is implementation-dependent.

Do not index reserved capacity beyond size. Exact capacity growth is implementation-dependent.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/vector-capacity.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/vector-capacity.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
values.resize(4);
```

With

```cpp
values.resize(5);
```

Rerun the terminal command. Compare size= and the two elements printed after resize. Is size= read before or after resize?

## Read text one line at a time

Before this chapter: [Keep several values in a vector](../values/README.md)

New terms and notation:

A constructor’s member-initializer list, after the colon, gives members their starting values before the constructor body runs. Members initialize in declaration order, not in the order written in that list.

A text reader lets a program take characters from an input source in order. std::istringstream is a reader backed by a string rather than a keyboard or file; #include <sstream> supplies it. We use fixed text here so every run starts with the same input.

std::getline(input, line) reads the next line from input into the string variable line. It removes the separating line break instead of storing it in line. Each successful read replaces line’s previous contents.

The result of getline can be tested as a condition. In while (std::getline(input, line)), the body runs whenever reading a line succeeds. The loop stops when no more lines can be read, or when a read fails. An empty line still counts as a successful read.

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

Original program output:

```text
[LIST]
[]
[SAVE]
```

The reader first supplies LIST, then an empty string for the blank line, then SAVE. Printing brackets around each line makes the otherwise invisible empty line visible as [].

Pitfall: An empty line is different from having no more input. Test whether the read succeeded, not whether the resulting line happens to be empty.

Question: Does getline keep the separating line break in line?

1. No
2. Yes
3. Only for empty lines

Answer: 1. The line break is consumed by the reader but is not stored in line.

### Run the starter, then try a change

Open `native/examples/line-input.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/line-input.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
LIST\n\nSAVE\n
```

With

```cpp
LIST\n\nSAVE\nCOUNT
```

Rerun the terminal command. Find [COUNT] in the output. Does the final line need a trailing newline to be returned?

## Remove elements with an explicit predicate

Before this chapter: [Keep several values in a vector](../values/README.md)

New terms and notation:

An iterator is a value used to visit positions in a sequence. begin identifies the first position and end marks the position just after the last; end is a stopping marker and must not be read as an element.

A lambda is a function written directly where it is needed. Its [ ] capture list says which surrounding local values it uses, its parentheses describe inputs, and its braces contain the instructions. [x] stores a copy of x; [&x] borrows x and therefore needs x to remain alive.

The % operator computes the remainder of whole-number division. A remainder of zero in value % 2 identifies an even number. Division or remainder with a zero divisor is not permitted.

A predicate is a callable that answers a true/false question about its input. Algorithms use predicates to decide which elements to keep, find, or group; a comparator instead asks whether one value comes before another.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/erase-remove.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/erase-remove.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
value % 2 == 0
```

With

```cpp
value % 2 != 0
```

Rerun the terminal command. Compare removed=, remaining= and the retained values. How does changing the predicate change what is erased?

## Build subranges from validated bounds

Before this chapter: [Keep several values in a vector](../values/README.md)

New terms and notation:

std::optional<T> holds either one T value or no value. std::nullopt denotes the no-value state. Test engagement with if (result) before using *result to read its value; this * is access to the contained value, not multiplication.

std::string_view describes a stretch of characters without owning or copying those characters. It records a starting position and a length; the original characters must outlive every use of the view.

std::size_t is the unsigned whole-number type used for sizes and element counts. std::ptrdiff_t is a signed type used for differences between positions. A size count does not by itself prove that an index is valid.

Allocation obtains storage in which objects can live. Constructing an object establishes its value in suitable storage; releasing storage and ending an object’s lifetime are related but distinct operations. Library owners usually arrange these steps for you.

A slice needs both a start and a length that fit the source. Validate using subtraction after checking the start, rather than adding start+length where an unsigned sum could wrap.

A string_view slice borrows the source. Returning an owning string instead is useful when the caller cannot maintain the source lifetime.

[Open figure: Validate the complete requested interval](../../diagrams/safe-slicing.html)

Why is [0,4) inside Lovelace but [2,9) outside Ada?

Why is [0,4) inside Lovelace but [2,9) outside Ada? Accepted range. Lovelace: index 0 = L, index 1 = o, index 2 = v, index 3 = e, index 4 = l, index 5 = a, index 6 = c, index 7 = e. Start 0, length 4: select Love.; Rejected request. Owner length; Requested start; Requested count; Decision. 3 (Ada); 2; 9; Reject before forming the view. . . A valid start alone is insufficient; the whole count must fit the remaining owner. The returned view borrows text and does not extend its lifetime.

A valid start alone is insufficient; the whole count must fit the remaining owner. The returned view borrows text and does not extend its lifetime.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/safe-slicing.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/safe-slicing.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
slice("Lovelace", 0, 4)
```

With

```cpp
slice("Lovelace", 4, 4)
```

Rerun the terminal command. Compare the printed slice and rejected=. Which call is affected by moving the first slice’s starting index?

## Chapter project

Build a line-oriented report without borrowing from destroyed input.
