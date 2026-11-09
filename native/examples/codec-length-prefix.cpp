#include <iostream>
#include <span>
#include <stdexcept>
#include <string>
#include <vector>

std::string name(std::span<const unsigned char> bytes) {
    if (bytes.empty())
        throw std::runtime_error("missing length");
    auto length = bytes[0];
    if (!length || length > 63 || length > bytes.size() - 1)
        throw std::runtime_error("invalid length");
    return std::string(bytes.begin() + 1, bytes.begin() + 1 + length);
}

int main() {
    const std::vector<unsigned char> bytes{3, 'A', 'd', 'a'};
    std::cout << name(bytes) << "\n";
}
