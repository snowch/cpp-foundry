#include <climits>
#include <cstdint>
#include <iostream>
#include <limits>

int main() {
    static_assert(CHAR_BIT==8);static_assert(std::numeric_limits<std::uint32_t>::digits==32);
    std::cout<<"octets=8 uint32=32\n";
}
