#include <array>
#include <iostream>
#include <span>

int main() {
    std::array<int, 3> values{1, 2, 3};
    std::span<int> middle(values.data() + 1, 1);
    middle.front() = 9;
    std::span<const int> read_only(values);
    for (int value : read_only)
        std::cout << value;
    std::cout << "\n";
}
