#include <algorithm>
#include <iostream>
#include <iterator>
#include <vector>

int main() {
  std::vector<int> a{1, 2, 3}, b;
  std::transform(a.begin(), a.end(), std::back_inserter(b),
                 [](int n) { return n * n; });
  for (int n : b)
    std::cout << n << " ";
}
