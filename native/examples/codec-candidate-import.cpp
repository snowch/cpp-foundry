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
    std::vector<std::uint32_t> live{7, 8};
    const std::vector<unsigned char> truncated{1, 0, 0, 0};
    try {
        std::size_t at = 0;
        std::vector<std::uint32_t> candidate;
        candidate.push_back(get32(truncated, at));
        candidate.push_back(get32(truncated, at));
        live.swap(candidate);
    } catch (const std::exception &) {
        std::cout << "rejected ";
    }
    std::cout << live[0] << "," << live[1] << "\n";
}
