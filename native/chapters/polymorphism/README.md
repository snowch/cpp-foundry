# Runtime and static polymorphism

Compare virtual dispatch, variants, and composition.

## Dispatch through a borrowing base reference

A virtual member selects behavior using an object’s dynamic type when called through a base pointer or reference. An interface can express a storage operation without requiring callers to know the implementation type.

The reference in this example borrows an already owned object. Dynamic dispatch and dynamic allocation are independent choices.

```cpp
#include <iostream>

struct Store {
    virtual ~Store() = default;
    virtual int count() const = 0;
};
struct MemoryStore final : Store {
    int count() const override {
        return 3;
    }
};

int main() {
    MemoryStore store;
    const Store &interface = store;
    std::cout << interface.count() << "\n";
}

```

Expected output:

```text
3
```

The base reference calls MemoryStore::count. The concrete object remains an automatic value owned by main.

Pitfall: A base interface used for polymorphic deletion needs an appropriate virtual destructor.

Question: Does virtual dispatch require heap allocation?

1. Yes
2. No
3. Only when the interface has a destructor

Answer: 2. The dynamic type can belong to an ordinary local object.

Experiment: Add a second implementation and call both through a const Store reference. Keep construction and lifetime ownership explicit.

## Delete polymorphic objects through a valid owner

When a unique_ptr<Base> owns a Derived object, deletion occurs through the base interface. A virtual base destructor ensures the most-derived destructor runs before base cleanup.

This is a resource-management contract, not merely a dispatch detail. Prefer an explicit virtual destructor on an owning polymorphic base.

```cpp
#include <iostream>
#include <memory>

struct Base {
    virtual ~Base() {
        std::cout << "base\n";
    }
};
struct Derived : Base {
    ~Derived() override {
        std::cout << "derived\n";
    }
};

int main() {
    std::unique_ptr<Base> owner = std::make_unique<Derived>();
    owner.reset();
}

```

Expected output:

```text
derived
base
```

Resetting the owner first destroys the Derived part, then the Base part. The output exposes the required order.

Pitfall: Deleting a derived object through an unsuitable non-virtual base destructor is not repaired by wrapping that base pointer in unique_ptr.

Question: Which destructor runs first?

1. Base
2. Only the declared pointer type is destroyed
3. Derived

Answer: 3. Virtual destruction begins with the most-derived object.

Experiment: Add an owning member to Derived and verify it is released. Explain why resource safety depends on the base deletion contract.

## Copying a base value can discard derived state

A base object has space only for its base subobject. Initializing a Base value from a Derived therefore copies the base portion and slices away the derived portion.

Use references or an explicit owning polymorphic representation when behavior must remain dynamic. Value-based alternatives such as variant can preserve a closed set of complete types.

```cpp
#include <iostream>

struct Base {
    virtual ~Base() = default;
    virtual int kind() const {
        return 1;
    }
};
struct Derived : Base {
    int kind() const override {
        return 2;
    }
};

int main() {
    Derived derived;
    Base sliced = derived;
    const Base &borrowed = derived;
    std::cout << sliced.kind() << " " << borrowed.kind() << "\n";
}

```

Expected output:

```text
1 2
```

The sliced value is a complete Base, so it reports one. The reference still refers to the original Derived and reports two.

Pitfall: A vector<Base> does not preserve arbitrary derived objects merely because Base has virtual functions.

Question: What is sliced’s dynamic type?

1. Derived
2. A combination chosen at each call
3. Base

Answer: 3. It is a newly constructed Base value containing only the base portion.

Experiment: Compare vector<Base>, vector<unique_ptr<Base>>, and vector<variant<A,B>> for ownership, extensibility, and copying.

## Visit a closed set of complete value types

variant owns one active alternative from a fixed set. A visitor handles the active type without a manually synchronized integer tag and pointer. This fits domains where the alternatives are known and value semantics are useful.

A variant can become valueless in some exceptional assignments, so do not generalize one simple fixture into an unconditional no-failure claim.

```cpp
#include <iostream>
#include <variant>

struct Scan {
    void explain() const {
        std::cout << "scan\n";
    }
};
struct Lookup {
    int id;
    void explain() const {
        std::cout << "lookup " << id << "\n";
    }
};

int main() {
    std::variant<Scan, Lookup> plan = Lookup{7};
    std::visit([](const auto &operation) { operation.explain(); }, plan);
}

```

Expected output:

```text
lookup 7
```

The variant owns a Lookup value. The generic visitor is instantiated for both alternatives and invokes the active one.

Pitfall: Adding a new alternative requires checking every visitor that depends on exhaustive handling.

Question: Does this variant store a borrowed Lookup pointer?

1. Yes
2. No, it owns the active value
3. Only when the alternative is small

Answer: 2. The complete Lookup object is stored as the active alternative.

Experiment: Add a RangeLookup alternative and extend the explanation contract. Compare compiler diagnostics from an incomplete visitor.

## Compose behavior before adding inheritance

Composition makes a component an owned member or an explicitly borrowed collaborator. It is often sufficient when the relationship is “uses a policy” rather than “is a substitutable implementation.”

A small policy value can make a rule testable without virtual dispatch or shared lifetime ownership. Keep the policy’s state and mutation contract visible.

```cpp
#include <iostream>

struct ScorePolicy {
    unsigned maximum;
    bool accepts(unsigned score) const {
        return score <= maximum;
    }
};
struct Store {
    ScorePolicy policy;
    bool accepts(unsigned score) const {
        return policy.accepts(score);
    }
};

int main() {
    Store store{ScorePolicy{100}};
    std::cout << store.accepts(90) << " " << store.accepts(101) << "\n";
}

```

Expected output:

```text
1 0
```

Store delegates the range decision to its policy member. Both values remain ordinary owned objects.

Pitfall: Inheritance used solely for code reuse can expose an unintended substitutability contract.

Question: What relationship is represented here?

1. Store is a kind of score
2. The store owns and uses a policy value
3. The policy shares ownership of every row

Answer: 2. The policy is a component, not a base-class identity.

Experiment: Add a minimum score to the policy and test its boundaries independently before integrating it into the store.

## Chapter project

Add a storage interface without sharing ownership accidentally.
