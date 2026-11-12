#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 4, 3};
  for (auto it = v.begin(); it != v.end();) {
    if (*it % 2 == 0)
      it = v.erase(it);
    else
      ++it;
  }
  for (int n : v)
    std::cout << n;
}
