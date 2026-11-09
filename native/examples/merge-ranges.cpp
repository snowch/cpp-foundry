#include <algorithm>
#include <iostream>
#include <iterator>
#include <vector>

int main() {
    std::vector<int> left{1, 4, 8}, right{2, 4, 9}, result;
    std::merge(left.begin(), left.end(), right.begin(), right.end(),
               std::back_inserter(result));
    for (int value : result)
        std::cout << value;
    std::cout << "\n";
}
