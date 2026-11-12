#include <array>
#include <iostream>

constexpr int sum(const std::array<int, 3> &values) {
  int total = 0;
  for (int n : values)
    total += n;
  return total;
}
int main() {
  constexpr auto answer = sum(std::array{2, 3, 4});
  static_assert(answer == 9);
  std::cout << answer;
}
