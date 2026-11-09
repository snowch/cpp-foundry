#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{2, 4, 6, 9, 11};
    auto boundary = std::partition_point(values.begin(), values.end(),
                                         [](int value) { return value < 8; });
    std::cout << "prefix=" << boundary - values.begin() << " next=" << *boundary
              << "\n";
}
