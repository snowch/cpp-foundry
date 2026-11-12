#include <algorithm>
#include <iostream>
#include <ranges>
#include <type_traits>
#include <vector>

int main() {
  std::vector<int> v{2, 4, 6};
  auto it = std::ranges::find(v, 4);
  using Result = decltype(std::ranges::find(std::vector<int>{2, 4}, 4));
  std::cout << *it << " " << std::is_same_v<Result, std::ranges::dangling>;
}
