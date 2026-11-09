# Ownership and lifetimes

Make resource cleanup a property of your types.

## References borrow; const restricts access

A reference is an alias for an existing object. It does not own that object and does not extend the lifetime of an arbitrary referred-to value. A reference parameter is useful when a function needs to update a caller-owned value.

Make mutation explicit in the interface. A const reference provides read-only access through that reference, while returning a value gives the caller an independent result. Prefer those independent values when borrowing would make lifetimes difficult to reason about.

```cpp
#include <iostream>
#include <string>
void append_label(std::string& name) { name += " Lovelace"; }
std::string greeting(const std::string& name) { return "Hello, " + name; }
int main() {
    std::string name = "Ada";
    append_label(name);
    auto message = greeting(name);
    name.clear();
    std::cout << message << '\n';
    std::cout << "name empty=" << name.empty() << '\n';
}
```

Expected output:

```text
Hello, Ada Lovelace
name empty=1
```

append_label modifies the caller’s string. greeting constructs a new string, so clearing the original name does not change message.

Pitfall: Returning a reference to a local variable leaves the caller with a dangling reference after the function returns.

Question: Why does message survive name.clear()?

1. It owns a separate string
2. All references copy their targets
3. clear never changes strings

Answer: 1. The return type is std::string, so the returned result is an owning value.

Experiment: Change append_label to take its parameter by value. Predict whether main’s name changes, then run the program.

## Value types and invariants

A struct groups related values. A class can additionally control how those values change. An invariant is a condition that every publicly observable valid object must satisfy.

A bounded score type can check construction once and then expose only operations that preserve its range. Exceptions are one way to report rejected construction; later lessons compare this with ordinary optional results.

```cpp
#include <iostream>
#include <stdexcept>
class Score {
    int value_;
public:
    explicit Score(int value) : value_(value) {
        if (value < 0 || value > 100) throw std::invalid_argument("score 0..100");
    }
    int value() const { return value_; }
};
int main() {
    Score score{90};
    std::cout << score.value() << '\n';
    try { Score invalid{101}; }
    catch (const std::invalid_argument& error) { std::cout << error.what() << '\n'; }
}
```

Expected output:

```text
90
score 0..100
```

The constructor either establishes the range invariant or throws. Callers cannot write value_ directly, so an already valid Score cannot be changed to 101 through this interface.

Pitfall: A getter alone does not make a type safe if another public member or a mutable reference still allows invalid state.

Question: When does a Score become a valid constructed object?

1. After its constructor finishes successfully
2. Before validation begins
3. Whenever storage is allocated

Answer: 1. A constructor that throws does not produce a successfully constructed Score.

Experiment: Add a set operation that checks its candidate value before changing value_. Verify that rejection preserves the old score.

## RAII ties cleanup to scope

RAII means acquiring a resource as part of an object’s initialization and releasing it in its destructor. The resource might be memory, a file, or a lock. Normal returns and exception unwinding both destroy fully constructed automatic objects.

Destructors should release resources without throwing. Cleanup is often best delegated to existing owners such as std::vector, std::unique_ptr, std::fstream, and std::lock_guard. You do not need a custom destructor when members already do the right thing.

```cpp
#include <iostream>
#include <stdexcept>
struct Guard {
    Guard() { std::cout << "acquire\n"; }
    ~Guard() { std::cout << "release\n"; }
};
void work() {
    Guard guard;
    std::cout << "work\n";
    throw std::runtime_error("failed");
}
int main() {
    try { work(); }
    catch (const std::runtime_error& error) { std::cout << error.what() << '\n'; }
}
```

Expected output:

```text
acquire
work
release
failed
```

The guard finishes construction before work throws. Stack unwinding calls its destructor before control enters main’s catch handler. The output makes that order observable.

Pitfall: RAII does not guarantee cleanup after process termination, power loss, or a Wasm trap. Exception unwinding and abrupt termination have different contracts.

Question: Does the destructor run before the catch handler?

1. Yes, during unwinding
2. No, only at program exit
3. Only if called manually

Answer: 1. The local guard’s scope is left while the exception travels to the matching handler.

Experiment: Add a second guard with a label and observe reverse construction order. Replace the throw with return and compare.

## Unique ownership and moving

Prefer ordinary values first. When an object needs a separate lifetime or stable address, std::unique_ptr expresses one owner. Copying it is disabled, so two independent owners cannot accidentally delete the same object.

std::move is a cast that permits moving; the selected move operation performs the transfer. A moved-from unique_ptr is empty. Other moved-from library objects are generally valid but have an unspecified value unless their contract says more.

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>
int main() {
    auto first = std::make_unique<std::string>("page 7");
    auto second = std::move(first);
    std::cout << "first empty=" << !first << '\n';
    std::cout << "second=" << *second << '\n';
    second.reset();
    std::cout << "second empty=" << !second << '\n';
}
```

Expected output:

```text
first empty=1
second=page 7
second empty=1
```

make_unique constructs the string and returns its owner. Moving transfers that ownership to second. reset destroys the owned string and leaves second empty.

Pitfall: A raw pointer obtained with get() borrows the object. It becomes invalid when the owning unique_ptr destroys the object.

Question: Does std::move(first) itself allocate a second string?

1. No, the unique_ptr move transfers ownership
2. Yes, it deep-copies the text
3. Only when the string is long

Answer: 1. The unique_ptr move transfers the stored pointer; it does not copy the pointed-to string.

Experiment: Attempt auto third = second before reset. Read the deleted-copy diagnostic, then explicitly transfer ownership instead.

## Chapter project

Design a move-only resource owner with a clear lifetime.
