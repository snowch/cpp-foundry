# Templates and generic interfaces

Deduce types, constrain operations, and distinguish compile-time choices.

## Template argument deduction follows the parameter pattern

A function template can infer a type from its arguments. For a by-value parameter, deduction produces a value type suitable for the local parameter, while a reference parameter preserves a borrowing relationship.

Deduction and conversion are separate stages. When arguments imply conflicting template types, an explicit design choice may be needed instead of assuming arithmetic conversions will reconcile them.

```cpp
#include <iostream>

template <class T> T maximum(T a, T b) {
    return a < b ? b : a;
}

int main() {
    std::cout << maximum(3, 7) << "\n";
    std::cout << maximum<double>(3, 7.5) << "\n";
}

```

Expected output:

```text
7
7.5
```

The first call deduces int. The second explicitly chooses double so both arguments are accepted in that domain.

Pitfall: maximum(3,7.5) does not deduce a single T merely because both arguments are arithmetic.

Question: Why does the second call name double explicitly?

1. To enable runtime dispatch
2. To allocate the result
3. To choose one shared parameter type

Answer: 3. The explicit template argument resolves the intended common domain.

Experiment: Attempt the mixed call without an explicit argument and read the conflicting-deduction diagnostic before designing an overload.

## A requires expression can check an operation

A requires expression asks whether a particular expression or declaration is well-formed for a candidate type. A concept packages that structural requirement into a reusable interface constraint.

A syntactic requirement cannot prove all semantic promises. A method named size could still return an incorrect count; tests and documentation carry that additional contract.

```cpp
#include <concepts>
#include <iostream>
#include <vector>

template <class T>
concept Sized = requires(const T &value) {
    { value.size() } -> std::convertible_to<std::size_t>;
};
template <Sized T> std::size_t count(const T &value) {
    return value.size();
}

int main() {
    std::vector<int> values{1, 2, 3};
    std::cout << count(values) << "\n";
}

```

Expected output:

```text
3
```

vector satisfies the size-expression requirement and its result can convert to size_t.

Pitfall: A concept that checks an expression does not automatically check complexity, lifetime, or thread-safety guarantees.

Question: What does Sized establish?

1. That every size implementation is correct
2. That size is always constant time
3. That the required size expression is well-formed

Answer: 3. The requirement is structural; semantic promises remain separate.

Experiment: Create a small user type satisfying Sized and a type without size. Compare the accepted call with the constraint diagnostic.

## Select a compile-time branch

if constexpr discards one branch during template instantiation according to a constant condition. This lets an implementation use operations available only for certain types without requiring the discarded branch to be valid for that instantiation.

Ordinary if chooses at runtime and generally still requires both branch bodies to be well-formed.

```cpp
#include <iostream>
#include <type_traits>

template <class T> void print_kind(T) {
    if constexpr (std::is_integral_v<T>)
        std::cout << "integral\n";
    else
        std::cout << "other\n";
}

int main() {
    print_kind(3);
    print_kind(3.5);
}

```

Expected output:

```text
integral
other
```

The two calls instantiate different compile-time branches from the same template definition.

Pitfall: A runtime variable cannot be used as the condition of if constexpr unless it is a usable constant expression.

Question: When is this branch selected?

1. At every loop iteration
2. During linking based on input data
3. During template instantiation

Answer: 3. The condition depends on a compile-time type trait.

Experiment: Add a branch that calls a method only present on one user type. Contrast an ordinary if with if constexpr.

## Constexpr permits evaluation in constant-expression contexts

A constexpr function can participate in compile-time evaluation when its arguments and operations satisfy the constant-expression rules. It can also be called at runtime.

Use static_assert to check a compile-time property, and ordinary validation for runtime inputs. constexpr does not imply that every invocation must execute during compilation.

```cpp
#include <iostream>

constexpr int triangle(int n) {int total=0;for(int i=1;i<=n;++i)total+=i;return total;}

int main() {
    static_assert(triangle(4)==10);
    int input=5;
    std::cout << triangle(input) << "\n";
}

```

Expected output:

```text
15
```

The assertion requires a compile-time result for four. The ordinary call remains a valid function call for the local input.

Pitfall: Compile-time evaluation still has arithmetic and resource limits; overflowing a signed result is not made valid by constexpr.

Question: Does constexpr force every call to be compile-time?

1. Yes
2. Only for int return types
3. No

Answer: 3. It enables constant evaluation where the context requires or permits it.

Experiment: Add static assertions for zero and one. Specify a bounded input domain that keeps the sum representable.

## Forward a callable without inventing ownership

A forwarding reference can preserve an argument’s value category through a generic wrapper. std::forward is used with the deduced template parameter when passing that argument onward.

Forwarding is useful at API boundaries, but it does not extend an object’s lifetime. Returning or storing a forwarded reference still needs an ownership and lifetime plan.

```cpp
#include <functional>
#include <iostream>
#include <utility>

template <class F, class T> void invoke_once(F &&function, T &&value) {
    std::invoke(std::forward<F>(function), std::forward<T>(value));
}

int main() {
    int total = 0;
    auto add = [&](int value) { total += value; };
    invoke_once(add, 4);
    invoke_once([](int value) { std::cout << value << "\n"; }, 9);
    std::cout << total << "\n";
}

```

Expected output:

```text
9
4
```

The wrapper invokes an lvalue lambda and a temporary lambda without making them persistent owners. Each call completes before its arguments expire.

Pitfall: Using std::move unconditionally in a forwarding wrapper can move from a caller’s lvalue unexpectedly.

Question: Why use forward with a deduced parameter?

1. To always copy the object
2. To preserve the caller argument category
3. To keep temporaries alive forever

Answer: 2. The wrapper preserves rather than unconditionally changes the argument category.

Experiment: Wrap a move-only callable and test passing it as an lvalue and as a temporary. Avoid returning a borrowed reference from the wrapper.

## Chapter project

Write a constrained, checked aggregation interface.
