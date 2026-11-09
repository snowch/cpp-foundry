#include <iostream>
#include <limits>
#include <optional>
std::optional<int> add(int a, int b) {
    if (b > 0 && a > std::numeric_limits<int>::max() - b) return std::nullopt;
    if (b < 0 && a < std::numeric_limits<int>::min() - b) return std::nullopt;
    return a + b;
}
int main() {
    auto total = add(20, 22);
    if (total) std::cout << *total << '\n';
    std::cout << "overflow rejected="
              << !add(std::numeric_limits<int>::max(), 1) << '\n';
}
