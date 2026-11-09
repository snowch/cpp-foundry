#include <array>
#include <iostream>
#include <span>

int total(std::span<const int> values) {
    if (values.empty())
        return 0;
    if (values.size() == 1)
        return values.front();
    auto middle = values.size() / 2;
    return total(values.first(middle)) + total(values.subspan(middle));
}

int main() {
    const std::array<int, 5> values{2, 3, 4, 5, 6};
    std::cout << total(values) << "\n";
}
