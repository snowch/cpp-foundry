#include <functional>
#include <iostream>
#include <tuple>

int main() {
  auto arguments = std::tuple{3, 4};
  auto add = [](int a, int b) { return a + b; };
  std::cout << std::apply(add, arguments) << " ";
  int n = 2;
  auto refs = std::tie(n);
  std::get<0>(refs) = 9;
  std::cout << n;
}
