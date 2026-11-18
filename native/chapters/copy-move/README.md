# Copying, moving, and value semantics

Understand generated operations and design exception-safe owners.

## Let owning members implement resource management

Before this chapter: [Unique ownership and moving](../ownership/README.md)

Copying creates an independent value. Moving allows an operation to transfer resources instead; it does not erase the source object. The generated operations are the ones the compiler supplies when the type’s declarations permit it.

The rule of zero recommends delegating resource management to member types so your class needs no custom destructor, copy constructor, or move constructor. Standard containers already know how to release and copy their owned elements.

This keeps the public value semantics easier to inspect and reduces the number of operations that must maintain the class invariant.

```cpp
#include <iostream>
#include <string>
#include <vector>

struct Report {
    std::vector<std::string> names;
};

int main() {
    Report first{{"Ada", "Grace"}};
    Report copy = first;
    copy.names[0] = "Changed";
    std::cout << first.names[0] << " " << copy.names[0] << "\n";
}

```

Original program output:

```text
Ada Changed
```

Copying Report copies its vector and strings. Mutating the copied name does not change the original report.

Pitfall: Adding a manually managed raw owning pointer changes these semantics and can introduce shallow copies and double deletion.

Question: Why are the copies independent?

1. The members have owning value semantics
2. All structs are automatically deep-copied through pointers
3. The destructor disables aliasing

Answer: 1. The standard owning members define the desired copy behavior.

### Run the starter, then try a change

Open `native/examples/rule-zero.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/rule-zero.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
copy.names[0] = "Changed";
```

With

```cpp
copy.names[0] = "Lin";
```

Rerun the terminal command. Compare first and copy. Do edits to the copy change the original vector’s first value?

## A move-only member makes ownership transfer explicit

Before this chapter: [Unique ownership and moving](../ownership/README.md)

New terms and notation:

static_assert checks a true/false condition during compilation and rejects the program if it is false. This differs from an ordinary runtime check performed when the finished program executes.

A type trait describes a property of a type at compile time. Names ending in _v commonly expose a true/false result; names ending in _t commonly name a resulting type. For example, is_same_v<A, B> asks whether A and B are the same type.

A type containing unique_ptr cannot use an automatically generated copy operation that would duplicate that owner. It can often use the generated move operations to transfer its members.

Make a move-only API intentional and test it at compile time. Copyability should reflect the domain contract rather than being discovered accidentally by a caller.

```cpp
#include <iostream>
#include <memory>
#include <type_traits>
#include <utility>

struct Page {
    std::unique_ptr<int> value;
};

int main() {
    static_assert(!std::is_copy_constructible_v<Page>);
    static_assert(std::is_move_constructible_v<Page>);
    Page first{std::make_unique<int>(12)};
    Page second=std::move(first);
    std::cout << !first.value << " " << *second.value << "\n";
}

```

Original program output:

```text
1 12
```

The static assertions describe the generated interface. Moving Page transfers the unique_ptr and leaves the original member empty.

Pitfall: A moved-from whole object still needs a documented valid-use contract; do not assume every member retains its previous value.

Question: Can this Page be copied by its generated copy constructor?

1. Yes, by duplicating the pointer
2. Yes, but only once
3. No

Answer: 3. unique_ptr deliberately deletes copying.

### Run the starter, then try a change

Open `native/examples/move-only-types.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/move-only-types.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
make_unique<int>(12)
```

With

```cpp
make_unique<int>(16)
```

Rerun the terminal command. Compare both numbers. Which number records the original pointer’s state and which belongs to the object after the move?

## Define an independent copy when the domain needs one

Before this chapter: [Unique ownership and moving](../ownership/README.md)

Sometimes an owning representation is move-only but the domain value should be copyable. A custom copy constructor can clone the resource, while copy assignment can prepare a candidate and then commit without throwing.

This example owns one int to keep the protocol visible. A real buffer owner also needs size, allocation, and element-copy contracts.

