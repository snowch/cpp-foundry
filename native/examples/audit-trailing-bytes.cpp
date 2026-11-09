#include <cstddef>
#include <iostream>

int main() {
    auto complete = [](std::size_t consumed, std::size_t size) {
        return consumed == size;
    };
    std::cout << "exact=" << complete(8, 8) << " trailing=" << complete(8, 9) << "\n";
}
