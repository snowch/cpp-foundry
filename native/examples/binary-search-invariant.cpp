#include <array>
#include <iostream>
#include <span>

std::size_t lower(std::span<const int> values, int key) {
    std::size_t first = 0, last = values.size();
    while (first < last) {
        auto middle = first + (last - first) / 2;
        if (values[middle] < key)
            first = middle + 1;
        else
            last = middle;
    }
    return first;
}

int main() {
    const std::array<int, 5> values{1, 3, 3, 5, 9};
    std::cout << lower(values, 3) << " " << lower(values, 4) << " " << lower(values, 10)
              << "\n";
}
