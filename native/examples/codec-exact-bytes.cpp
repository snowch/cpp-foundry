#include <cstdint>
#include <iostream>
#include <span>
#include <stdexcept>
#include <vector>

void put32(std::vector<unsigned char> &bytes, std::uint32_t value) {
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
}
std::uint32_t get32(std::span<const unsigned char> bytes, std::size_t &at) {
    if (at > bytes.size() || bytes.size() - at < 4)
        throw std::runtime_error("truncated");
    std::uint32_t value = 0;
    for (unsigned i = 0; i < 4; ++i)
        value |= std::uint32_t(bytes[at++]) << (i * 8);
    return value;
}

int main() {
    std::vector<unsigned char> actual;
    put32(actual, 0x01020304u);
    const std::vector<unsigned char> expected{4, 3, 2, 1};
    std::cout << "exact=" << (actual == expected) << "\n";
    return actual == expected ? 0 : 1;
}
