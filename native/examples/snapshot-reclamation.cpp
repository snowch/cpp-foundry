#include <iostream>
#include <memory>

int main() {
    auto current = std::make_shared<const int>(10);
    auto reader = current;
    std::weak_ptr<const int> old = current;
    current = std::make_shared<const int>(20);
    std::cout << "retained=" << !old.expired() << " ";
    reader.reset();
    std::cout << "released=" << old.expired() << "\n";
}
