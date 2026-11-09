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
    const std::array<int, 8> values{1, 2, 3, 4, 5, 6, 7, 8};
    auto small = inspections(std::span(values).first(4), 99);
    auto large = inspections(values, 99);
    std::cout << small << " " << large << " ratio=" << large / small << "\n";
}
