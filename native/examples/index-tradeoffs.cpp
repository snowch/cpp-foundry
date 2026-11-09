#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> index{1, 4, 9};
    auto position = std::lower_bound(index.begin(), index.end(), 5);
    auto shifted = index.end() - position;
    index.insert(position, 5);
    std::cout << "shifted=" << shifted << "\n";
    for (int key : index)
        std::cout << key;
    std::cout << "\n";
}
