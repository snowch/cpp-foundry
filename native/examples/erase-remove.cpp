#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{1, 2, 3, 4, 5};
    auto removed = std::erase_if(values, [](int value) { return value % 2 == 0; });
    std::cout << "removed=" << removed << " remaining=" << values.size() << "\n";
    for (int value : values)
        std::cout << value;
    std::cout << "\n";
}
