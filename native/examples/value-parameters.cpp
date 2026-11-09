#include <iostream>
#include <string>

std::string decorate(std::string value) {
    value += "!";
    return value;
}

int main() {
    std::string original = "Ada";
    std::cout << decorate(original) << "\n";
    std::cout << original << "\n";
}
