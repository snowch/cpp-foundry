#include <array>
#include <cstdint>
#include <iostream>

int main() {
    std::uint32_t value = 256;
    std::array<unsigned char, 4> actual{};
    for (unsigned i = 0; i < 4; ++i)
        actual[i] = static_cast<unsigned char>((value >> (8 * i)) & 255u);
    const std::array<unsigned char, 4> expected{0, 1, 0, 0};
    std::cout << "fixture=" << (actual == expected) << "\n";
    return actual == expected ? 0 : 1;
}
