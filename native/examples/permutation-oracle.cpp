#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> input{1, 2, 3};
    unsigned cases = 0;
    bool valid = true;
    do {
        auto result = input;
        std::ranges::sort(result);
        valid = valid && (result == std::vector<int>{1, 2, 3});
        ++cases;
    } while (std::next_permutation(input.begin(), input.end()));
    std::cout << "cases=" << cases << " valid=" << valid << "\n";
    return valid ? 0 : 1;
}
