#include <iostream>
#include <vector>

int main() {
  std::vector<int> v;
  v.reserve(8);
  v.push_back(3);
  auto index = v.size() - 1;
  v.reserve(32);
  std::cout << v.size() << " " << v.at(index);
}
