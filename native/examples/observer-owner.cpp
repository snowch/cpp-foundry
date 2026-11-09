#include <iostream>
#include <memory>

int main() {
    auto owner = std::make_unique<int>(42);
    int *observer = owner.get();
    std::cout << *observer << "\n";
    owner.reset();
    observer = nullptr;
    std::cout << "empty=" << !owner << "\n";
}
