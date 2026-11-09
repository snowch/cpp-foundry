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
    const std::vector<unsigned char> bytes{1, 2, 3};
    std::size_t at = 0;
    try {
        get32(bytes, at);
    } catch (const std::exception &error) {
        std::cout << error.what() << " cursor=" << at << "\n";
    }
}
