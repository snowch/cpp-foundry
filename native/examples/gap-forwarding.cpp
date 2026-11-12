#include <iostream>
#include <utility>

void consume(int &) { std::cout << "lvalue "; }
void consume(int &&) { std::cout << "rvalue "; }
template <class T> void relay(T &&value) { consume(std::forward<T>(value)); }
int main() {
  int n = 3;
  relay(n);
  relay(3);
}
