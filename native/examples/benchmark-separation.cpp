#include <array>
#include <iostream>

int main() {
    const std::array<int, 5> values{1, 2, 3, 4, 5};
    unsigned comparisons = 0;
    for (int value : values) {
        ++comparisons;
        if (value == 99)
            break;
    }
    std::cout << "input=" << values.size() << " key_comparisons=" << comparisons
              << "\n";
}
