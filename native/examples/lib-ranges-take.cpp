#include <iostream>
#include <ranges>

int main() {
  auto values = std::views::iota(1) | std::views::take(4);
  for (int n : values)
    std::cout << n << " ";
}
