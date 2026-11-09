#include <iostream>
#include <set>
#include <vector>

int main() {
    std::vector<int> input{3, 1, 3, 2};
    std::set<int> unique(input.begin(), input.end());
    for (int value : unique)
        std::cout << value;
    std::cout << " input=" << input.size() << " unique=" << unique.size() << "\n";
}
