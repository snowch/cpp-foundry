#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{1, 2, 3};
    std::size_t size = values.size();
    std::cout << "elements=" << size << "\n";
}
