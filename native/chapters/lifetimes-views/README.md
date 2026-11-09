# Lifetimes and borrowed views

Track owners, observers, invalidation, and temporary lifetimes.

## An observer does not own the object

A raw pointer can express observation while another object owns the resource. The observer is usable only while the owner keeps the object alive. Destroying or resetting the owner invalidates the observer even though the pointer variable still contains an address.

Keep ownership visible in the surrounding interface. This example stops using the observer before resetting its unique owner.

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

Expected output:

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

Experiment: Write a function accepting const int* and document whether null is permitted. Compare that observer interface with accepting unique_ptr<int>.

## A named owner can outlive an expression

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

Expected output:

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

Experiment: Draw lifetimes for the safe code and the dangling alternative without executing undefined behavior. Rewrite an API to return an owning string.

## Reallocation invalidates element observers

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

Expected output:

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

Experiment: Insert at the beginning and observe how the same index changes meaning. Design a record lookup around stable IDs instead.

## A view can expose mutations without owning them

A mutable span is a borrowed window into existing elements. Writing through it changes the owner’s elements. A span<const T> instead offers read-only access through that view while still depending on the owner’s lifetime.

Neither span variant automatically synchronizes concurrent access. Const access through one path does not make mutation through another path impossible.

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

Expected output:

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

Experiment: Pass a span<const int> to a sum function accepting arrays and vectors. Document which caller mutations would invalidate the borrow.

## A weak observer can detect expired shared ownership

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

Expected output:

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

Experiment: Model parent/child ownership and choose which back-reference should be weak. Check expiration after releasing the root owner.

## Chapter project

Audit every borrowed reference in a record-search API.
