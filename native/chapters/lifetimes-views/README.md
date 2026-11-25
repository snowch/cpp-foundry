# Lifetimes and borrowed views

Track owners, observers, invalidation, and temporary lifetimes.

## An observer does not own the object

Before this chapter: [RAII ties cleanup to scope](../ownership/README.md)

New terms and notation:

nullptr is the C++ spelling for a pointer with no target. It is not a valid object to read or write through. Check a possibly empty pointer before using * or -> to access its target.

Lifetime is the interval during which an object exists and can be used as that object. A view describes existing data without owning it. A dangling view or reference is one whose underlying object or storage is no longer usable.

A raw pointer can express observation while another object owns the resource. The observer is usable only while the owner keeps the object alive. Destroying or resetting the owner invalidates the observer even though the pointer variable still contains an address.

Keep ownership visible in the surrounding interface. This example stops using the observer before resetting its unique owner.

[Open figure: Ownership and observation reach one resource](../../diagrams/observer-owner.html)

Why does observer not keep the int alive after owner.reset()?

Why does observer not keep the int alive after owner.reset()? Before reset: One allocated int contains 42. owner owns via unique_ptr One allocated int; observer borrows; does not own One allocated int. After reset and observer = nullptr: Old int: lifetime ended contains released resource; lifetime ended. ; owner and observer contains both empty after the explicit assignments. . Only the owner releases the resource. reset does not automatically clear raw aliases; the starter explicitly sets observer to nullptr before later use.

Only the owner releases the resource. reset does not automatically clear raw aliases; the starter explicitly sets observer to nullptr before later use.

```cpp
#include <iostream>
#include <memory>

int main() {
    auto owner = std::make_unique<int>(42);
    int *observer = owner.get();
    std::cout << *observer << "\n";
    owner.reset();
    observer = nullptr;
    std::cout << "empty=" << !owner << "\n";
}

```

Original program output:

```text
42
empty=1
```

get produces a borrowed pointer. reset destroys the int; assigning nullptr to the observer records that it must no longer be used.

Pitfall: A non-null pointer is not proof that its target is still alive.

Question: Does get transfer ownership?

1. Yes, the caller must delete it
2. Only for int objects
3. No, it returns an observer

Answer: 3. The unique_ptr remains the sole owner.

### Run the starter, then try a change

Open `native/examples/observer-owner.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/observer-owner.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
make_unique<int>(42)
```

With

```cpp
make_unique<int>(15)
```

Rerun the terminal command. Compare the number and empty=. Which output comes from the observed object, and which reports the later state of its owner?

## A named owner can outlive an expression

Before this chapter: [RAII ties cleanup to scope](../ownership/README.md)

New terms and notation:

Undefined behavior means the C++ rules place no requirements on what the program does after that invalid operation. An apparently correct result on one run is not evidence of safety; prevent the invalid operation before executing it.

Temporary objects normally last to the end of their full expression. Borrowing from a temporary and retaining that borrow can therefore leave a dangling view immediately after the statement.

Store an owning result first when later operations need its storage. Binding some references can extend a temporary’s lifetime, but lifetime extension has specific rules and is not propagated through arbitrary returned views.

```cpp
#include <iostream>
#include <string>
#include <string_view>

std::string make_name() {
    return "Ada Lovelace";
}

int main() {
    std::string owner = make_name();
    std::string_view view = owner;
    std::cout << view << "\n";
}

```

Original program output:

```text
Ada Lovelace
```

The returned string becomes the named owner. The view is used while that owner remains in scope.

Pitfall: string_view view=make_name() would retain a borrow after the returned temporary string is destroyed.

Question: Why is this view valid at the output?

1. The named string owner is still alive
2. string_view copies all characters
3. Every returned temporary lasts until main ends

Answer: 1. The owner’s scope covers the use of its borrowed storage.

### Run the starter, then try a change

Open `native/examples/temporary-lifetime.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/temporary-lifetime.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::string_view view = owner;
```

With

```cpp
std::string_view view = std::string_view(owner).substr(0, 3);
```

Rerun the terminal command. Compare the printed names. Which object keeps the shortened view’s characters alive until output?

## Reallocation invalidates element observers

Before this chapter: [RAII ties cleanup to scope](../ownership/README.md)

New terms and notation:

Reallocation replaces a container’s backing storage with a different storage area. Saved references, pointers, and iterators into the old area may no longer be usable; each container operation has its own invalidation rules.

A vector owns a contiguous allocation. When growth requires a new allocation, its elements move or copy and old element references, pointers, and iterators become invalid.

An index can be reacquired after growth when the operation preserves the logical ordering you rely on. reserve can reduce reallocations, but it is not a general lifetime proof for every future mutation.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{10, 20};
    std::size_t chosen = 1;
    values.reserve(100);
    values.push_back(30);
    std::cout << values.at(chosen) << " size=" << values.size() << "\n";
}

