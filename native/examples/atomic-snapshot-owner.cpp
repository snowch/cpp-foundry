#include <atomic>
#include <iostream>
#include <memory>
#include <vector>

int main() {
    using Snapshot = std::shared_ptr<const std::vector<int>>;
    std::atomic<Snapshot> current{
        std::make_shared<const std::vector<int>>(std::initializer_list<int>{1, 2})};
    auto old = current.load();
    current.store(
        std::make_shared<const std::vector<int>>(std::initializer_list<int>{3, 4}));
    std::cout << old->at(0) << " " << current.load()->at(0) << "\n";
}