```cpp
#include <iostream>
#include <memory>
#include <utility>

class Box {
    std::unique_ptr<int> value_;

  public:
    explicit Box(int value) : value_(std::make_unique<int>(value)) {
    }
    Box(const Box &other) : Box(other.get()) {
    }
    Box &operator=(const Box &other) {
        Box candidate(other);
        value_.swap(candidate.value_);
        return *this;
    }
    int get() const {
        return *value_;
    }
    void set(int value) {
        *value_ = value;
    }
};

int main() {
    Box first{5};
    Box copy = first;
    copy.set(9);
    std::cout << first.get() << " " << copy.get() << "\n";
}

```

Original program output:

```text
5 9
```

The copy constructor allocates a different int. The two boxes therefore maintain independent values.

Pitfall: Writing only a destructor for an owner can leave generated copying with unsafe shallow ownership behavior.

Question: What does the copy constructor duplicate?

1. The owned value in a separate allocation
2. Only the raw address
3. The unique_ptr control block

Answer: 1. Each successful Box construction owns its own int.

### Run the starter, then try a change

Open `native/examples/copy-custom-owner.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/copy-custom-owner.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
Box copy = first;
```

With

```cpp
Box copy{0}; copy = first;
```

Rerun the terminal command. Compare the two printed values. Does copy assignment preserve independence after editing the copy?

## Nonthrowing movement affects container choices

Before this chapter: [Unique ownership and moving](../ownership/README.md)

New terms and notation:

noexcept declares that an operation must not let an exception escape. If one escapes anyway, the program terminates. This is a promise to callers and containers, not an instruction to ignore failures.

A container may choose copying rather than a potentially throwing move when preserving its exception guarantee during reallocation. Declaring a move noexcept is a promise that the operation cannot propagate an exception.

Check the properties of member operations instead of adding noexcept to silence a diagnostic. A false promise can turn an ordinary exception into program termination.

```cpp
#include <iostream>
#include <memory>
#include <type_traits>

int main() {
    std::cout << std::is_nothrow_move_constructible_v<std::unique_ptr<int>> << "\n";
    std::cout << std::is_copy_constructible_v<std::unique_ptr<int>> << "\n";
}

```

Original program output:

```text
1
0
```

unique_ptr’s ownership transfer is nonthrowing and copying is disabled. Those properties make moving it into a vector straightforward.

Pitfall: noexcept does not catch exceptions or roll back state; violating it terminates the program.

Question: What happens if an exception escapes a noexcept function?

1. The exception is ignored
2. The caller receives an optional error
3. The program terminates

Answer: 3. noexcept is an enforceable exception-propagation promise.

### Run the starter, then try a change

Open `native/examples/noexcept-moves.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/noexcept-moves.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::is_copy_constructible_v<std::unique_ptr<int>>
```

With

```cpp
std::is_copy_constructible_v<int>
```

Rerun the terminal command. Compare the second line for int and unique_ptr<int>. Which type permits copying?

## Return values without forcing a move

Before this chapter: [Unique ownership and moving](../ownership/README.md)

Returning a value often permits construction directly in the caller’s result object. C++17 and later guarantee elision for certain prvalue return expressions. Named return optimization has different rules and is not universally guaranteed.

Do not scatter std::move into return statements reflexively: it can interfere with useful elision or obscure the intended ownership transfer.

```cpp
#include <iostream>
#include <string>

struct Message {
    std::string text;
};
Message make_message() {
    return Message{"ready"};
}

int main() {
    Message result = make_message();
    std::cout << result.text << "\n";
}

```

Original program output:

```text
ready
```

The function returns a prvalue Message. The result is constructed without requiring an intermediate copy of Message.

Pitfall: A benchmark of one compiler’s named-return optimization is not a universal language guarantee.

Question: Does this prvalue return require an intermediate copy?

1. Yes, exactly one
2. Only when strings are short
3. No

Answer: 3. The prvalue construction is covered by guaranteed copy elision.

### Run the starter, then try a change

Open `native/examples/return-elision.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/return-elision.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::cout << result.text
```

With

```cpp
Message second{std::move(result)}; std::cout << second.text
```

Rerun the terminal command. Compare the printed result. Which object was moved from and which now owns its string?

## Chapter project

Implement an independently copied value type and test moving it.
