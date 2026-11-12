#include <functional>
#include <iostream>
#include <memory>

int main() {
  int n = 3;
  std::function<int(int)> by_value = [n](int x) { return n + x; };
  auto owner = [p = std::make_unique<int>(5)](int x) { return *p + x; };
  n = 9;
  std::cout << by_value(2) << " " << owner(2);
}
