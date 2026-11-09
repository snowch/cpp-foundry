#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{2, 4, 6};
    auto found = std::find(values.begin(), values.end(), 4);
    if (found != values.end())
        std::cout << *found << "\n";
    std::cout << "absent="
              << (std::find(values.begin(), values.end(), 9) == values.end()) << "\n";
}
