#include <iostream>
#include <utility>

int main() {
    int negative = -1;
    unsigned positive = 1;
    std::cout << "less=" << std::cmp_less(negative, positive)
              << " equal=" << std::cmp_equal(negative, positive) << "\n";
}
