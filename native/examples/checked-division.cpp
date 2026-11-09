#include <iostream>
#include <limits>
#include <optional>

std::optional<int> divide(int a, int b) {
    if (b == 0 || (a == std::numeric_limits<int>::min() && b == -1))
        return std::nullopt;
    return a / b;
}

int main() {
    std::cout << *divide(9, 2) << " zero=" << !divide(1, 0)
              << " minimum=" << !divide(std::numeric_limits<int>::min(), -1) << "\n";
}
