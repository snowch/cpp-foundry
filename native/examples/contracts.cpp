#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <vector>
void require(bool condition) {
    if (!condition) throw std::runtime_error("contract failed");
}
int main() {
    std::vector<int> values{3,1,2,1};
    std::ranges::sort(values);
    require(values == std::vector<int>({1,1,2,3}));
    auto first=values;
    std::ranges::sort(values);
    require(values == first);
    std::vector<int> empty;
    std::ranges::sort(empty);
    require(empty.empty());
    std::cout << "3 contracts passed\n";
}
