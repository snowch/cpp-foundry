#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 2, 3};
  auto end = std::remove(v.begin(), v.end(), 2);
  std::cout << v.size() << " " << (end - v.begin()) << " ";
  v.erase(end, v.end());
  std::cout << v.size();
}
