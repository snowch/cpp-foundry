#include <array>
#include <iostream>
#include <span>

std::size_t inspections(std::span<const int> values, int key) {
    std::size_t count = 0;
    for (int value : values) {
        ++count;
        if (value == key)
            break;
    }
    return count;
}

int main() {
    const std::array<int, 4> values{2, 4, 6, 8};
    std::cout << "absent=" << inspections(values, 7)
              << " first=" << inspections(values, 2) << "\n";
}
