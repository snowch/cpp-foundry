#include <bit>
#include <cstdint>
#include <iostream>
#include <limits>

int main() {
  std::uint32_t mask = 0b10110;
  std::cout << std::popcount(mask) << " " << std::bit_width(mask) << " "
            << std::has_single_bit(std::uint32_t{8});
}
