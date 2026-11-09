#include <iostream>
#include <limits>
#include <optional>

std::optional<unsigned> multiply(unsigned a, unsigned b) {
    if (a != 0 && b > std::numeric_limits<unsigned>::max() / a)
        return std::nullopt;
    return a * b;
}

int main() {
    std::cout << *multiply(6, 7)
              << " overflow=" << !multiply(std::numeric_limits<unsigned>::max(), 2)
              << "\n";
}
