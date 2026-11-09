#include <iostream>
#include <memory>
#include <vector>

int main() {
    auto current =
        std::make_shared<const std::vector<int>>(std::initializer_list<int>{1, 2, 3});
    auto reader = current;
    current =
        std::make_shared<const std::vector<int>>(std::initializer_list<int>{2, 3});
    std::cout << "old_size=" << reader->size() << " new_size=" << current->size()
              << "\n";
}
