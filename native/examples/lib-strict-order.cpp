#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{3, 1, 3, 2};
  std::stable_sort(v.begin(), v.end(), [](int a, int b) { return a < b; });
  std::cout << std::is_sorted(v.begin(), v.end()) << " "
            << std::binary_search(v.begin(), v.end(), 3);
}
