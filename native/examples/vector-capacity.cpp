#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{1, 2};
    values.reserve(20);
    std::cout << "size=" << values.size() << " enough=" << (values.capacity() >= 20)
              << "\n";
    values.resize(4);
    std::cout << values.at(2) << " " << values.at(3) << "\n";
}
