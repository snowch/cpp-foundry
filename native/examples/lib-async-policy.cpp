#include <future>
#include <iostream>

int main() {
  int calls = 0;
  auto result = std::async(std::launch::deferred, [&] {
    ++calls;
    return 9;
  });
  std::cout << calls << " ";
  auto value = result.get();
  std::cout << calls << " " << value;
}
