#include <cstddef>
#include <iostream>
#include <limits>

int main() {
    auto fits = [](std::size_t size, std::size_t offset, std::size_t length) {
        return offset <= size && length <= size - offset;
    };
    std::cout << fits(8, 4, 4) << " " << fits(8, 9, 0) << " "
              << fits(8, 1, std::numeric_limits<std::size_t>::max()) << "\n";
}
