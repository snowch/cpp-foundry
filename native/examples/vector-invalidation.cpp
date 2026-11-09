#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{10, 20};
    std::size_t chosen = 1;
    values.reserve(100);
    values.push_back(30);
    std::cout << values.at(chosen) << " size=" << values.size() << "\n";
}
