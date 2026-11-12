# Vocabulary types and callable utilities

Model absence, alternatives, grouped values, and callable ownership explicitly.

## Represent absence without a magic value

optional stores either a value or disengagement. It is useful when absence is a normal outcome rather than an exceptional failure. Dereference requires engagement; value reports disengagement with bad_optional_access, while value_or produces an alternative value.

```cpp
#include <iostream>
#include <optional>
#include <string>

int main() {
  std::optional<std::string> name;
  std::cout << name.has_value() << " " << name.value_or("unknown");
  name = "Ada";
  std::cout << " " << name.value();
}

```

Expected output:

```text
0 unknown Ada
```

The empty optional yields a fallback. After assignment, value accesses the stored name.

Pitfall: value_or evaluates its argument before the call, even when a stored value exists. Do not use it to defer expensive or effectful work.

Question: Which statement correctly describes this example’s contract?

1. An empty optional contains a default string
2. Check engagement before dereferencing
3. value_or always evaluates its fallback lazily

Answer: 2. Check engagement before dereferencing. The empty optional yields a fallback. After assignment, value accesses the stored name.

Experiment: Count calls to an expensive fallback and replace value_or with an explicit branch. Distinguish an absent name from an invalid name in your API.

## Handle each tagged alternative

variant owns one alternative from a closed set and tracks which is active. visit dispatches a callable to that active value, while get_if allows a nonthrowing type check. Some throwing transitions can leave a variant valueless_by_exception; it is not a universal never-empty sum type.

```cpp
#include <iostream>
#include <string>
#include <type_traits>
#include <variant>

int main() {
  std::variant<int, std::string> value = 7;
  auto show = [](const auto &item) {
    if constexpr (std::is_same_v<std::decay_t<decltype(item)>, int>)
      std::cout << "number=" << item;
    else
      std::cout << "text=" << item;
  };
  std::visit(show, value);
  value = std::string("Ada");
  std::cout << " ";
  std::visit(show, value);
}

```

Expected output:

```text
number=7 text=Ada
```

The visitor instantiates handling for both alternatives and dispatches according to the active tag.

Pitfall: An unchecked get of the wrong alternative throws bad_variant_access. A visitor must support every alternative combination it may receive.

Question: Which statement correctly describes this example’s contract?

1. variant stores all alternatives simultaneously
2. A visitor must handle every possible active alternative
3. get of the wrong type returns a default value

Answer: 2. A visitor must handle every possible active alternative. The visitor instantiates handling for both alternatives and dispatches according to the active tag.

Experiment: Add a monostate alternative for an explicit empty command. Write a visitor with an overload per type and test each alternative independently.

## Expand grouped arguments into a callable

tuple groups heterogeneous values by position. apply expands a tuple-like argument list into a call, while tie creates a tuple of references. Positional structure works well for local composition, but named record types often communicate a public domain interface better.

```cpp
#include <functional>
#include <iostream>
#include <tuple>

int main() {
  auto arguments = std::tuple{3, 4};
  auto add = [](int a, int b) { return a + b; };
  std::cout << std::apply(add, arguments) << " ";
  int n = 2;
  auto refs = std::tie(n);
  std::get<0>(refs) = 9;
  std::cout << n;
}

```

Expected output:

```text
7 9
```

apply calls add with two integers. The tied element aliases n, so assignment changes n.

Pitfall: A tuple containing references does not extend the lifetime of their referents. Avoid retaining tied locals beyond their scope.

Question: Which statement correctly describes this example’s contract?

1. tie copies each referenced value
2. apply passes the entire tuple as one argument
3. tie stores references to existing objects

Answer: 3. tie stores references to existing objects. apply calls add with two integers. The tied element aliases n, so assignment changes n.

Experiment: Compare make_tuple, tie, and a named struct. Add a third callable argument and examine the compile error when the tuple shape no longer matches.

## Choose callable storage and captured state

A lambda capture is an ownership decision: value capture stores independent state, while reference capture borrows. std::function provides owning type erasure for copy-constructible targets in C++20, which excludes a lambda owning a unique_ptr. Keeping the concrete callable type avoids that restriction.

```cpp
#include <functional>
#include <iostream>
#include <memory>

int main() {
  int n = 3;
  std::function<int(int)> by_value = [n](int x) { return n + x; };
  auto owner = [p = std::make_unique<int>(5)](int x) { return *p + x; };
  n = 9;
  std::cout << by_value(2) << " " << owner(2);
}

```

Expected output:

```text
5 7
```

The stored value capture retains 3 despite the later assignment to n. The concrete move-only lambda owns its integer.

Pitfall: A stored reference-capturing callback can dangle. Calling an empty std::function throws bad_function_call.

Question: Which statement correctly describes this example’s contract?

1. C++20 std::function requires a copyable target
2. Reference capture extends a local lifetime
3. All lambdas can be stored in std::function

Answer: 1. C++20 std::function requires a copyable target. The stored value capture retains 3 despite the later assignment to n. The concrete move-only lambda owns its integer.

Experiment: Try assigning the move-only lambda to std::function and explain the diagnostic. Compare passing a callable as a template parameter with type-erased storage.

## Chapter project

Design a typed command result that cannot confuse absence with failure.
