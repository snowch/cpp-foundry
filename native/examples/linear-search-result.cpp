#include <array>
#include <iostream>
#include <optional>
#include <span>

std::optional<std::size_t> find(std::span<const int> values, int key) {
    for (std::size_t i = 0; i < values.size(); ++i)
        if (values[i] == key)
            return i;
    return std::nullopt;
}

int main() {
    const std::array<int, 4> values{8, 3, 8, 1};
    auto found = find(values, 8);
    if (found)
        std::cout << "first=" << *found << "\n";
    std::cout << "missing=" << !find(values, 9) << "\n";
}
