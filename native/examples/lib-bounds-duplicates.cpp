#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 2, 2, 4};
  auto [first, last] = std::equal_range(v.begin(), v.end(), 2);
  std::cout << (first - v.begin()) << " " << (last - first);
}
