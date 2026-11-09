#include <array>
#include <iostream>

int main() {
    const std::array<int, 3> values{3, 1, 4};
    int sum = 0;
    for (std::size_t i = 0; i < values.size(); ++i) {
        std::cout << i << ":" << sum << "\n";
        sum += values[i];
    }
    std::cout << "total=" << sum << "\n";
}
