#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{9, 1, 7, 3, 5};
    auto middle = values.begin() + 2;
    std::nth_element(values.begin(), middle, values.end());
    std::cout << "median=" << *middle << "\n";
}
