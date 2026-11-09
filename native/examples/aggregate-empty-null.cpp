#include <iostream>
#include <optional>
#include <vector>

int main() {
    const std::vector<std::optional<int>> values{0, std::nullopt, 5};
    unsigned present = 0;
    std::optional<int> sum;
    for (auto value : values)
        if (value) {
            ++present;
            sum = sum.value_or(0) + *value;
        }
    std::cout << "rows=" << values.size() << " present=" << present << " sum=" << *sum
              << "\n";
}
