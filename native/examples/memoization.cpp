#include <array>
#include <iostream>
#include <optional>

unsigned fib(unsigned n, std::array<std::optional<unsigned>, 11> &memo) {
    if (n < 2)
        return n;
    if (memo.at(n))
        return *memo[n];
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
    return *memo[n];
}

int main() {
    std::array<std::optional<unsigned>, 11> memo{};
    std::cout << fib(10, memo) << "\n";
}
