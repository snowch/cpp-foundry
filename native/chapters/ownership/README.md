# Ownership and lifetimes

Make resource cleanup a property of your types.

## References borrow; const restricts access

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

Single quotes denote one character, while double quotes denote a text literal. In either kind of quotes, the source spelling \n denotes a line-break character. The different types matter when selecting which operation a function or operator performs.

Ownership means responsibility for keeping a resource available and releasing it when finished. A resource can be memory or an open file. Borrowing means using something without taking that cleanup responsibility; the owner must keep it alive while it is used.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/references.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/references.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
append_label(std::string&
```

With

```cpp
append_label(std::string
```

Rerun the terminal command. Compare the line beginning Hello. Does the label added to a copy change the name used by the caller?

## Value types and invariants

Before this chapter: [Keep local names inside their braces](../values/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/invariants.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/invariants.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
Score invalid{101};
```

With

```cpp
Score invalid{100};
```

Rerun the terminal command. Compare the output from the catch handler. Which value is the first one that violates the score range?

## RAII ties cleanup to scope

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

A destructor is a type’s cleanup function, spelled with ~ before the type name. For a successfully constructed ordinary local object, it runs when that object’s lifetime ends, including when a handled failure leaves its block.

std::unique_ptr<T> is an owner that arranges to destroy a managed T when that ownership ends. It cannot be copied into a second independent owner; moving it can transfer the ownership. make_unique<T>(...) constructs the managed object and its owner together.

RAII abbreviates Resource Acquisition Is Initialization: an owner obtains a resource while being created and releases it when its lifetime ends. This ties cleanup to object lifetime rather than requiring a separate manual cleanup instruction on every exit path.

RAII means acquiring a resource as part of an object’s initialization and releasing it in its destructor. The resource might be memory, a file, or a lock. Normal returns and exception unwinding both destroy fully constructed automatic objects.

Destructors should release resources without throwing. Cleanup is often best delegated to existing owners such as std::vector, std::unique_ptr, std::fstream, and std::lock_guard. You do not need a custom destructor when members already do the right thing.

[Open figure: An owner releases its resource when its lifetime ends](../../diagrams/raii.html)

What still runs when an exception leaves work?

What still runs when an exception leaves work? Resource-owning local object was constructed successfully. Normal block exit. Owner destructor releases the resource. ; Exception unwinds the block. Owner destructor releases the resource. The enclosing catch then handles the exception.. The supplied work function throws. This rule covers normal destruction and exception unwinding, not abrupt process termination or destruction of a complete object whose construction never finished.

The supplied work function throws. This rule covers normal destruction and exception unwinding, not abrupt process termination or destruction of a complete object whose construction never finished.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/raii.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/raii.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
work();
```

With

```cpp
work(); std::cout << "after work\n";
```

Rerun the terminal command. Look for release and after work. Does the instruction following the throw run even though the guard releases its resource?

## Unique ownership and moving

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

std::move(value) makes the expression eligible for operations that may transfer resources from value. The cast itself transfers nothing. The original object still exists afterward, with usable operations determined by its type’s moved-from contract.

Prefer ordinary values first. When an object needs a separate lifetime or stable address, std::unique_ptr expresses one owner. Copying it is disabled, so two independent owners cannot accidentally delete the same object.

std::move is a cast that permits moving; the selected move operation performs the transfer. A moved-from unique_ptr is empty. Other moved-from library objects are generally valid but have an unspecified value unless their contract says more.

[Open figure: An owning handle moves while its source object remains](../../diagrams/moves.html)

Why is first empty after moving it into second?

Why is first empty after moving it into second? Before the move: Allocated string contains page 7. first owns Allocated string. After std::move(first): Same resource contains page 7. second now owns Same resource; Moved-from unique_ptr first contains empty. . After second.reset(): Resource lifetime ended contains released string; lifetime ended. ; unique_ptr second contains empty. . This specific unique_ptr move transfers ownership. Move behavior for other types follows their own contracts; a generic move is not guaranteed to transfer an allocation.

This specific unique_ptr move transfers ownership. Move behavior for other types follows their own contracts; a generic move is not guaranteed to transfer an allocation.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/moves.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/moves.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
second.reset();
```

With

```cpp
auto third = std::move(second);
```

Rerun the terminal command. Compare second empty= with the original. What happens to ownership when an empty source is produced by move instead of reset?

## Chapter project

Design a move-only resource owner with a clear lifetime.
