# Copying, moving, and value semantics

Understand generated operations and design exception-safe owners.

## Let owning members implement resource management

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

Expected output:

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

Experiment: Add a second vector member and verify the default operations still satisfy your value contract without custom special members.

## A move-only member makes ownership transfer explicit

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

Expected output:

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

Experiment: Add a string label and move the Page again. Check only moved-from properties guaranteed by the relevant member contracts.

## Define an independent copy when the domain needs one

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

Expected output:

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

Experiment: Test copy assignment and self-assignment. Add explicitly chosen move operations only after deciding how a moved-from Box may be observed.

## Nonthrowing movement affects container choices

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

Expected output:

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

Experiment: Inspect is_nothrow_move_constructible for an aggregate of standard owning members. Explain which member determines the result.

## Return values without forcing a move

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

Expected output:

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

Experiment: Make Message noncopyable and return the prvalue again. Separately study a named local return and distinguish its rule.

## Chapter project

Implement an independently copied value type and test moving it.
