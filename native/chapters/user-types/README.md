# Design small domain types

Use initialization, enums, access control, and operators deliberately.

## Aggregate initialization names a simple value layout

An aggregate can collect fields without a custom constructor. Brace initialization makes the initial state visible and catches many narrowing conversions. Default member initializers provide a deliberate value for omitted members.

A public aggregate is suitable when callers may freely construct valid combinations. Use controlled construction when fields must satisfy a stronger invariant.

```cpp
#include <iostream>
#include <string>

struct Person {
    unsigned id;
    std::string name;
    unsigned score = 0;
};

int main() {
    Person first{1, "Ada", 90};
    Person second{2, "Grace"};
    std::cout << first.name << " " << first.score << "\n";
    std::cout << second.name << " " << second.score << "\n";
}

```

Expected output:

```text
Ada 90
Grace 0
```

The first value supplies all fields. The omitted score in the second uses its declared default initializer.

Pitfall: A public aggregate cannot prevent a caller from supplying an invalid ID or score by itself.

Question: Where does second.score get zero?

1. Its default member initializer
2. All omitted fields are always uninitialized
3. The string constructor writes it

Answer: 1. The field declaration explicitly supplies its default.

Experiment: Add an ID validation requirement and decide whether this aggregate should become a class with controlled construction.

## Return a named status instead of a magic integer

A named enum makes result alternatives explicit: inserted, duplicate, and full have different meanings even if all are represented by small integers. enum class avoids accidental implicit conversion to an unrelated arithmetic value.

Keep the externally visible behavior in the API contract rather than requiring callers to know the numeric representation of an enumerator.

```cpp
#include <iostream>

enum class Status { inserted, duplicate, full };

int main() {
    Status result = Status::duplicate;
    std::cout << (result == Status::duplicate ? "duplicate" : "other") << "\n";
}

```

Expected output:

```text
duplicate
```

The caller compares a named alternative. Reordering the enumerators would not change this source-level decision.

Pitfall: Serializing an enum’s underlying bytes without a documented encoding ties the file to implementation details.

Question: Should callers depend on duplicate being integer 1?

1. No, they should use its named contract
2. Yes, enum order is a persistence format
3. Only when printing

Answer: 1. The name expresses the API alternative; storage encoding is a separate decision.

Experiment: Add missing and invalid statuses. Write a formatter that handles each named outcome without exposing its integer value.

## Prevent accidental domain conversions

A one-argument constructor can become an implicit conversion unless it is explicit. A domain ID type often benefits from requiring the caller to state that conversion at the boundary.

The wrapper can also establish invariants and keep unrelated numeric domains, such as page IDs and row IDs, distinct.

```cpp
#include <iostream>
#include <stdexcept>

class RowId {
    unsigned value_;

  public:
    explicit RowId(unsigned value) : value_(value) {
        if (!value)
            throw std::invalid_argument("zero ID");
    }
    unsigned value() const {
        return value_;
    }
};

int main() {
    RowId id{7};
    std::cout << id.value() << "\n";
}

```

Expected output:

```text
7
```

Direct brace construction explicitly creates the domain type. A raw unsigned cannot silently stand in for RowId at an unrelated call site.

Pitfall: explicit does not validate the value automatically; the constructor still needs the domain check.

Question: What does explicit control?

1. Whether construction can throw
2. Whether the value is stored on the heap
3. Implicit conversion through this constructor

Answer: 3. The validation and allocation choices are separate from implicit conversion rules.

Experiment: Write a function accepting RowId and attempt to pass 7 directly. Compare that diagnostic with passing RowId{7}.

## Const member functions promise read-only access through this

A const-qualified member function can be called on a const object and cannot modify ordinary members through its this pointer. It is useful for observation without exposing mutable storage.

Const is an access-path rule, not a complete concurrency or deep-immutability guarantee. A returned mutable pointer could undermine the intended public contract.

```cpp
#include <iostream>

class Counter {
    int count_;

  public:
    explicit Counter(int count) : count_(count) {
    }
    int value() const {
        return count_;
    }
};

int main() {
    const Counter counter{3};
    std::cout << counter.value() << "\n";
}

```

Expected output:

```text
3
```

value can observe the const counter because its member declaration is const-qualified.

Pitfall: Returning a mutable reference from a const observer can defeat the abstraction even if it is technically possible through other indirection.

Question: Why is value callable on counter?

1. All member functions accept const objects
2. It is a const-qualified observer
3. The return type is int

Answer: 2. The qualifier describes access through this during the call.

Experiment: Add an increment member without const. Verify that it is rejected for a const Counter and accepted for a mutable one.

## Define equality from domain meaning

C++20 can generate memberwise equality with a defaulted operator==. This is useful for a small value type whose equality really is equality of all its members.

Do not confuse object address, key identity, and full value equality. A record can have the same key but a changed score; your API should specify which comparison each operation needs.

```cpp
#include <iostream>
#include <string>

struct Row {
    unsigned id;
    std::string name;
    unsigned score;
    bool operator==(const Row &) const = default;
};

int main() {
    Row a{1, "Ada", 90}, b{1, "Ada", 90}, c{1, "Ada", 95};
    std::cout << (a == b) << " " << (a == c) << "\n";
}

```

Expected output:

```text
1 0
```

a and b match in every field. c has the same key but a different score, so full value equality is false.

Pitfall: Comparing only IDs when checking whether a persisted snapshot changed can miss changed payload fields.

Question: Are a and c fully equal?

1. No, their scores differ
2. Yes, their IDs match
3. Only if their addresses match

Answer: 1. Defaulted equality compares every declared member.

Experiment: Add a separate same_key function and show a case where same_key is true while full equality is false.

## Chapter project

Design an ID type that cannot represent a missing record.
