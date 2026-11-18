# Generic code and object-model contracts

Separate deduction, forwarding, dispatch, and compile-time validation.

## Preserve an argument’s value category deliberately

Before this chapter: [Forward a callable without inventing ownership](../templates/README.md)

A value category describes how an expression refers to a value: roughly, a reusable named object or a value eligible to be consumed. Forwarding preserves a caller’s category. Compile-time checks run while translating the program; they are distinct from tests run by the finished program.

A forwarding reference arises in a deduced T&& parameter under specific rules. std::forward<T> preserves the caller’s value category; std::move unconditionally casts to an expiring-value expression. Neither cast itself transfers resources: the selected operation determines what actually happens.

```cpp
#include <iostream>
#include <utility>

void consume(int &) { std::cout << "lvalue "; }
void consume(int &&) { std::cout << "rvalue "; }
template <class T> void relay(T &&value) { consume(std::forward<T>(value)); }
int main() {
  int n = 3;
  relay(n);
  relay(3);
}

```

Original program output:

```text
lvalue rvalue 
```

The lvalue call selects the reference overload, while the temporary selects the rvalue overload through the same wrapper.

Pitfall: Forwarding a parameter more than once can expose an already-moved-from argument to later consumers. Prefer simple value APIs unless preservation is actually needed.

Question: Which statement correctly describes this example’s contract?

1. std::move itself transfers allocated storage
2. forward preserves the deduced argument category
3. Every T&& declaration is a forwarding reference

Answer: 2. forward preserves the deduced argument category. The lvalue call selects the reference overload, while the temporary selects the rvalue overload through the same wrapper.

### Run the starter, then try a change

Open `native/examples/gap-forwarding.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/gap-forwarding.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
relay(n);
```

With

```cpp
relay(std::move(n));
```

Rerun the terminal command. Compare the argument category printed for the first call. What category does the explicit move request?

## Express required operations without claiming semantic proof

Before this chapter: [Forward a callable without inventing ownership](../templates/README.md)

A requires expression can check that an operation exists and yields a constrained type. A concept improves overload selection and diagnostics, but syntactic validity does not establish associativity, complexity, thread safety, or freedom from overflow. Those are semantic contracts requiring reasoning and tests.

```cpp
#include <concepts>
#include <iostream>

template <class T>
concept Addable = requires(T a, T b) {
  { a + b } -> std::convertible_to<T>;
};
template <Addable T> T combine(T a, T b) { return a + b; }
int main() { std::cout << combine(2, 3) << " " << Addable<int>; }

```

Original program output:

```text
5 1
```

The int type supports addition convertible to itself, so the constrained function is available. The fixture stays within its representable range.

Pitfall: A concept named Addable does not prove that adding arbitrary inputs cannot overflow or throw. Avoid names that imply stronger guarantees than the requirements express.

Question: Which statement correctly describes this example’s contract?

1. Concept satisfaction proves all algebraic laws
2. Concepts automatically prevent signed overflow
3. A requires expression checks declared syntactic requirements

Answer: 3. A requires expression checks declared syntactic requirements. The int type supports addition convertible to itself, so the constrained function is available. The fixture stays within its representable range.

### Run the starter, then try a change

Open `native/examples/gap-concept-requires.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/gap-concept-requires.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
combine(2, 3)
```

With

```cpp
combine(2.0, 3.5)
```

Rerun the terminal command. Compare the sum. Does the requires expression permit addition for these floating-point arguments too?

## Distinguish constant evaluation from optimization

Before this chapter: [Forward a callable without inventing ownership](../templates/README.md)

constexpr permits a function to participate in constant evaluation when its inputs and operations satisfy the rules. It does not require every call to run at compile time. static_assert requires its condition to be a constant expression, while consteval requires immediate evaluation at each applicable call.

```cpp
#include <array>
#include <iostream>

constexpr int sum(const std::array<int, 3> &values) {
  int total = 0;
  for (int n : values)
    total += n;
  return total;
}
int main() {
  constexpr auto answer = sum(std::array{2, 3, 4});
  static_assert(answer == 9);
  std::cout << answer;
}

```

Original program output:

```text
9
```

The constexpr variable and static_assert establish a compile-time check independently of whether a runtime optimizer would fold an expression.

Pitfall: const alone does not make a runtime-derived value a constant expression. Compiler optimization is not evidence of a language-level constant-evaluation guarantee.

Question: Which statement correctly describes this example’s contract?

1. Every constexpr call must execute at compile time
2. constexpr permits both suitable compile-time and runtime calls
3. const always implies a constant expression

Answer: 2. constexpr permits both suitable compile-time and runtime calls. The constexpr variable and static_assert establish a compile-time check independently of whether a runtime optimizer would fold an expression.

### Run the starter, then try a change

Open `native/examples/gap-constexpr-validation.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/gap-constexpr-validation.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::cout << answer;
```

With

```cpp
std::cout << sum(std::array{1, 1, 1});
```

Rerun the terminal command. Compare the printed sums. Can this constexpr function also supply an ordinary result outside static_assert?

## Destroy polymorphic owners through a virtual interface

Before this chapter: [Forward a callable without inventing ownership](../templates/README.md)

New terms and notation:

static has different meanings by context. A static data member belongs to the type rather than each object; a static local keeps its value between calls; static on a namespace-level helper limits its visibility to that translation unit.

Deleting a derived object through a base pointer requires an appropriate virtual destructor for ordinary polymorphic deletion. Virtual member dispatch and virtual destruction are distinct parts of the interface. An owning base pointer also commits the API to a specific ownership and deletion model.

```cpp
#include <iostream>
#include <memory>

struct Base {
  inline static int destroyed = 0;
  virtual ~Base() { ++destroyed; }
  virtual int value() const = 0;
};
struct Derived : Base {
  inline static int destroyed = 0;
  ~Derived() override { ++destroyed; }
  int value() const override { return 7; }
};
int main() {
  {
    std::unique_ptr<Base> owner = std::make_unique<Derived>();
    std::cout << owner->value() << " ";
  }
  std::cout << Base::destroyed << " " << Derived::destroyed;
}

```

Original program output:

```text
7 1 1
```

The virtual call returns the derived implementation, and both destruction counters advance when the unique_ptr leaves scope.

Pitfall: A base with virtual methods does not automatically receive a virtual destructor. Do not demonstrate the broken deletion case by executing undefined behavior.

Question: Which statement correctly describes this example’s contract?

1. Any virtual method makes the destructor virtual
2. unique_ptr fixes every invalid base deletion
3. Polymorphic deletion needs an appropriate virtual destructor

Answer: 3. Polymorphic deletion needs an appropriate virtual destructor. The virtual call returns the derived implementation, and both destruction counters advance when the unique_ptr leaves scope.

### Run the starter, then try a change

Open `native/examples/gap-virtual-destruction.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/gap-virtual-destruction.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
owner->value()
```

With

```cpp
owner->value() + 1
```

Rerun the terminal command. Compare the leading value with the two destruction counters. Does changing the caller’s calculation change which destructors run?

## Chapter project

Build a constrained generic wrapper with explicit lifetime and exception contracts.
