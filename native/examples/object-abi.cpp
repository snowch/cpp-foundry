#include <array>
#include <cstdint>
#include <iostream>

int main() {
    std::array<unsigned char, 4> bytes{0x78, 0x56, 0x34, 0x12};
    std::uint32_t value = 0;
    for (unsigned i = 0; i < 4; ++i)
        value |= std::uint32_t(bytes[i]) << (8 * i);
    std::cout << std::hex << value << "\n";
}
