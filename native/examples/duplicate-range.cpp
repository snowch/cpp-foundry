#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{1, 3, 3, 3, 8};
    auto first = std::lower_bound(values.begin(), values.end(), 3);
    auto last = std::upper_bound(values.begin(), values.end(), 3);
    std::cout << "matches=" << last - first << "\n";
}
