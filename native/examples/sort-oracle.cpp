#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    const std::vector<int> input{3, -1, 3, 0};
    auto result = input;
    std::ranges::sort(result);
    const std::vector<int> expected{-1, 0, 3, 3};
    bool correct = std::ranges::is_sorted(result) && result == expected;
    std::cout << "verified=" << correct << "\n";
    return correct ? 0 : 1;
}
