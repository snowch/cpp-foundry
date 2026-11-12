#include <iostream>
#include <random>

int main() {
  std::mt19937 a(123), b(123);
  bool same = true;
  for (int i = 0; i < 10; ++i)
    same = same && (a() == b());
  std::mt19937 engine(456);
  std::uniform_int_distribution<int> die(1, 6);
  bool bounded = true;
  for (int i = 0; i < 100; ++i) {
    int n = die(engine);
    bounded = bounded && (n >= 1 && n <= 6);
  }
  std::cout << same << " " << bounded;
}
