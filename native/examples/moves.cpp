#include <iostream>
#include <memory>
#include <string>
#include <utility>
int main() {
    auto first = std::make_unique<std::string>("page 7");
    auto second = std::move(first);
    std::cout << "first empty=" << !first << '\n';
    std::cout << "second=" << *second << '\n';
    second.reset();
    std::cout << "second empty=" << !second << '\n';
}
