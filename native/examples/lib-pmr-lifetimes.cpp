#include <array>
#include <cstddef>
#include <iostream>
#include <memory_resource>
#include <vector>

int main() {
  std::array<std::byte, 512> buffer{};
  std::pmr::monotonic_buffer_resource arena(buffer.data(), buffer.size(),
                                            std::pmr::null_memory_resource());
  {
    std::pmr::vector<int> values(&arena);
    values.reserve(4);
    values.push_back(7);
    std::cout << values.front();
  }
  arena.release();
}
