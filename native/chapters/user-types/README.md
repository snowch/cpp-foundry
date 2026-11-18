# Design small domain types

Use initialization, enums, access control, and operators deliberately.

## Aggregate initialization names a simple value layout

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

Initialization supplies an object’s starting value when it is created. Assignment replaces a value in an object that already exists; the two steps can have different rules for user-defined types.

A constructor is the initialization function for a user-defined type. It has the type’s name and establishes the object’s starting state; successful construction is what makes the object ready for its promised operations.

A user-defined type groups data and operations under a name. A member is one piece belonging to that type; an object is a particular value of it. We will build these types before studying more detailed ownership rules.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/aggregate-init.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/aggregate-init.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
Person second{2, "Grace"};
```

With

```cpp
Person second{2, "Grace", 75};
```

Rerun the terminal command. Compare Grace’s score and Ada’s score. Which field previously used its default?

## Return a named status instead of a magic integer

Before this chapter: [Keep local names inside their braces](../values/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/enum-status.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/enum-status.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
Status result = Status::duplicate;
```

With

```cpp
Status result = Status::inserted;
```

Rerun the terminal command. Compare the printed label. What result does this comparison group under other?

## Prevent accidental domain conversions

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

A heap data structure orders each parent relative to its children so a highest- or lowest-priority element is quickly available. This is different from “heap memory,” an informal name for dynamically allocated storage.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/explicit-construction.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/explicit-construction.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
RowId id{7};
```

With

```cpp
RowId id = 7;
```

Rerun the terminal command. This edit deliberately tests a compiler diagnostic. Find the diagnostic about converting an integer to RowId. Put the braces back and run again. Which spelling asks for construction explicitly?

## Const member functions promise read-only access through this

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

A pointer stores a location through which a program may access an object. In declarations, T* is a pointer type; *p accesses the pointed-to value and &value obtains its address. A pointer is usable only while its target is alive and the access is allowed.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/member-const.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/member-const.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
const Counter counter{3};
```

With

```cpp
const Counter counter{7};
```

Rerun the terminal command. Compare the values. Does calling value() change the object when the object was constructed with 7?

## Define equality from domain meaning

Before this chapter: [Keep local names inside their braces](../values/README.md)

New terms and notation:

On a special member function, = default requests the compiler-provided implementation when one is available. = delete forbids using that operation. For example, deleting a copy constructor prevents callers from copying that type through it.

A user-defined operator function gives an existing C++ symbol behavior for a user-defined type. For example, operator== defines an equality comparison for values of that type. The definition should preserve the expectations callers have for that operation.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/value-equality.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/value-equality.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
c{1, "Ada", 95}
```

With

```cpp
c{1, "Ada", 90}
```

Rerun the terminal command. Compare the second equality result. Can the rows share an ID and still compare unequal when their scores differ?

## Chapter project

Design an ID type that cannot represent a missing record.
