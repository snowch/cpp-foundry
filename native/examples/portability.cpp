#include <climits>
#include <cstdint>
#include <iostream>
#include <limits>
static_assert(CHAR_BIT == 8,"CPF1 requires octets");
static_assert(std::numeric_limits<std::uint32_t>::digits == 32);
int main() {
    std::cout << "byte bits=" << CHAR_BIT << '\n';
    std::cout << "uint32 bits=" << std::numeric_limits<std::uint32_t>::digits << '\n';
    std::cout << "portable format uses explicit bytes\n";
}
