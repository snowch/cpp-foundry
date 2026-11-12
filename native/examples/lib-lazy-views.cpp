#include <iostream>
#include <ranges>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 3, 4};
  auto even = v | std::views::filter([](int n) { return n % 2 == 0; }) |
              std::views::transform([](int n) { return n * n; });
  for (int n : even)
    std::cout << n << " ";
}