```

Original program output:

```text
20 size=3
```

The code keeps an index and performs a fresh checked access after potential reallocation. Appending preserves the earlier element order.

Pitfall: An index can name a different record after insertion or erasure before it. Stable numeric position and stable identity are different contracts.

Question: What is safely reacquired here after growth?

1. The element through a still-valid index
2. A previously dangling pointer
3. The old allocation address

Answer: 1. The access derives a new reference from the current vector.

### Run the starter, then try a change

Open `native/examples/vector-invalidation.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/vector-invalidation.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
values.push_back(30);
```

With

```cpp
values.insert(values.begin(), 30);
```

Rerun the terminal command. Compare the element at chosen and size=. Has the number of elements changed between the two versions, or the meaning of the index?

## A view can expose mutations without owning them

Before this chapter: [RAII ties cleanup to scope](../ownership/README.md)

New terms and notation:

std::array<T, N> stores exactly N elements of type T. Unlike vector, its number of elements is fixed as part of the type; braces provide starting values.

std::span<T> is a view of consecutive T elements owned elsewhere. It gives a starting position and an element count without extending the underlying storage’s lifetime.

A mutable span is a borrowed window into existing elements. Writing through it changes the owner’s elements. A span<const T> instead offers read-only access through that view while still depending on the owner’s lifetime.

Neither span variant automatically synchronizes concurrent access. Const access through one path does not make mutation through another path impossible.

[Open figure: Two views reach one backing array](../../diagrams/view-mutation.html)

Why does middle.front()=9 change the value seen by read_only?

Why does middle.front()=9 change the value seen by read_only? Before mutation: index 0 = 1, index 1 = 2, index 2 = 3. middle is a one-element span over index 1.. After mutation through middle: index 0 = 1, index 1 = 9, index 2 = 3. read_only spans the same array and prints 193.. A span does not own or copy the elements. span<const int> prevents writes through that view; it does not prevent another valid writable view from changing the same array.

A span does not own or copy the elements. span<const int> prevents writes through that view; it does not prevent another valid writable view from changing the same array.

```cpp
#include <array>
#include <iostream>
#include <span>

int main() {
    std::array<int, 3> values{1, 2, 3};
    std::span<int> middle(values.data() + 1, 1);
    middle.front() = 9;
    std::span<const int> read_only(values);
    for (int value : read_only)
        std::cout << value;
    std::cout << "\n";
}

```

Original program output:

```text
193
```

The mutable view aliases the second element. The read-only view observes the already changed owner.

Pitfall: Changing an owner can invalidate views even when the view itself is const.

Question: Does span<const int> keep the array alive?

1. Yes
2. No
3. Only when constructed from std::array

Answer: 2. A span packages access; ownership stays with the array.

### Run the starter, then try a change

Open `native/examples/view-mutation.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/view-mutation.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
middle.front() = 9;
```

With

```cpp
middle.front() = 8;
```

Rerun the terminal command. Compare the sequence. Which element of values changed through the span?

## A weak observer can detect expired shared ownership

Before this chapter: [RAII ties cleanup to scope](../ownership/README.md)

New terms and notation:

std::weak_ptr<T> observes an object managed by shared ownership without keeping it alive. lock() attempts to obtain a temporary shared owner; check whether that attempt succeeded before using the value.

shared_ptr represents shared lifetime ownership, which should be chosen only when the design needs several independent owners. weak_ptr observes the shared ownership state without extending the object’s lifetime.

lock either obtains a temporary shared owner or reports expiration. This avoids the unsafe pattern of checking a raw pointer and then assuming the target remains alive.

```cpp
#include <iostream>
#include <memory>

int main() {
    std::weak_ptr<int> observer;
    {
        auto owner = std::make_shared<int>(7);
        observer = owner;
        if (auto held = observer.lock())
            std::cout << *held << "\n";
    }
    std::cout << "expired=" << observer.expired() << "\n";
}

```

Original program output:

```text
7
expired=1
```

The locked handle temporarily shares ownership inside the scope. After both owning handles are gone, the weak observer reports expiration.

Pitfall: Cycles of shared_ptr owners can retain objects indefinitely. A weak relationship can represent a non-owning back edge.

Question: Does weak_ptr extend the object lifetime?

1. Yes, until reset
2. Only after expiration
3. No

Answer: 3. Only successful shared ownership keeps the object alive.

### Run the starter, then try a change

Open `native/examples/shared-weak.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/shared-weak.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
auto owner = std::make_shared<int>(7);
```

With

```cpp
auto owner = std::make_shared<int>(9);
```

Rerun the terminal command. Compare the printed value and expired=. Does a different object value change the observer’s lifetime?

## Chapter project

Audit every borrowed reference in a record-search API.
