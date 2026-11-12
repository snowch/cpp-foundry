#include <concepts>
#include <iostream>

template <class T>
concept Addable = requires(T a, T b) {
  { a + b } -> std::convertible_to<T>;
};
template <Addable T> T combine(T a, T b) { return a + b; }
int main() { std::cout << combine(2, 3) << " " << Addable<int>; }
